// eslint.config.js  ── ESLint v9 (flat‑config) for a standard Nuxt 3 + TypeScript project
import { createConfigForNuxt } from '@nuxt/eslint-config';

export default createConfigForNuxt({
    /* ────────────────────────────────────────────────────────── base options */
    features: {
        stylistic: true, // ESLint‑Stylistic → acts like Prettier in‑editor
        test: true // Vitest/Cypress globals inside test/**
    // tooling: true   // uncomment if this is a library/module repo
    },
    typescript: {
        tsconfigPath: './tsconfig.json',
        strict: true
    }
})
/* ─────────────────────────────────────────────── global ignores & ordering */
    .prepend({
        ignores: ['.nuxt/**', '.output/**', 'dist/**', '.claude/**', 'scripts/*.js', 'scripts/*.cjs', 'scripts/*.mjs', 'server/api/**/*.ts']
    })
/* ──────────────────────────────────────────── Vue‑specific ergonomic tweaks */
    .override('nuxt/vue/rules', {
        rules: {
            'vue/multi-word-component-names': ['warn', {
                ignores: ['index', '[id]', '[uuid]', '[template]', '[token]', 'Map', 'Logo', 'ai', 'billing', 'branding', 'categories', 'claim', 'create', 'duplicates', 'fastmap', 'general', 'info', 'invite', 'login', 'members', 'metrics', 'statuses', 'workspace']
            }],
            'vue/require-default-prop': 'off',
            'vue/no-unused-vars': 'off',
            'vue/no-v-html': 'off', // We use v-html safely for controlled content
            'vue/no-unused-components': 'warn',
            'vue/html-self-closing': 'warn',
            'vue/max-attributes-per-line': 'warn',
            'vue/attributes-order': 'warn',
            'vue/singleline-html-element-content-newline': 'warn'
        }
    })
/* ──────────────────────────────────────── TypeScript hygiene adjustments */
    .override('nuxt/typescript/rules', {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off', // Necessary for API integrations
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_|nuxtApp|context|state|error|e|err|index|categoryHex',
                varsIgnorePattern: '^_|props|emit|slots|t|settings|locale|config|showInfo|pageToShow|iconColor|hasField|boundaryConfig|reverseGeocode|ApiError|Props|ERROR_TRANSLATIONS|ITEMS_PER_PAGE|pendingLoads|svgToImage|reverse|availableFields|uploadMedia|errorMessages|ref|customRef|MAX_RETRY_INTERVAL',
                ignoreRestSiblings: true,
                caughtErrors: 'none'
            }],
            '@typescript-eslint/ban-types': 'off'
        }
    })
/* ──────────────────── stylistic rules changed to warnings */
    .override('nuxt/stylistic', {
        rules: {
            '@stylistic/no-trailing-spaces': 'warn',
            '@stylistic/comma-dangle': 'warn',
            '@stylistic/semi': 'warn',
            '@stylistic/eol-last': 'warn',
            '@stylistic/indent': 'warn',
            '@stylistic/indent-binary-ops': 'warn',
            '@stylistic/operator-linebreak': 'warn',
            '@stylistic/brace-style': 'warn'
        }
    })
/* ──────────────────── environment‑aware console/debugger restrictions */
    .append({
        name: 'env‑aware',
        files: ['**/*.{ts,js,vue}'],
        rules: {
            'no-console': 'off', // Allow console for development
            'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
            'no-undef': 'off', // TypeScript handles this better
            'prefer-const': 'warn' // Warn for let that could be const
        }
    })
/* ──────────────────── disable buggy unified-signatures rule globally */
    .append({
        name: 'typescript-eslint-workaround',
        files: ['**/*.{ts,js,vue}'],
        rules: {
            '@typescript-eslint/unified-signatures': 'off' // Bug in @typescript-eslint/eslint-plugin v8.46.2
        }
    });
