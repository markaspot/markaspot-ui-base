import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    test: {
        globals: true,
        environment: 'happy-dom',
        // Use the threads pool, not forks. Under forks, each worker is a fresh
        // process that re-resolves the happy-dom environment from vitest's nested
        // pnpm path; spawning ~130 of them in parallel occasionally lost that
        // resolution race ("Failed to start forks worker ... Cannot find package
        // happy-dom"), making test:all intermittently red. Threads resolve modules
        // once in-process, eliminating the race.
        pool: 'threads',
        // Only include actual unit test files, exclude Playwright spec files
        include: ['tests/unit/**/*.{test,spec}.{js,ts}'],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            // Explicitly exclude Playwright test files
            'tests/*.spec.ts',
            'tests/**/*.spec.ts',
            '!tests/unit/**/*.spec.ts' // But allow spec files in unit folder
        ],
        // Setup file to configure auto-imports
        setupFiles: ['./tests/unit/setup.ts'],
        coverage: {
            provider: 'v8',
            // `all: true` counts every source file in `include` even when no test
            // imports it, so untested modules show up as 0% instead of vanishing.
            // Without this the headline number only reflects files a test happens
            // to touch and silently overstates real coverage.
            all: true,
            reporter: ['text-summary', 'html', 'json-summary'],
            reportsDirectory: './coverage',
            include: [
                'app/**/*.{ts,vue}',
                'pro-layer/**/*.{ts,vue}',
                'fastmap-layer/**/*.{ts,vue}',
                'server/**/*.ts',
                'shared/**/*.ts'
            ],
            exclude: [
                '**/*.d.ts',
                '**/types/**',
                '**/*.config.*',
                'app/app.vue',
                '**/__mocks__/**'
            ],
            // Deliberately-low ratchet floor: set just under today's measured
            // numbers so the gate passes now and only ever moves up. Raise these
            // as components / pro-layer gain tests. See docs/development/TYPESCRIPT.md.
            // Measured 2026-06-09 after the boundary-test pass: lines 24.4 /
            // stmts 24.0 / funcs 20.0 / branches 23.1 (with all:true). Floors sit
            // ~0.5pt under so the gate passes today and ratchets upward only.
            // Raise these whenever a coverage-adding PR lands.
            thresholds: {
                lines: 24,
                functions: 19,
                statements: 23,
                branches: 22
            }
        }
    },
    resolve: {
        alias: [
            // Nuxt 4 app-directory sub-aliases (must come before generic ~ alias)
            // In Nuxt 4, ~/composables resolves to app/composables, but we need
            // ~ to also resolve ~/server/ and ~/pro-layer/ at project root.
            { find: '~/composables', replacement: resolve(__dirname, './app/composables') },
            { find: '~/stores', replacement: resolve(__dirname, './app/stores') },
            { find: '~/utils', replacement: resolve(__dirname, './app/utils') },
            { find: '~/components', replacement: resolve(__dirname, './app/components') },
            // Generic aliases
            { find: '~', replacement: resolve(__dirname, './') },
            { find: '@', replacement: resolve(__dirname, './app') },
            { find: '#app', replacement: resolve(__dirname, './tests/unit/__mocks__/nuxt') },
            { find: '#imports', replacement: resolve(__dirname, './tests/unit/__mocks__/nuxt') },
            // Nuxt 4 shared/ alias (mirrors .nuxt/tsconfig #shared mapping) so
            // tests resolve #shared/* the same way the app + nitro builds do.
            { find: '#shared', replacement: resolve(__dirname, './shared') }
        ],
        extensions: ['.ts', '.js', '.json', '.vue']
    }
});
