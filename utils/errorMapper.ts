
export const FIELD_MAPPINGS = {
  'field_geolocation': 'location',
  'field_request_media': 'photos',
  'field_category': 'category',
  'field_e_mail': 'email',
  'body': 'description',
  'field_gdpr': 'gdpr',
} as const

export const ERROR_CODES = {
  REQUIRED: 'required',
  INVALID_FORMAT: 'invalid_format',
  OUT_OF_RANGE: 'out_of_range',
  MAX_FILES: 'max_files',
  CONSENT_REQUIRED: 'consent_required',
  DUPLICATE_REPORT: 'duplicate_report'
} as const