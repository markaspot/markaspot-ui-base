#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (!arg.startsWith('--')) {
        continue;
    }
    const [key, inlineValue] = arg.slice(2).split('=', 2);
    if (inlineValue !== undefined) {
        args.set(key, inlineValue);
    } else {
        args.set(key, process.argv[i + 1]);
        i += 1;
    }
}

const fixturePath = args.get('fixture');
const apiHost = (args.get('api-host') || 'https://dev.ddev.site').replace(/\/+$/, '');
const requestCount = Number.parseInt(args.get('requests') || '1000', 10);
const concurrency = Number.parseInt(args.get('concurrency') || '8', 10);
const crossTenantProbes = Number.parseInt(args.get('cross-tenant-probes') || '0', 10);
const apiKey = args.get('api-key') || process.env.GEOREPORT_API_KEY;
const runId = args.get('run-id') || process.env.GROUP_INTEGRITY_LOAD_RUN_ID || Date.now().toString(36);

if (!fixturePath) {
    throw new Error('Missing --fixture path.');
}
if (!apiKey || apiKey === '*') {
    throw new Error('Missing GeoReport API key. Pass --api-key or set GEOREPORT_API_KEY.');
}
if (!Number.isInteger(requestCount) || requestCount < 1) {
    throw new Error('--requests must be a positive integer.');
}
if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error('--concurrency must be a positive integer.');
}
if (!Number.isInteger(crossTenantProbes) || crossTenantProbes < 0) {
    throw new Error('--cross-tenant-probes must be a non-negative integer.');
}

const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
const categories = fixture.categories || [];
const jurisdictionsById = new Map((fixture.jurisdictions || []).map(jurisdiction => [
    Number(jurisdiction.id),
    jurisdiction
]));
const tenantAdminsByJurisdictionId = new Map((fixture.tenant_admins || []).map(tenantAdmin => [
    Number(tenantAdmin.jurisdiction_id),
    tenantAdmin
]));
if (categories.length === 0) {
    throw new Error(`Fixture ${fixturePath} contains no categories.`);
}

const postEndpoint = new URL('/georeport/v2/requests.json', apiHost);
const createdRequests = [];
const crossTenantResults = {
    requested: crossTenantProbes,
    ok: 0,
    failed: 0,
    skipped: false,
    failures: []
};

const results = {
    ok: 0,
    failed: 0,
    statusCodes: new Map(),
    failures: []
};

function payloadFor(index) {
    const category = categories[index % categories.length];
    const jurisdiction = jurisdictionsById.get(Number(category.jurisdiction_id));
    const baseLat = Number.parseFloat(jurisdiction?.lat ?? 52.3400);
    const baseLong = Number.parseFloat(jurisdiction?.long ?? 4.8900);
    const lat = baseLat + ((index % 5) * 0.0001);
    const long = baseLong + ((Math.floor(index / 5) % 5) * 0.0001);
    const params = new URLSearchParams();
    params.set('jurisdiction_id', String(category.jurisdiction_id));
    params.set('service_code', category.service_code);
    params.set('description', `Group integrity load request ${index + 1} for ${category.service_code}`);
    params.set('email', `integrity-load-${runId}-${index + 1}@example.test`);
    params.set('lat', lat.toFixed(6));
    params.set('long', long.toFixed(6));
    params.set('country_code', 'NL');
    params.set('address_string', `Integrity Load Street ${index + 1}, 1012 AB Amsterdam, Netherlands`);
    return params;
}

async function postOne(index) {
    const response = await fetch(postEndpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Acknowledge-Duplicate': 'true'
        },
        body: payloadFor(index)
    });
    const status = response.status;
    results.statusCodes.set(status, (results.statusCodes.get(status) || 0) + 1);

    if (status >= 200 && status < 300) {
        results.ok += 1;
        const body = await response.json().catch(() => null);
        const requestId = body?.service_requests?.request?.service_request_id;
        if (requestId) {
            const category = categories[index % categories.length];
            createdRequests.push({
                id: String(requestId),
                jurisdiction_id: category.jurisdiction_id,
                tenant_api_key: tenantAdminsByJurisdictionId.get(Number(category.jurisdiction_id))?.api_key || apiKey
            });
        }
        return;
    }

    results.failed += 1;
    if (results.failures.length < 10) {
        results.failures.push({
            index: index + 1,
            status,
            body: await response.text()
        });
    }
}

async function updateOne(index) {
    if (createdRequests.length === 0) {
        return postOne(index);
    }

    const request = createdRequests[index % createdRequests.length];
    const requestId = request.id;
    const url = new URL(`/georeport/v2/requests/${encodeURIComponent(requestId)}.json`, apiHost);
    url.searchParams.set('api_key', request.tenant_api_key || apiKey);
    url.searchParams.set('jurisdiction_id', String(request.jurisdiction_id));
    const params = new URLSearchParams();
    params.set('jurisdiction_id', String(request.jurisdiction_id));
    params.set('description', `Group integrity load update ${index + 1} for ${requestId}`);
    params.set('extended_attributes[drupal][revision_log_message]', `Integrity load update ${index + 1}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
    });
    const status = response.status;
    results.statusCodes.set(status, (results.statusCodes.get(status) || 0) + 1);

    if (status >= 200 && status < 300) {
        results.ok += 1;
        return;
    }

    results.failed += 1;
    if (results.failures.length < 10) {
        results.failures.push({
            index: index + 1,
            operation: 'update',
            status,
            body: await response.text()
        });
    }
}

async function getListOne(index) {
    const category = categories[index % categories.length];
    const url = new URL('/georeport/v2/requests.json', apiHost);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('jurisdiction_id', String(category.jurisdiction_id));
    url.searchParams.set('service_code', category.service_code);

    const response = await fetch(url, {
        headers: {
            Accept: 'application/json'
        }
    });
    const status = response.status;
    results.statusCodes.set(status, (results.statusCodes.get(status) || 0) + 1);

    if (status >= 200 && status < 300) {
        results.ok += 1;
        return;
    }

    results.failed += 1;
    if (results.failures.length < 10) {
        results.failures.push({
            index: index + 1,
            operation: 'get_list',
            status,
            body: await response.text()
        });
    }
}

async function runOperation(index) {
    const bucket = index % 10;
    if (bucket < 7) {
        return postOne(index);
    }
    if (bucket < 9) {
        return updateOne(index);
    }
    return getListOne(index);
}

let nextIndex = 0;
async function worker() {
    while (nextIndex < requestCount) {
        const index = nextIndex;
        nextIndex += 1;
        await runOperation(index);
        if ((index + 1) % 100 === 0) {
            console.log(`Posted ${index + 1}/${requestCount}`);
        }
    }
}

await Promise.all(Array.from({ length: Math.min(concurrency, requestCount) }, () => worker()));

async function runCrossTenantProbe(index, attacker, target) {
    const isUpdate = index % 2 === 0;
    const url = new URL(`/georeport/v2/requests/${encodeURIComponent(target.id)}.json`, apiHost);
    url.searchParams.set('api_key', attacker.api_key);

    const response = await fetch(url, {
        method: isUpdate ? 'POST' : 'GET',
        headers: {
            Accept: 'application/json',
            ...(isUpdate ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {})
        },
        body: isUpdate
            ? new URLSearchParams({
                status_notes: `Cross-tenant denied probe ${index + 1}`
            })
            : undefined
    });

    if (response.status === 403) {
        crossTenantResults.ok += 1;
        return;
    }

    crossTenantResults.failed += 1;
    if (crossTenantResults.failures.length < 10) {
        crossTenantResults.failures.push({
            index: index + 1,
            operation: isUpdate ? 'update' : 'get',
            status: response.status,
            attacker_jurisdiction_id: attacker.jurisdiction_id,
            target_jurisdiction_id: target.jurisdiction_id,
            target_request_id: target.id,
            body: await response.text()
        });
    }
}

async function runCrossTenantProbes() {
    if (crossTenantProbes === 0) {
        return;
    }

    const attackers = (fixture.tenant_admins || []).filter(tenantAdmin => tenantAdmin.api_key);
    const attacker = attackers[attackers.length - 1];
    const targets = createdRequests.filter(request => Number(request.jurisdiction_id) !== Number(attacker?.jurisdiction_id));
    if (!attacker || targets.length === 0) {
        crossTenantResults.skipped = true;
        return;
    }

    let nextProbe = 0;
    async function crossTenantWorker() {
        while (nextProbe < crossTenantProbes) {
            const index = nextProbe;
            nextProbe += 1;
            await runCrossTenantProbe(index, attacker, targets[index % targets.length]);
        }
    }

    await Promise.all(Array.from(
        { length: Math.min(concurrency, crossTenantProbes) },
        () => crossTenantWorker()
    ));
}

await runCrossTenantProbes();

console.log(JSON.stringify({
    requested: requestCount,
    ok: results.ok,
    failed: results.failed,
    created_request_ids: createdRequests.length,
    status_codes: Object.fromEntries([...results.statusCodes.entries()].sort()),
    failures: results.failures,
    cross_tenant: crossTenantResults
}, null, 2));

if (results.failed > 0 || crossTenantResults.failed > 0) {
    process.exitCode = 1;
}
