export interface TaxonomyTerm {
    id: string
    type: 'taxonomy_term--service_category'
    attributes: {
        name: string
        description?: string
        weight: number
        parent: string | null
    }
    relationships?: {
        parent?: {
            data: {
                id: string
                type: 'taxonomy_term--service_category'
            } | null
        }
    }
}

export interface CategoryTree {
    id: string
    name: string
    description?: string
    children: CategoryTree[]
    parent_id: string | null
}
