// plugins/geocoding/providers/errors.ts

/**
 * Error thrown when a geocoding provider cannot geocode a location
 * because it's outside their coverage area.
 * This is an expected error that should trigger fallback to another provider.
 */
export class GeocodingCoverageError extends Error {
    constructor(message: string = 'Location outside coverage area') {
        super(message);
        this.name = 'GeocodingCoverageError';
    }
}

/**
 * Check if an error is an expected coverage error
 */
export function isCoverageError(error: unknown): boolean {
    return error instanceof GeocodingCoverageError;
}
