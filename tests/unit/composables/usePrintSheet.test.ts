/**
 * Unit Tests for usePrintSheet
 *
 * Shared print composable used by both the citizen detail modal
 * (ReportPrintButton) and the dashboard request pages. These tests
 * exercise the public contract: initial state shape and the
 * printRequest workflow wiring (map fallback chain + cleanup).
 *
 * @see /app/composables/print/usePrintSheet.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePrintSheet } from '@/composables/print/usePrintSheet';

describe('usePrintSheet', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('exposes the expected reactive state + printRequest fn', () => {
        const sheet = usePrintSheet();

        expect(sheet.mapImageUrl.value).toBeNull();
        expect(sheet.qrCodeUrl.value).toBe('');
        expect(sheet.isPreparing.value).toBe(false);
        expect(typeof sheet.printRequest).toBe('function');
    });

    it('falls back to an OSM static tile when canvas capture fails and clears state afterwards', async () => {
        const { mapImageUrl, qrCodeUrl, isPreparing, printRequest } = usePrintSheet();

        // Capture the tile URL the composable sets during the print flow
        // by intercepting window.print, which is the last step before cleanup.
        let tileUrlDuringPrint: string | null = null;
        let qrDuringPrint = '';
        let preparingDuringPrint = false;

        const printSpy = vi.fn(() => {
            tileUrlDuringPrint = mapImageUrl.value;
            qrDuringPrint = qrCodeUrl.value;
            preparingDuringPrint = isPreparing.value;
        });

        // Minimal window stub so the composable's QR + print calls don't throw
        vi.stubGlobal('window', {
            print: printSpy,
            location: { href: 'https://example.test/requests/42' }
        });

        // No real map element passed in -> captureMapCanvas returns null
        // -> composable must pick the OSM static tile fallback.
        await printRequest(null, { lat: 52.37, lon: 4.9 });

        // During the print call we observed a non-null OSM tile URL
        expect(printSpy).toHaveBeenCalledOnce();
        expect(tileUrlDuringPrint).toMatch(/^https:\/\/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/);
        expect(preparingDuringPrint).toBe(true);

        // QR generation may succeed or fail in happy-dom; either way it must be a string
        expect(typeof qrDuringPrint).toBe('string');

        // After printRequest resolves, memory is freed.
        expect(mapImageUrl.value).toBeNull();
        expect(qrCodeUrl.value).toBe('');
        expect(isPreparing.value).toBe(false);
    });

    it('blocks re-entry while a print is already in progress', async () => {
        const { isPreparing, printRequest } = usePrintSheet();

        const printSpy = vi.fn();
        vi.stubGlobal('window', {
            print: printSpy,
            location: { href: 'https://example.test/requests/42' }
        });

        // Pre-set isPreparing to simulate an in-flight print; a second click
        // on the button should then be a no-op (early return).
        isPreparing.value = true;

        await printRequest(null, { lat: 52.37, lon: 4.9 });

        expect(printSpy).not.toHaveBeenCalled();
        // Guard must not flip isPreparing back to false by accident.
        expect(isPreparing.value).toBe(true);
    });
});
