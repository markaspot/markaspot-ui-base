import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import { useMapStyles } from '@/composables/map/useMapStyles';

const mockColorMode = ref<'light' | 'dark'>('light');

vi.mock('#imports', () => ({
    useRuntimeConfig: () => ({}),
    useColorMode: () => mockColorMode
}));

vi.mock('#app', () => ({
    useRuntimeConfig: () => ({}),
    useColorMode: () => mockColorMode
}));

type StyleOutcome = 'load' | 'error';

class FakeStyleMap {
    readonly styleUrls: string[] = [];
    private readonly outcomes: StyleOutcome[];
    private handlers = new Map<string, Set<(event?: unknown) => void>>();

    constructor(outcomes: StyleOutcome[]) {
        this.outcomes = [...outcomes];
    }

    once(eventName: string, handler: (event?: unknown) => void) {
        if (!this.handlers.has(eventName)) {
            this.handlers.set(eventName, new Set());
        }
        this.handlers.get(eventName)!.add(handler);
    }

    off(eventName: string, handler: (event?: unknown) => void) {
        this.handlers.get(eventName)?.delete(handler);
    }

    setStyle(styleUrl: string) {
        this.styleUrls.push(styleUrl);
        const outcome = this.outcomes.shift() ?? 'load';
        queueMicrotask(() => {
            const eventName = outcome === 'load' ? 'style.load' : 'error';
            this.handlers.get(eventName)?.forEach(handler => handler({ type: eventName }));
        });
    }
}

const settings = {
    mapbox_style: 'https://tiles.example/light.json',
    mapbox_style_dark: 'https://tiles.example/dark.json',
    fallback_style: 'https://fallback.example/light.json',
    fallback_style_dark: 'https://fallback.example/dark.json',
    fallback_api_key: '',
    fallback_attribution: 'Fallback attribution',
    osm_custom_attribution: 'Primary attribution'
};

describe('useMapStyles', () => {
    beforeEach(() => {
        mockColorMode.value = 'light';
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('loads the dark primary style when dark mode is active', async () => {
        mockColorMode.value = 'dark';
        const map = new FakeStyleMap(['load']);
        const { useFallback } = useMapStyles();

        const result = await useFallback(map as any, settings);

        expect(map.styleUrls).toEqual(['https://tiles.example/dark.json']);
        expect(result).toMatchObject({
            success: true,
            serviceType: 'primary',
            attribution: 'Primary attribution'
        });
    });

    it('loads the preferred cache-busted style URL before derived candidates', async () => {
        const map = new FakeStyleMap(['load']);
        const { useFallback } = useMapStyles();

        const result = await useFallback(map as any, settings, {
            preferredStyleUrl: 'https://tiles.example/light.json?_=123'
        });

        expect(map.styleUrls).toEqual(['https://tiles.example/light.json?_=123']);
        expect(result).toMatchObject({
            success: true,
            serviceType: 'primary'
        });
    });

    it('falls back to the configured fallback style when the primary style fails', async () => {
        const map = new FakeStyleMap(['error', 'load']);
        const { useFallback } = useMapStyles();

        const result = await useFallback(map as any, {
            ...settings,
            fallback_style: 'https://fallback.example/light.json?variant=default',
            fallback_api_key: 'test-key'
        });

        expect(map.styleUrls).toEqual([
            'https://tiles.example/light.json',
            'https://fallback.example/light.json?variant=default&key=test-key'
        ]);
        expect(result.serviceType).toBe('fallback');
        expect(result.success).toBe(true);
    });

    it('uses the light fallback when dark fallback is not configured', async () => {
        mockColorMode.value = 'dark';
        const map = new FakeStyleMap(['error', 'load']);
        const { useFallback } = useMapStyles();

        const result = await useFallback(map as any, {
            ...settings,
            mapbox_style_dark: '',
            fallback_style_dark: ''
        });

        expect(map.styleUrls).toEqual([
            'https://tiles.example/light.json',
            'https://fallback.example/light.json'
        ]);
        expect(result.serviceType).toBe('fallback');
        expect(result.success).toBe(true);
    });

    it('uses the dark fallback before the light primary when dark primary is not configured', async () => {
        mockColorMode.value = 'dark';
        const map = new FakeStyleMap(['load']);
        const { useFallback } = useMapStyles();

        const result = await useFallback(map as any, {
            ...settings,
            mapbox_style_dark: ''
        });

        expect(map.styleUrls).toEqual([
            'https://fallback.example/dark.json'
        ]);
        expect(result.serviceType).toBe('fallback');
        expect(result.success).toBe(true);
    });

    it('reports failed when primary and fallback styles both fail', async () => {
        const map = new FakeStyleMap(['error', 'error', 'error', 'error']);
        const { useFallback } = useMapStyles();

        const result = await useFallback(map as any, settings);

        expect(map.styleUrls).toEqual([
            'https://tiles.example/light.json',
            'https://fallback.example/light.json',
            'https://tiles.example/dark.json',
            'https://fallback.example/dark.json'
        ]);
        expect(result).toMatchObject({
            success: false,
            serviceType: 'failed'
        });
    });
});
