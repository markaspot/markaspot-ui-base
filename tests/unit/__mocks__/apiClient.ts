/**
 * Mock API Client for Unit Testing
 *
 * This provides a controllable mock of the useApiClient composable
 * that allows tests to simulate API responses and errors.
 */

import { vi } from 'vitest';

/**
 * Create a mock API client with default implementations
 * Tests can override specific methods as needed
 */
export const createMockApiClient = () => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    getBaseUrl: vi.fn(() => 'https://dev.ddev.site'),
    getCsrfToken: vi.fn(() => Promise.resolve('mock-csrf-token')),
    refreshCsrfToken: vi.fn(() => Promise.resolve())
});

/**
 * Mock useApiClient composable
 * This will be used to replace the real implementation in tests
 */
export const mockUseApiClient = vi.fn(() => createMockApiClient());

/**
 * Helper to create a mock form settings response
 * This matches the structure returned by the Drupal API
 */
export const createMockFormSettings = (overrides: any = {}) => ({
    entity_type: 'node',
    bundle: 'service_request',
    form_mode: 'default',
    fields: {
        field_address: {
            label: 'Address',
            description: 'Enter the address',
            required: true,
            validation_message: 'Address is required',
            widget_settings: {
                placeholder: 'Enter address...'
            }
        },
        field_category: {
            label: 'Category',
            required: true
        },
        field_description: {
            label: 'Description',
            required: false,
            widget_settings: {
                placeholder: 'Describe the issue...'
            }
        },
        ...overrides
    }
});

/**
 * Helper to simulate API errors
 */
export class MockApiError extends Error {
    constructor(
        public status: number,
        public statusText: string,
        public data: any
    ) {
        super(`API Error: ${status} ${statusText}`);
        this.name = 'ApiError';
    }
}
