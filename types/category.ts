export interface ServiceDefinitionAttributeValue {
    key: string
    name: string
}

export interface ServiceDefinitionAttribute {
    code: string
    variable: boolean
    datatype: 'string' | 'number' | 'text' | 'datetime' | 'singlevaluelist' | 'multivaluelist' | 'imagelist'
    required: boolean
    description: string
    order: number
    values?: ServiceDefinitionAttributeValue[]
    media_type?: string
    media_group?: string
    datatype_description?: string
    default_value?: string | number
    validation?: {
        pattern?: string
        pattern_message?: string
        min?: number
        max?: number
    }
    conditions?: {
        show_when?: Array<{
            attribute_code: string
            operator: 'equals' | 'not_equals' | 'contains' | 'not_empty'
            value?: string
        }>
    }
}

export interface TaxonomyTerm {
    id: string
    type: 'taxonomy_term--service_category'
    attributes: {
        name: string
        description?: string
        weight: number
        parent: string | null
        drupal_internal__tid?: number
        field_category_icon?: string
        field_service_code?: string
        field_service_definition?: string | { value: string, format?: string | null, processed?: string }
    }
    relationships?: {
        parent?: {
            data: {
                id: string
                type: 'taxonomy_term--service_category'
            }[] | null
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
