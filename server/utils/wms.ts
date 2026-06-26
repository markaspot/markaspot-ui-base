export interface ConfiguredWmsLayer {
    id?: string
    title?: string
    layerName?: string
    url?: string
    serviceUrl?: string
    wmsUrl?: string
}

export interface WmsLayerTarget {
    url: string
    title: string
}

export type WmsLayerMap = Record<string, WmsLayerTarget>;
export type WmsProxyRequest = 'GetMap' | 'GetLegendGraphic';

const ALLOWED_IMAGE_TYPES = new Set([
    'image/png'
]);

export function normalizeWmsRequest(value: unknown): WmsProxyRequest | null {
    const candidate = Array.isArray(value) ? value[0] : value;
    if (typeof candidate !== 'string') return null;

    switch (candidate.trim().toLowerCase()) {
        case 'getmap':
            return 'GetMap';

        case 'getlegendgraphic':
            return 'GetLegendGraphic';

        default:
            return null;
    }
}

export function normalizeAllowedImageContentType(value: string | null): string | null {
    const contentType = (value || '').split(';')[0].trim().toLowerCase();
    return ALLOWED_IMAGE_TYPES.has(contentType) ? contentType : null;
}

export function hasExplicitAllowedWmsHosts(allowedHosts?: string | string[]): boolean {
    return parseAllowedHosts(allowedHosts).size > 0;
}

function getNestedValue(source: unknown, path: string[]): unknown {
    let current = source;
    for (const part of path) {
        if (!current || typeof current !== 'object' || !(part in current)) {
            return undefined;
        }
        current = (current as Record<string, unknown>)[part];
    }
    return current;
}

function isConfiguredLayer(value: unknown): value is ConfiguredWmsLayer {
    return !!value && typeof value === 'object';
}

function getLayerUrl(layer: ConfiguredWmsLayer): string | undefined {
    return layer.url || layer.serviceUrl || layer.wmsUrl;
}

export function extractConfiguredWmsLayerMap(settings: unknown): WmsLayerMap {
    const layerSources = [
        getNestedValue(settings, ['features', 'map', 'wmsLayers']),
        getNestedValue(settings, ['map', 'wmsLayers'])
    ];

    const layerMap: WmsLayerMap = {};
    for (const source of layerSources) {
        if (!Array.isArray(source)) continue;

        for (const candidate of source) {
            if (!isConfiguredLayer(candidate)) continue;
            const layerName = candidate.layerName;
            const url = getLayerUrl(candidate);
            if (typeof layerName !== 'string' || layerName.trim() === '') continue;
            if (typeof url !== 'string' || url.trim() === '') continue;

            layerMap[layerName] = {
                url,
                title: typeof candidate.title === 'string' && candidate.title.trim() !== ''
                    ? candidate.title
                    : layerName
            };
        }
    }

    return layerMap;
}

function parseAllowedHosts(value: string | string[] | undefined): Set<string> {
    const entries = Array.isArray(value) ? value : String(value || '').split(',');
    return new Set(
        entries.map(host => host.trim().toLowerCase()).filter(Boolean)
    );
}

function isPrivateOctets(a: number, b: number): boolean {
    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        // CGNAT (RFC 6598), used by some cloud providers for internal traffic.
        (a === 100 && b >= 64 && b <= 127) ||
        // Multicast and reserved ranges.
        a >= 224
    );
}

function isPrivateIpv4(hostname: string): boolean {
    const parts = hostname.split('.').map(part => Number(part));
    if (
        parts.length !== 4 ||
        parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)
    ) {
        return false;
    }
    return isPrivateOctets(parts[0], parts[1]);
}

// WHATWG URL parser interprets leading "0x" as hex and leading "0" as octal
// during IPv4 host resolution. Number()/parseInt without radix would mis-decode.
function parseUrlIpComponent(part: string): number | null {
    if (/^0x[0-9a-f]+$/i.test(part)) return parseInt(part.slice(2), 16);
    if (/^0[0-7]+$/.test(part)) return parseInt(part, 8);
    if (part === '0') return 0;
    if (/^[1-9][0-9]*$/.test(part)) return parseInt(part, 10);
    return null;
}

// Numeric IP encodings (decimal "2130706433", hex "0x7f000001", octal "0177.0.0.1")
// that the URL parser accepts and Node fetch resolves to internal targets.
function decodeNumericIp(
    hostname: string
): [number, number, number, number] | null {
    // Single-integer form (decimal/hex/octal).
    if (!hostname.includes('.')) {
        const value = parseUrlIpComponent(hostname);
        if (value === null || value < 0 || value > 0xffffffff) return null;
        return [
            (value >>> 24) & 0xff,
            (value >>> 16) & 0xff,
            (value >>> 8) & 0xff,
            value & 0xff
        ];
    }
    // Dotted form: validate each octet is a valid URL-IP component (decimal/hex/octal)
    // and within 0-255.
    const parts = hostname.split('.');
    if (parts.length !== 4) return null;
    const decoded: number[] = [];
    for (const part of parts) {
        const value = parseUrlIpComponent(part);
        if (value === null || value < 0 || value > 255) return null;
        decoded.push(value);
    }
    return [decoded[0], decoded[1], decoded[2], decoded[3]];
}

// IPv4-mapped / IPv4-compatible IPv6 ("::ffff:127.0.0.1", "::ffff:7f00:1").
function ipv4FromMappedIpv6(
    ipv6: string
): [number, number, number, number] | null {
    const lower = ipv6.toLowerCase();
    // Form 1: ::ffff:a.b.c.d or ::a.b.c.d
    const dotted = lower.match(
        /^::(?:ffff:)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/
    );
    if (dotted) {
        const parts = dotted[1].split('.').map(Number);
        if (parts.every(p => Number.isInteger(p) && p >= 0 && p <= 255)) {
            return [parts[0], parts[1], parts[2], parts[3]];
        }
    }
    // Form 2: ::ffff:wxyz (last two 16-bit groups encode IPv4).
    const hex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hex) {
        const high = parseInt(hex[1], 16);
        const low = parseInt(hex[2], 16);
        return [(high >>> 8) & 0xff, high & 0xff, (low >>> 8) & 0xff, low & 0xff];
    }
    return null;
}

function isPrivateHostname(hostname: string): boolean {
    const normalized = hostname.toLowerCase().replace(/\.$/, '');

    if (normalized === 'localhost' || normalized.endsWith('.localhost')) {
        return true;
    }

    if (isPrivateIpv4(normalized)) {
        return true;
    }

    // Numeric IP encodings the URL parser accepts but Node resolves to bytes.
    const decoded = decodeNumericIp(normalized);
    if (decoded && isPrivateOctets(decoded[0], decoded[1])) {
        return true;
    }

    const ipv6 = normalized.replace(/^\[/, '').replace(/\]$/, '');
    if (
        ipv6 === '::1' ||
        ipv6 === '::' ||
        ipv6.startsWith('fc') ||
        ipv6.startsWith('fd') ||
        ipv6.startsWith('fe80:') ||
        ipv6.startsWith('64:ff9b:')
    ) {
        return true;
    }

    // IPv4-mapped IPv6 (Node fetch resolves to the embedded IPv4 target).
    const mapped = ipv4FromMappedIpv6(ipv6);
    if (mapped && isPrivateOctets(mapped[0], mapped[1])) {
        return true;
    }

    return false;
}

export function isAllowedWmsUrl(
    rawUrl: string,
    allowedHosts?: string | string[]
): boolean {
    let url: URL;
    try {
        url = new URL(rawUrl);
    } catch {
        return false;
    }

    if (url.protocol !== 'https:') {
        return false;
    }

    const hostname = url.hostname.toLowerCase();
    const allowed = parseAllowedHosts(allowedHosts);
    if (allowed.size > 0) {
        return allowed.has(hostname);
    }

    return !isPrivateHostname(hostname);
}
