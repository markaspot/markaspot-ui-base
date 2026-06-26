import { describe, expect, it } from 'vitest';
import {
    extractConfiguredWmsLayerMap,
    hasExplicitAllowedWmsHosts,
    isAllowedWmsUrl,
    normalizeAllowedImageContentType,
    normalizeWmsRequest
} from '~/server/utils/wms';

describe('WMS server utilities', () => {
    describe('extractConfiguredWmsLayerMap', () => {
        it('reads WMS layers from features.map.wmsLayers', () => {
            const layers = extractConfiguredWmsLayerMap({
                features: {
                    map: {
                        wmsLayers: [
                            {
                                title: 'NKF Objekte',
                                layerName: 'v_od_staedtische_liegenschaften_p_27315',
                                url: 'https://gdi.bonn.de/geoserver/nkf_objektverwaltung/wms'
                            }
                        ]
                    }
                }
            });

            expect(layers).toEqual({
                v_od_staedtische_liegenschaften_p_27315: {
                    title: 'NKF Objekte',
                    url: 'https://gdi.bonn.de/geoserver/nkf_objektverwaltung/wms'
                }
            });
        });

        it('also supports top-level map.wmsLayers for backward compatibility', () => {
            const layers = extractConfiguredWmsLayerMap({
                map: {
                    wmsLayers: [
                        {
                            layerName: 'radverkehrsnetz',
                            serviceUrl: 'https://gdi.bonn.de/geoserver/radwege/wms'
                        }
                    ]
                }
            });

            expect(layers.radverkehrsnetz).toEqual({
                title: 'radverkehrsnetz',
                url: 'https://gdi.bonn.de/geoserver/radwege/wms'
            });
        });

        it('ignores incomplete layer entries', () => {
            const layers = extractConfiguredWmsLayerMap({
                features: {
                    map: {
                        wmsLayers: [
                            { layerName: 'missing-url' },
                            { url: 'https://gdi.bonn.de/geoserver/radwege/wms' },
                            null
                        ]
                    }
                }
            });

            expect(layers).toEqual({});
        });
    });

    describe('isAllowedWmsUrl', () => {
        it('allows public HTTPS WMS URLs by default', () => {
            expect(isAllowedWmsUrl('https://gdi.bonn.de/geoserver/radwege/wms')).toBe(
                true
            );
        });

        it('rejects non-HTTPS and private hosts', () => {
            expect(isAllowedWmsUrl('http://gdi.bonn.de/geoserver/radwege/wms')).toBe(
                false
            );
            expect(isAllowedWmsUrl('https://localhost/geoserver/wms')).toBe(false);
            expect(isAllowedWmsUrl('https://127.0.0.1/geoserver/wms')).toBe(false);
            expect(isAllowedWmsUrl('https://10.0.0.5/geoserver/wms')).toBe(false);
            expect(isAllowedWmsUrl('not-a-url')).toBe(false);
        });

        it('rejects encoded private IP hosts', () => {
            expect(isAllowedWmsUrl('https://2130706433/geoserver/wms')).toBe(false);
            expect(isAllowedWmsUrl('https://0x7f000001/geoserver/wms')).toBe(false);
            expect(isAllowedWmsUrl('https://0177.0.0.1/geoserver/wms')).toBe(false);
            expect(isAllowedWmsUrl('https://[::ffff:127.0.0.1]/geoserver/wms')).toBe(false);
        });

        it('blocks AWS metadata across encodings', () => {
            // 169.254.169.254 in dotted, decimal, and IPv4-mapped IPv6 forms.
            expect(isAllowedWmsUrl('https://169.254.169.254/latest/meta-data/')).toBe(false);
            expect(isAllowedWmsUrl('https://2852039166/latest/meta-data/')).toBe(false);
            expect(isAllowedWmsUrl('https://[::ffff:169.254.169.254]/latest/meta-data/')).toBe(false);
            // Same target as ::ffff:169.254.169.254 but in pure-hex IPv6 (a9fe:a9fe).
            expect(isAllowedWmsUrl('https://[::ffff:a9fe:a9fe]/latest/meta-data/')).toBe(false);
        });

        it('blocks CGNAT, multicast, and broadcast ranges', () => {
            expect(isAllowedWmsUrl('https://100.64.0.1/wms')).toBe(false);
            expect(isAllowedWmsUrl('https://100.127.255.1/wms')).toBe(false);
            expect(isAllowedWmsUrl('https://224.0.0.1/wms')).toBe(false);
            expect(isAllowedWmsUrl('https://255.255.255.255/wms')).toBe(false);
        });

        it('blocks IPv6 link-local, ULA, loopback, and NAT64 prefixes', () => {
            expect(isAllowedWmsUrl('https://[::1]/wms')).toBe(false);
            expect(isAllowedWmsUrl('https://[fc00::1]/wms')).toBe(false);
            expect(isAllowedWmsUrl('https://[fd12:3456::1]/wms')).toBe(false);
            expect(isAllowedWmsUrl('https://[fe80::1]/wms')).toBe(false);
            expect(isAllowedWmsUrl('https://[64:ff9b::1.2.3.4]/wms')).toBe(false);
        });

        it('still allows legitimate public IPs and hosts', () => {
            expect(isAllowedWmsUrl('https://gdi.bonn.de/geoserver/wms')).toBe(true);
            expect(isAllowedWmsUrl('https://8.8.8.8/wms')).toBe(true);
        });

        it('honours an explicit host allowlist', () => {
            expect(
                isAllowedWmsUrl(
                    'https://gdi.bonn.de/geoserver/radwege/wms',
                    'gdi.bonn.de'
                )
            ).toBe(true);
            expect(
                isAllowedWmsUrl('https://example.com/geoserver/wms', 'gdi.bonn.de')
            ).toBe(false);
            // Exact-match only — subdomains are not implicitly allowed.
            expect(
                isAllowedWmsUrl('https://sub.gdi.bonn.de/wms', 'gdi.bonn.de')
            ).toBe(false);
        });
    });

    describe('normalizeWmsRequest', () => {
        it('allows only map tiles and legend graphics', () => {
            expect(normalizeWmsRequest('GetMap')).toBe('GetMap');
            expect(normalizeWmsRequest('getlegendgraphic')).toBe('GetLegendGraphic');
            expect(normalizeWmsRequest(['GetMap'])).toBe('GetMap');
            expect(normalizeWmsRequest('GetCapabilities')).toBeNull();
            expect(normalizeWmsRequest(undefined)).toBeNull();
        });
    });

    describe('normalizeAllowedImageContentType', () => {
        it('accepts only PNG image content types used by the proxy', () => {
            expect(normalizeAllowedImageContentType('image/png; charset=binary')).toBe('image/png');
            expect(normalizeAllowedImageContentType('IMAGE/JPEG')).toBeNull();
            expect(normalizeAllowedImageContentType('image/svg+xml')).toBeNull();
            expect(normalizeAllowedImageContentType('text/xml')).toBeNull();
            expect(normalizeAllowedImageContentType(null)).toBeNull();
        });
    });

    describe('hasExplicitAllowedWmsHosts', () => {
        it('detects whether tenant WMS hosts are explicitly allowlisted', () => {
            expect(hasExplicitAllowedWmsHosts('gdi.bonn.de')).toBe(true);
            expect(hasExplicitAllowedWmsHosts(['gdi.bonn.de'])).toBe(true);
            expect(hasExplicitAllowedWmsHosts('')).toBe(false);
            expect(hasExplicitAllowedWmsHosts(undefined)).toBe(false);
        });
    });
});
