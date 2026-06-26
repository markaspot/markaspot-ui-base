import clientConfig from './config/clients';

if (!clientConfig) {
    throw new Error('No client configuration found');
}

export default defineAppConfig({
    ui: {
        // Map all 7 Nuxt UI 4 semantic color aliases. Tenants can override any
        // of these via `theme.colors.*` in field_nuxt_config; otherwise we fall
        // through to Nuxt UI 4 defaults (green/blue/green/blue/yellow/red/slate).
        colors: {
            primary: clientConfig.theme?.colors?.primary || 'green',
            secondary: clientConfig.theme?.colors?.secondary || 'blue',
            success: clientConfig.theme?.colors?.success || 'green',
            info: clientConfig.theme?.colors?.info || 'blue',
            warning: clientConfig.theme?.colors?.warning || 'yellow',
            error: clientConfig.theme?.colors?.error || 'red',
            neutral: clientConfig.theme?.colors?.neutral || clientConfig.theme?.colors?.gray || 'slate'
            // Note: Custom colors (forest, crimson) are defined in @theme in main.css
            // and registered in nuxt.config.ts ui.colors array.
            // DO NOT map them here - let Nuxt UI discover them from Tailwind theme.
        },
        // Icon set used by <UIcon>
        icons: 'heroicons'

        // Note: Component defaultVariants are NOT supported in Nuxt UI v4
        // Form components use App* wrappers (AppInput, AppTextarea, AppSelect, AppSelectMenu)
        // in app/components/base/ which provide variant="soft" by default
    },
    // Surface selected feature flags if needed by the app
    features: {
        boundaries: clientConfig.features?.boundaries
    }
});
