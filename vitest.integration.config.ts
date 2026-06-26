import { defineConfig } from 'vitest/config';

export default defineConfig({
    // Skip Nuxt's tsconfig.json which requires .nuxt to be generated.
    // Integration tests only use plain TypeScript with fetch, no Vue/Nuxt imports.
    esbuild: {
        tsconfigRaw: '{}'
    },
    test: {
    // Integration tests run against real APIs, no DOM environment needed
        environment: 'node',
        include: ['tests/integration/**/*.{test,spec}.{js,ts}'],
        // Longer timeout for real HTTP requests
        testTimeout: 15000,
        hookTimeout: 15000
    }
});
