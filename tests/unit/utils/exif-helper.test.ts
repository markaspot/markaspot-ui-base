import { describe, it, expect } from 'vitest';
import { extractGeodata, extractOrientation } from '@/utils/exif-helper';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * EXIF GPS + Orientation Tests
 *
 * Tests real-world photos from different devices.
 * Some devices write GPS differently or produce 0,0 when no fix.
 * Orientation values (1-8) affect how the image should be displayed.
 *
 * Fixture images: tests/fixtures/exif/
 */

const FIXTURES_DIR = resolve(__dirname, '../../fixtures/exif');

function loadFixture(filename: string): File {
    const buffer = readFileSync(resolve(FIXTURES_DIR, filename));
    return new File([buffer], filename, { type: 'image/jpeg' });
}

// ─── GPS Extraction ──────────────────────────────────────────

describe('extractGeodata', () => {
    describe('devices with valid GPS', () => {
        const devices = [
            { file: 'google-pixel-6a.jpg', name: 'Pixel 6a', lat: 52.002, lng: 7.597 },
            { file: 'google-pixel-8-pro.jpg', name: 'Pixel 8 Pro', lat: 40.400, lng: -3.715 },
            { file: 'google-pixel-9.jpg', name: 'Pixel 9', lat: 44.215, lng: -76.530 },
            { file: 'google-pixel-10-pro-xl.jpg', name: 'Pixel 10 Pro XL', lat: 29.234, lng: -81.101 },
            { file: 'samsung-galaxy-s25-ultra.jpg', name: 'Galaxy S25 Ultra', lat: 43.666, lng: -79.395 },
            { file: 'samsung-galaxy-a55-5g.jpg', name: 'Galaxy A55 5G', lat: 43.507, lng: 16.438 },
            { file: 'samsung-galaxy-s9.jpg', name: 'Galaxy S9', lat: 51.443, lng: -3.303 },
            { file: 'samsung-galaxy-s7.jpg', name: 'Galaxy S7', lat: 47.209, lng: 7.541 },
            { file: 'samsung-galaxy-s4.jpg', name: 'Galaxy S4', lat: 55.661, lng: 12.627 },
            { file: 'nikon-coolpix-gps.jpg', name: 'Nikon COOLPIX P6000', lat: 43.467, lng: 11.885 },
            { file: 'nokia-8.3-5g.jpg', name: 'Nokia 8.3 5G', lat: 60.147, lng: 24.907 }
        ];

        it.each(devices)('$name extracts GPS correctly', async ({ file, lat, lng }) => {
            const result = await extractGeodata(loadFixture(file));
            expect(result).not.toBeNull();
            expect(result!.lat).toBeCloseTo(lat, 2);
            expect(result!.lng).toBeCloseTo(lng, 2);
        });
    });

    describe('devices with 0,0 GPS (no fix)', () => {
        it('Samsung Galaxy S1 (GT-I9000) returns null', async () => {
            const result = await extractGeodata(loadFixture('samsung-galaxy-s1-zero-gps.jpg'));
            expect(result).toBeNull();
        });

        it('Samsung I7110 returns null', async () => {
            const result = await extractGeodata(loadFixture('samsung-i7110-zero-gps.jpg'));
            expect(result).toBeNull();
        });
    });

    describe('no GPS data at all', () => {
        it('Galaxy S22 Ultra (GPS disabled) returns null', async () => {
            const result = await extractGeodata(loadFixture('samsung-galaxy-s22-ultra-no-gps.jpg'));
            expect(result).toBeNull();
        });

        it('Canon 40D (DSLR) returns null', async () => {
            const result = await extractGeodata(loadFixture('canon-40d-no-gps.jpg'));
            expect(result).toBeNull();
        });

        it('empty file returns null', async () => {
            const result = await extractGeodata(new File([], 'empty.jpg', { type: 'image/jpeg' }));
            expect(result).toBeNull();
        });

        it('non-image returns null', async () => {
            const result = await extractGeodata(new File(['text'], 'doc.txt', { type: 'text/plain' }));
            expect(result).toBeNull();
        });
    });
});

// ─── Orientation Extraction ──────────────────────────────────

describe('extractOrientation', () => {
    const orientations = [
        { file: 'orientation-1-normal.jpg', expected: 1, label: '1 = Normal' },
        { file: 'orientation-3-rotate-180.jpg', expected: 3, label: '3 = Rotate 180' },
        { file: 'orientation-6-rotate-90-cw.jpg', expected: 6, label: '6 = Rotate 90 CW' },
        { file: 'orientation-8-rotate-270-cw.jpg', expected: 8, label: '8 = Rotate 270 CW' },
        { file: 'orientation-portrait-6-rotate-90-cw.jpg', expected: 6, label: '6 = Portrait rotate 90 CW' }
    ];

    it.each(orientations)('$label', async ({ file, expected }) => {
        const result = await extractOrientation(loadFixture(file));
        expect(result).toBe(expected);
    });

    it('returns null for image without orientation tag', async () => {
        const result = await extractOrientation(new File([], 'empty.jpg', { type: 'image/jpeg' }));
        expect(result).toBeNull();
    });
});
