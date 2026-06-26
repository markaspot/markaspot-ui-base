/**
 * Format geocoding result into a human-readable address string
 */
export function formatGeocodedAddress(result: any, fallbackCoords?: { lat: number, lng: number }): string {
    if (!result?.address) {
        if (fallbackCoords) {
            return `${fallbackCoords.lat.toFixed(6)}, ${fallbackCoords.lng.toFixed(6)}`;
        }
        return result?.displayName || 'Unknown location';
    }

    const parts: string[] = [];

    // Street with house number
    if (result.address.street) {
        const streetPart = result.address.street +
          (result.address.housenumber ? ' ' + result.address.housenumber : '');
        parts.push(streetPart);
    }

    // City with postcode
    if (result.address.city) {
        const cityPart = [result.address.postcode, result.address.city]
            .filter(Boolean)
            .join(' ');
        parts.push(cityPart);
    }

    // Use parts if available, otherwise fall back to displayName or coords
    if (parts.length > 0) {
        return parts.join(', ');
    }

    if (result.displayName) {
        return result.displayName;
    }

    if (fallbackCoords) {
        return `${fallbackCoords.lat.toFixed(6)}, ${fallbackCoords.lng.toFixed(6)}`;
    }

    return 'Unknown location';
}
