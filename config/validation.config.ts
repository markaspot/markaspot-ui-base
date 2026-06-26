import type { ClientConfig } from '~~/types/clientConfig';

interface ValidationError {
    path: string
    message: string
}

/**
 * Simple runtime validation for client configuration
 * This provides basic validation without external dependencies
 */
export function validateClientConfig(config: any): { isValid: boolean, errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    // Required fields validation
    if (!config) {
        errors.push({ path: 'config', message: 'Configuration is required' });
        return { isValid: false, errors };
    }

    if (!config.name || typeof config.name !== 'string') {
        errors.push({ path: 'name', message: 'Client name is required and must be a string' });
    }

    if (!config.shortName || typeof config.shortName !== 'string') {
        errors.push({ path: 'shortName', message: 'Client shortName is required and must be a string' });
    }

    if (!config.domain || typeof config.domain !== 'string') {
        errors.push({ path: 'domain', message: 'Client domain is required and must be a string' });
    }

    if (!config.apiEndpoint || typeof config.apiEndpoint !== 'string') {
        errors.push({ path: 'apiEndpoint', message: 'API endpoint is required and must be a string' });
    }

    // Theme validation
    if (!config.theme) {
        errors.push({ path: 'theme', message: 'Theme configuration is required' });
    } else {
        if (!config.theme.logoLight) {
            errors.push({ path: 'theme.logoLight', message: 'Light logo path is required' });
        }
        if (!config.theme.logoDark) {
            errors.push({ path: 'theme.logoDark', message: 'Dark logo path is required' });
        }
        if (!config.theme.favicon) {
            errors.push({ path: 'theme.favicon', message: 'Favicon path is required' });
        }
    }

    // Features validation
    if (!config.features) {
        errors.push({ path: 'features', message: 'Features configuration is required' });
    } else {
        if (typeof config.features.photoReporting !== 'boolean') {
            errors.push({ path: 'features.photoReporting', message: 'photoReporting must be a boolean' });
        }
        if (typeof config.features.statistics !== 'boolean') {
            errors.push({ path: 'features.statistics', message: 'statistics must be a boolean' });
        }
        if (!Array.isArray(config.features.categories)) {
            errors.push({ path: 'features.categories', message: 'categories must be an array' });
        }
    }

    // Languages validation (if provided)
    if (config.languages) {
        if (config.languages.locales && !Array.isArray(config.languages.locales)) {
            errors.push({ path: 'languages.locales', message: 'locales must be an array' });
        }
        if (config.languages.defaultLocale && typeof config.languages.defaultLocale !== 'string') {
            errors.push({ path: 'languages.defaultLocale', message: 'defaultLocale must be a string' });
        }
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Log validation errors in a readable format
 */
export function logValidationErrors(errors: ValidationError[]) {
    if (errors.length === 0) return;

    console.error('❌ Client configuration validation failed:');
    errors.forEach((error) => {
        console.error(`  • ${error.path}: ${error.message}`);
    });
}

/**
 * Validate client config and throw on errors (for build-time validation)
 */
export function validateClientConfigStrict(config: any): asserts config is ClientConfig {
    const { isValid, errors } = validateClientConfig(config);

    if (!isValid) {
        logValidationErrors(errors);
        throw new Error(`Client configuration validation failed with ${errors.length} errors`);
    }
}

/**
 * Validate client config with warnings only (for runtime validation)
 */
export function validateClientConfigSoft(config: any): config is ClientConfig {
    const { isValid, errors } = validateClientConfig(config);

    if (!isValid) {
        console.warn('⚠️ Client configuration has validation warnings:');
        errors.forEach((error) => {
            console.warn(`  • ${error.path}: ${error.message}`);
        });
    }

    return isValid;
}
