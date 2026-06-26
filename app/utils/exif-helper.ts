// Load exifr lazily only when EXIF is needed

/**
 * Exif-helper Utilities
 *
 * EXIF data extraction and processing for uploaded images.
 *
 * Pure utility functions with no side effects for predictable behavior.
 */

export const extractGeodata = async (file: File): Promise<{ lat: number, lng: number } | null> => {
    try {
        const { default: exifr } = await import('exifr');
        const options = {
            gps: true,
            tiff: false,
            exif: false,
            ifd1: false
        };

        // Extract GPS data
        const output = await exifr.parse(file, options);

        if (output?.latitude && output?.longitude) {
            // Reject 0,0 coordinates (no GPS fix, common on older Samsung devices)
            if (output.latitude === 0 && output.longitude === 0) {
                return null;
            }
            return {
                lat: output.latitude,
                lng: output.longitude
            };
        }

        return null;
    } catch (error) {
        console.error('Error extracting EXIF data:', error);
        return null;
    }
};

/**
 * EXIF orientation values:
 * 1 = Normal
 * 2 = Mirror horizontal
 * 3 = Rotate 180
 * 4 = Mirror vertical
 * 5 = Mirror horizontal + rotate 270 CW
 * 6 = Rotate 90 CW (phone held upright, portrait)
 * 7 = Mirror horizontal + rotate 90 CW
 * 8 = Rotate 270 CW (phone held upright, landscape left)
 */
export const extractOrientation = async (file: File): Promise<number | null> => {
    try {
        const { default: exifr } = await import('exifr');
        const orientation = await exifr.orientation(file);

        if (orientation && orientation >= 1 && orientation <= 8) {
            return orientation;
        }

        return null;
    } catch (error) {
        console.error('Error extracting orientation:', error);
        return null;
    }
};
