/**
 * Shared form-related type definitions
 */

/**
 * Media item uploaded by the user
 */
export interface UploadedMedia {
    id: string
    preview: string
    error?: string | { key: string, params?: Record<string, any> }
    progress?: number
    isUploading: boolean
    cachedId?: string // For offline cached media - the IndexedDB cache ID
    isOfflineCached?: boolean // True if this media is only cached locally, not uploaded
    status?: boolean // Media publish status (true=published, undefined=default published)
}

/**
 * Validation rule for form fields
 */
export interface ValidationRule {
    type: string
    constraint?: string | number | boolean
    message?: string
}

/**
 * Select option for dropdowns and lists
 */
export interface SelectOption<T = string | number> {
    label: string
    value: T
    disabled?: boolean
}

/**
 * Preload link for SSR resource hints
 */
export interface PreloadLink {
    rel: string
    as: string
    type?: string
    href: string
    crossorigin?: string
    fetchpriority?: string
    key?: string
}
