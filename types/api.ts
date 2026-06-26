// types/api.ts

export interface DrupalJsonApiResponse<T> {
    data: T
    included?: unknown[]
    links?: {
        self?: string
        related?: string
        next?: string
        prev?: string
    }
    meta?: {
        count?: number
        [key: string]: unknown
    }
}

export interface DrupalJsonApiError {
    errors: Array<{
        status: string
        title: string
        detail: string
        source?: {
            pointer?: string
            parameter?: string
        }
    }>
}

export interface DrupalJsonApiRelationship {
    data: {
        type: string
        id: string
        meta?: Record<string, unknown>
    } | {
        type: string
        id: string
        meta?: Record<string, unknown>
    }[]
    links?: {
        self?: string
        related?: string
    }
}

export interface DrupalEntityBase {
    id: string
    type: string
    attributes: Record<string, unknown>
    relationships?: Record<string, DrupalJsonApiRelationship>
    links?: {
        self?: string
    }
}

/**
 * Canonical JSON:API resource shape for dashboard transforms.
 * Aliases DrupalEntityBase so the dashboard composables share one resource
 * type instead of redefining a local divergent interface.
 */
export type JsonApiResource = DrupalEntityBase;

/**
 * CSV export resource shape used by the dashboard request list pages.
 * Hoisted here so the georeport and JSON:API list pages import one
 * definition instead of duplicating it.
 */
export interface CsvJsonApiResource {
    id: string
    type: string
    attributes?: Record<string, unknown>
    relationships?: Record<string, unknown>
}
