/**
 * GeoReport Auth Diagnostic Plugin
 *
 * Runs at server startup to verify GeoReport API authentication works correctly
 * for both API key (anonymous) and session (authenticated) scenarios.
 *
 * Authentication Methods:
 * 1. API Key (anonymous): Uses GEOREPORT_API_KEY - sees only published requests
 * 2. Session (authenticated): Uses Drupal session cookie - sees all requests including unpublished
 *
 * To test authenticated scenarios, set DRUPAL_TEST_SESSION_COOKIE env var.
 * Generate a session with: ddev exec ./scripts/get-drupal-session.sh 1 cookie
 */

interface TestResult {
    name: string
    success: boolean
    message: string
    details?: Record<string, unknown>
}

async function testApiKeyAuth(apiBase: string, apiKey: string): Promise<TestResult> {
    try {
        const url = `${apiBase}/georeport/v2/requests.json?extensions=true&api_key=${apiKey}&limit=5`;
        const response = await fetch(url, {
            headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
            return {
                name: 'API Key Auth',
                success: false,
                message: `HTTP ${response.status}`
            };
        }

        const data = await response.json();
        const requests = Array.isArray(data) ? data : data?.requests || [];
        const count = requests.length;
        const hasUnpublished = requests.some(
            (r: Record<string, unknown>) =>
                r?.extended_attributes &&
                (r.extended_attributes as Record<string, unknown>)?.markaspot &&
                ((r.extended_attributes as Record<string, unknown>).markaspot as Record<string, boolean>)?.published === false
        );

        return {
            name: 'API Key Auth',
            success: true,
            message: `${count} requests fetched`,
            details: {
                count,
                hasUnpublished,
                expectedBehavior: 'Should NOT see unpublished requests'
            }
        };
    } catch (err: unknown) {
        return {
            name: 'API Key Auth',
            success: false,
            message: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}

async function testSessionAuth(apiBase: string, sessionCookie: string): Promise<TestResult> {
    try {
        const url = `${apiBase}/georeport/v2/requests.json?extensions=true&limit=100`;
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
                Cookie: sessionCookie
            }
        });

        if (!response.ok) {
            return {
                name: 'Session Auth',
                success: false,
                message: `HTTP ${response.status}`
            };
        }

        const data = await response.json();
        const requests = Array.isArray(data) ? data : data?.requests || [];
        const count = requests.length;
        const unpublishedCount = requests.filter(
            (r: Record<string, unknown>) =>
                r?.extended_attributes &&
                (r.extended_attributes as Record<string, unknown>)?.markaspot &&
                ((r.extended_attributes as Record<string, unknown>).markaspot as Record<string, boolean>)?.published === false
        ).length;
        const publishedCount = count - unpublishedCount;

        return {
            name: 'Session Auth',
            success: true,
            message: `${count} requests (${publishedCount} published, ${unpublishedCount} unpublished)`,
            details: {
                count,
                publishedCount,
                unpublishedCount,
                canSeeUnpublished: unpublishedCount > 0,
                expectedBehavior: 'Should see ALL requests including unpublished'
            }
        };
    } catch (err: unknown) {
        return {
            name: 'Session Auth',
            success: false,
            message: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}

async function testServices(apiBase: string): Promise<TestResult> {
    try {
        const url = `${apiBase}/georeport/v2/services.json`;
        const response = await fetch(url, {
            headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
            return {
                name: 'Services',
                success: false,
                message: `HTTP ${response.status}`
            };
        }

        const data = await response.json();
        const count = Array.isArray(data) ? data.length : 0;

        return {
            name: 'Services',
            success: true,
            message: `${count} categories available`
        };
    } catch (err: unknown) {
        return {
            name: 'Services',
            success: false,
            message: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}

async function waitForBackend(apiBase: string, maxRetries = 5, delayMs = 2000): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(`${apiBase}/georeport/v2/services.json`, {
                headers: { Accept: 'application/json' }
            });
            const text = await response.text();
            // Verify it's actually JSON, not a PHP error page
            JSON.parse(text);
            return true;
        } catch {
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    return false;
}

function formatResult(result: TestResult): string {
    const icon = result.success ? '\u2705' : '\u274C';
    return `${icon} ${result.name.padEnd(15)}: ${result.message}`;
}

export default defineNitroPlugin(async () => {
    // Only run in development
    if (process.env.NODE_ENV === 'production') return;

    const apiKey = process.env.GEOREPORT_API_KEY;
    const sessionCookie = process.env.DRUPAL_TEST_SESSION_COOKIE;
    // Use internal Docker network URL for server-side requests
    const apiBase = 'http://web';

    console.log('\n');
    console.log('='.repeat(64));
    console.log('          GeoReport Auth Diagnostic (Dev Mode)');
    console.log('='.repeat(64));

    // Show API key (lightly masked for dev debugging)
    if (apiKey) {
        const masked = `${apiKey.slice(0, 4)}****** (${apiKey.length} chars)`;
        console.log(`API Key:           ${masked}`);
    } else {
        console.log('🔑 API Key:        NOT SET');
    }
    console.log('-'.repeat(64));

    // Wait for Drupal backend to be ready (avoids PHP startup errors)
    const backendReady = await waitForBackend(apiBase);
    if (!backendReady) {
        console.log('\u274C Backend not ready after retries. Skipping diagnostics.');
        console.log('='.repeat(64));
        console.log('\n');
        return;
    }

    // Test 1: Services endpoint (always public)
    const servicesResult = await testServices(apiBase);
    console.log(formatResult(servicesResult));

    // Test 2: API Key authentication
    if (apiKey) {
        const apiKeyResult = await testApiKeyAuth(apiBase, apiKey);
        console.log(formatResult(apiKeyResult));
        if (apiKeyResult.details?.hasUnpublished) {
            console.log('   WARNING: Anonymous users can see unpublished requests!');
        }
    } else {
        console.log('\u26A0\uFE0F  API Key Auth:    GEOREPORT_API_KEY not set');
    }

    // Test 3: Session authentication (only show if cookie provided)
    if (sessionCookie) {
        const sessionResult = await testSessionAuth(apiBase, sessionCookie);
        console.log(formatResult(sessionResult));
        if (sessionResult.success && !sessionResult.details?.canSeeUnpublished) {
            console.log('   NOTE: No unpublished requests found. Session may not have permission.');
        }
    }

    console.log('='.repeat(64));
    console.log('\n');
});
