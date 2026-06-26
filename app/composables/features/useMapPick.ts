// Lightweight map-pick event bus and state
// Allows starting a one-shot map picking mode and receiving the picked location.

type PickResult = {
    lat: number
    lng: number
    address: string
    addressObj?: {
        street?: string
        housenumber?: string
        houseNumber?: string
        postcode?: string
        city?: string
        district?: string
        state?: string
        country?: string
        countryCode?: string
    }
    validationResult?: { valid: boolean, message: string, hardInvalid?: boolean }
};

type Listener = (result: PickResult) => void;

// Module-scoped listeners (not serialized).
const listeners = new Set<Listener>();

export function useMapPick() {
    // Global reactive state across components
    const isActive = useState<boolean>('mapPickActive', () => false);
    const lastResult = useState<PickResult | null>('mapPickLastResult', () => null);
    const initialCoords = useState<{ lat: number, lng: number } | null>('mapPickInitialCoords', () => null);

    const start = (coords?: { lat: number, lng: number }) => {
        lastResult.value = null;
        initialCoords.value = coords || null;
        isActive.value = true;
    };

    const cancel = () => {
        isActive.value = false;
    };

    const onPicked = (cb: Listener) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
    };

    const select = (result: PickResult) => {
    // Deactivate first so subsequent clicks are normal
        isActive.value = false;
        lastResult.value = result;
        // Notify all listeners (one-shot pattern expected)
        listeners.forEach((cb) => {
            try {
                cb(result);
            } catch (e) {
                console.error('useMapPick listener error', e);
            }
        });
    };

    return {
        isActive,
        lastResult,
        initialCoords,
        start,
        cancel,
        onPicked,
        select
    };
}
