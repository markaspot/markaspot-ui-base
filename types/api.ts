

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
    } | {
        type: string
        id: string
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