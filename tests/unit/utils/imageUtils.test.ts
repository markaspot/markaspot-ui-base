import { describe, it, expect } from 'vitest';
import {
    calculateNewDimensions,
    getMimeType,
    isImageFile,
    formatFileSize
} from '@/utils/imageUtils';

/**
 * Image Utilities Tests
 *
 * CRITICAL: Image processing is HIGH RISK for bugs.
 * Issues here = corrupted uploads, memory leaks, poor UX.
 *
 * Tests cover:
 * - Dimension calculations (aspect ratio preservation)
 * - MIME type detection
 * - File type validation
 * - Size formatting
 *
 * Note: getImageDimensions() and optimizeImage() use DOM APIs (Image, canvas)
 * These require browser environment and are better tested with E2E tests.
 * We focus on pure logic functions here.
 */

describe('imageUtils', () => {
    describe('calculateNewDimensions', () => {
    /**
     * Test 1: Image already within limits
     */
        it('should not resize if within limits', () => {
            const result = calculateNewDimensions(800, 600, 1920, 1080);

            expect(result).toEqual({ width: 800, height: 600 });
        });

        /**
     * Test 2: Scale down width (landscape)
     */
        it('should scale down landscape image by width', () => {
            const result = calculateNewDimensions(3840, 2160, 1920, 1080);

            // Original: 3840x2160 (16:9)
            // Max: 1920x1080
            // Should scale to 1920x1080 (preserving 16:9)
            expect(result.width).toBe(1920);
            expect(result.height).toBe(1080);
        });

        /**
     * Test 3: Scale down height (portrait)
     */
        it('should scale down portrait image by height', () => {
            const result = calculateNewDimensions(1080, 1920, 1920, 1080);

            // Original: 1080x1920 (9:16 portrait)
            // Max: 1920x1080
            // Height exceeds, so scale by height
            expect(result.height).toBe(1080);
            // Width should be proportionally scaled: 1080 * (1080/1920) = 607.5 → 608
            expect(result.width).toBe(608);
        });

        /**
     * Test 4: Preserve aspect ratio (square)
     */
        it('should preserve aspect ratio for square images', () => {
            const result = calculateNewDimensions(2000, 2000, 1000, 1000);

            // Original: 2000x2000 (1:1)
            // Max: 1000x1000
            // Should scale to 1000x1000 (preserving 1:1)
            expect(result.width).toBe(1000);
            expect(result.height).toBe(1000);
        });

        /**
     * Test 5: Width exceeds, then height adjustment
     */
        it('should handle width exceeding, then height exceeding after first scale', () => {
            // Edge case: Width exceeds, after scaling height might also exceed
            const result = calculateNewDimensions(4000, 3500, 1920, 1080);

            // Original: 4000x3500
            // Step 1: Width exceeds 1920
            //   Scale by width: 1920 x (3500 * 1920/4000) = 1920 x 1680
            // Step 2: Height 1680 exceeds 1080
            //   Scale by height: (1920 * 1080/1680) x 1080 = 1234 x 1080

            expect(result.width).toBe(1234);
            expect(result.height).toBe(1080);
        });

        /**
     * Test 6: Extreme aspect ratio (panorama)
     */
        it('should handle extreme aspect ratios', () => {
            const result = calculateNewDimensions(5000, 1000, 1920, 1080);

            // Original: 5000x1000 (5:1 panorama)
            // Width exceeds, scale by width
            // 1920 x (1000 * 1920/5000) = 1920 x 384

            expect(result.width).toBe(1920);
            expect(result.height).toBe(384);
        });

        /**
     * Test 7: Tiny image (should not upscale)
     */
        it('should not upscale small images', () => {
            const result = calculateNewDimensions(100, 100, 1920, 1080);

            // Original: 100x100
            // Already within limits, should not change
            expect(result).toEqual({ width: 100, height: 100 });
        });

        /**
     * Test 8: Aspect ratio preservation accuracy
     */
        it('should preserve aspect ratio accurately', () => {
            const original = { width: 1920, height: 1080 };
            const result = calculateNewDimensions(3840, 2160, 1920, 1080);

            const originalRatio = original.width / original.height;
            const resultRatio = result.width / result.height;

            // Ratios should be very close (allowing for rounding)
            expect(Math.abs(originalRatio - resultRatio)).toBeLessThan(0.01);
        });

        /**
     * Test 9: Edge case - 0 dimensions
     */
        it('should handle zero dimensions gracefully', () => {
            const result = calculateNewDimensions(0, 0, 1920, 1080);

            expect(result).toEqual({ width: 0, height: 0 });
        });

        /**
     * Test 10: Real-world - iPhone photo
     */
        it('real-world: resize iPhone 15 Pro Max photo', () => {
            // iPhone 15 Pro Max: 4032 x 3024 (4:3)
            const result = calculateNewDimensions(4032, 3024, 1920, 1080);

            // Should scale down preserving 4:3 ratio
            expect(result.width).toBe(1440);
            expect(result.height).toBe(1080);

            // Verify aspect ratio
            const originalRatio = 4032 / 3024;
            const resultRatio = result.width / result.height;
            expect(Math.abs(originalRatio - resultRatio)).toBeLessThan(0.01);
        });
    });

    describe('getMimeType', () => {
    /**
     * Test 1: Standard image extensions
     */
        it('should detect standard image MIME types', () => {
            expect(getMimeType('photo.jpg')).toBe('image/jpeg');
            expect(getMimeType('photo.jpeg')).toBe('image/jpeg');
            expect(getMimeType('image.png')).toBe('image/png');
            expect(getMimeType('animation.gif')).toBe('image/gif');
            expect(getMimeType('modern.webp')).toBe('image/webp');
        });

        /**
     * Test 2: JFIF format
     */
        it('should detect JFIF format', () => {
            expect(getMimeType('camera.jfif')).toBe('image/jfif');
        });

        /**
     * Test 3: HEIC format (iPhone)
     */
        it('should detect HEIC format', () => {
            expect(getMimeType('iphone.heic')).toBe('image/heic');
        });

        /**
     * Test 4: Case insensitivity
     */
        it('should be case insensitive', () => {
            expect(getMimeType('PHOTO.JPG')).toBe('image/jpeg');
            expect(getMimeType('Image.PNG')).toBe('image/png');
            expect(getMimeType('File.WEBP')).toBe('image/webp');
        });

        /**
     * Test 5: Multiple dots in filename
     */
        it('should handle filenames with multiple dots', () => {
            expect(getMimeType('my.vacation.photo.jpg')).toBe('image/jpeg');
            expect(getMimeType('file.backup.2024.png')).toBe('image/png');
        });

        /**
     * Test 6: No extension
     */
        it('should return default for files without extension', () => {
            expect(getMimeType('photo')).toBe('application/octet-stream');
            expect(getMimeType('')).toBe('application/octet-stream');
        });

        /**
     * Test 7: Unknown extension
     */
        it('should return default for unknown extensions', () => {
            expect(getMimeType('document.pdf')).toBe('application/octet-stream');
            expect(getMimeType('video.mp4')).toBe('application/octet-stream');
            expect(getMimeType('file.xyz')).toBe('application/octet-stream');
        });

        /**
     * Test 8: Path with directories
     */
        it('should handle full file paths', () => {
            expect(getMimeType('/path/to/photo.jpg')).toBe('image/jpeg');
            expect(getMimeType('C:\\Users\\Photos\\image.png')).toBe('image/png');
        });
    });

    describe('isImageFile', () => {
    /**
     * Test 1: Image MIME types
     */
        it('should accept files with image MIME types', () => {
            const jpegFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
            const pngFile = new File(['content'], 'image.png', { type: 'image/png' });
            const webpFile = new File(['content'], 'modern.webp', { type: 'image/webp' });

            expect(isImageFile(jpegFile)).toBe(true);
            expect(isImageFile(pngFile)).toBe(true);
            expect(isImageFile(webpFile)).toBe(true);
        });

        /**
     * Test 2: Fallback to filename detection
     */
        it('should detect images by filename when MIME type is missing', () => {
            // Browser sometimes doesn't set MIME type correctly
            const fileWithoutMime = new File(['content'], 'photo.jpg', { type: '' });

            expect(isImageFile(fileWithoutMime)).toBe(true);
        });

        /**
     * Test 3: JFIF files
     */
        it('should accept JFIF files', () => {
            const jfifFile = new File(['content'], 'camera.jfif', { type: 'image/jfif' });

            expect(isImageFile(jfifFile)).toBe(true);
        });

        /**
     * Test 4: Non-image files
     */
        it('should reject non-image files', () => {
            const pdfFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
            const txtFile = new File(['content'], 'notes.txt', { type: 'text/plain' });
            const videoFile = new File(['content'], 'video.mp4', { type: 'video/mp4' });

            expect(isImageFile(pdfFile)).toBe(false);
            expect(isImageFile(txtFile)).toBe(false);
            expect(isImageFile(videoFile)).toBe(false);
        });

        /**
     * Test 5: Edge case - incorrect MIME but image extension
     */
        it('should accept image files with incorrect MIME type', () => {
            // Some systems set wrong MIME type
            const fileWrongMime = new File(['content'], 'photo.jpg', { type: 'application/octet-stream' });

            // Should still detect as image via filename
            expect(isImageFile(fileWrongMime)).toBe(true);
        });

        /**
     * Test 6: Edge case - image MIME but wrong extension
     */
        it('should accept files with image MIME type regardless of extension', () => {
            const fileWeirdExtension = new File(['content'], 'photo.xyz', { type: 'image/jpeg' });

            // MIME type takes precedence
            expect(isImageFile(fileWeirdExtension)).toBe(true);
        });
    });

    describe('formatFileSize', () => {
    /**
     * Test 1: Zero bytes
     */
        it('should format zero bytes', () => {
            expect(formatFileSize(0)).toBe('0 B');
        });

        /**
     * Test 2: Bytes
     */
        it('should format bytes', () => {
            expect(formatFileSize(1)).toBe('1 B');
            expect(formatFileSize(500)).toBe('500 B');
            expect(formatFileSize(1023)).toBe('1023 B');
        });

        /**
     * Test 3: Kilobytes
     */
        it('should format kilobytes', () => {
            expect(formatFileSize(1024)).toBe('1 KB');
            expect(formatFileSize(1536)).toBe('1.5 KB');
            expect(formatFileSize(10240)).toBe('10 KB');
        });

        /**
     * Test 4: Megabytes
     */
        it('should format megabytes', () => {
            expect(formatFileSize(1048576)).toBe('1 MB');
            expect(formatFileSize(1572864)).toBe('1.5 MB');
            expect(formatFileSize(10485760)).toBe('10 MB');
        });

        /**
     * Test 5: Gigabytes
     */
        it('should format gigabytes', () => {
            expect(formatFileSize(1073741824)).toBe('1 GB');
            expect(formatFileSize(2147483648)).toBe('2 GB');
        });

        /**
     * Test 6: Decimal precision
     */
        it('should use 2 decimal places', () => {
            expect(formatFileSize(1536)).toBe('1.5 KB');
            expect(formatFileSize(1638)).toBe('1.6 KB'); // 1638 / 1024 = 1.599609375
            expect(formatFileSize(10485760)).toBe('10 MB');
        });

        /**
     * Test 7: Real-world file sizes
     */
        it('real-world: format typical photo sizes', () => {
            expect(formatFileSize(2097152)).toBe('2 MB'); // 2 MB photo
            expect(formatFileSize(4194304)).toBe('4 MB'); // 4 MB photo
            expect(formatFileSize(524288)).toBe('512 KB'); // Thumbnail
        });

        /**
     * Test 8: Very large files
     */
        it('should handle very large file sizes', () => {
            expect(formatFileSize(5368709120)).toBe('5 GB'); // 5 GB
        });

        /**
     * Test 9: Edge case - 1 byte before next unit
     */
        it('should round correctly at unit boundaries', () => {
            expect(formatFileSize(1023)).toBe('1023 B');
            expect(formatFileSize(1024)).toBe('1 KB');

            expect(formatFileSize(1048575)).toBe('1024 KB'); // Just before 1 MB
            expect(formatFileSize(1048576)).toBe('1 MB');
        });
    });

    /**
   * Integration Test: Full workflow simulation
   */
    describe('real-world integration', () => {
        it('should process typical user upload flow', () => {
            // 1. User selects iPhone photo
            const photoFile = new File(
                ['fake-image-data'],
                'vacation.heic',
                { type: 'image/heic' }
            );

            // 2. Validate it's an image
            expect(isImageFile(photoFile)).toBe(true);

            // 3. Get MIME type
            expect(getMimeType(photoFile.name)).toBe('image/heic');

            // 4. Calculate resize dimensions
            const newDimensions = calculateNewDimensions(4032, 3024, 1920, 1080);
            expect(newDimensions.width).toBe(1440);
            expect(newDimensions.height).toBe(1080);

            // 5. Show file size
            const size = formatFileSize(photoFile.size);
            expect(size).toBeTruthy();
        });
    });
});
