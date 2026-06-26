export interface ServiceRequestData {
    body: {
        value: string
        format: 'plain_text' | 'basic_html'
    }
    field_category: string
    field_e_mail?: string
    field_gdpr: boolean
    field_geolocation: {
        lat: number
        lng: number
    }
    field_facility?: string
    field_feedback?: string
    title: string // Even though hidden in form, it's required by Drupal
}

export interface FeedbackData {
    feedback: string
    set_status: boolean
    uuid: string
}
