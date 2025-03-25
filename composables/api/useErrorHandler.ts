
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ErrorState } from '~/types/error'

export const useErrorHandler = () => {
  const { t } = useI18n()
  const errorState = ref<ErrorState>({
    message: t('errors.validation.title'),
    errors: [],
    isVisible: false,
    meta: {}
  })

    const processApiErrors = (error: any) => {
    if (errorState.value.isVisible) return

    
    errorState.value = {
      message: t('errors.validation.title'),
      errors: [],
      isVisible: true,
      meta: {}
    }
    
    
    if (error.status === 429 || error.response?.status === 429) {
      
      
      const errorMessage = error.originalMessage || 
                         error.message || 
                         error.response?.data?.message ||
                         error.data?.message ||
                         error.data || 
                         'Too many requests';
      
      
      const waitTimeMatch = errorMessage.match(/try again in (\d+) seconds/i) || 
                           errorMessage.match(/Please try again in (\d+) seconds/i) ||
                           errorMessage.match(/in (\d+) seconds/i) ||
                           errorMessage.match(/(\d+) seconds/i);
      
      const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[1]) : null;
      
      
      errorState.value.message = t('errors.rate_limit.title');
      
      
      if (waitTime) {
        errorState.value.meta = { 
          seconds: waitTime,
          type: 'rate_limit'
        };
      }
      
      
      errorState.value.errors.push({
        field: 'general',
        message: waitTime 
          ? 'errors.rate_limit.with_time' 
          : 'errors.rate_limit.general',  
        code: 'rate_limit',
        
        meta: { seconds: waitTime }
      });
      
      
      
      
      return;
    }

    
    if (error.response?.data?.errors) {
      const apiErrors = error.response.data.errors;
      
      
      if (error.status === 422 || error.response?.status === 422) {
        errorState.value.message = t('errors.validation.invalid_input');
      }
      
      
      
      apiErrors.forEach((apiError: any) => {
        
        const fieldMatch = apiError.source?.pointer?.match(/\/data\/attributes\/([^/]+)/);
        const field = fieldMatch ? fieldMatch[1] : 'general';
        
        
        const detail = apiError.detail || apiError.title || t('errors.general');
        
        
        
        
        if (detail.includes('örtlichen Zuständigkeit') || detail.includes('jurisdiction') || 
            detail.includes('outside our range') || detail.includes('range of activity')) {
          
          errorState.value.message = t('errors.validation.location_error_title');
          
          
          addFormattedError('geolocation', t('errors.validation.location_out_of_bounds'));
        } 
        
        else if (detail.includes('kürzlich erstellten Beitrag') || detail.includes('bereits gemeldet')) {
          
          const reportIdMatch = detail.match(/\[Beitrag Nr:?\s*([^\]]+)\]/i) || detail.match(/\[Submission No:?\s*([^\]]+)\]/i);
          const reportId = reportIdMatch?.[1]?.trim();
          
          errorState.value.message = t('errors.validation.duplicate_title');
          if (reportId) {
            addFormattedError('field_geolocation', t('errors.validation.duplicate_report', { reportId }));
          } else {
            addFormattedError('field_geolocation', detail);
          }
        } else {
          
          addFormattedError(field, detail);
        }
      });
      
      return;
    }
    
    
    const errorMessage = error.toString().replace('ApiError: ', '');

    // Handle specific business error cases with regex pattern matching for more reliability
    if (errorMessage.match(/örtlichen\s+Zuständigkeit|jurisdiction|out\s+of\s+bounds|outside our range|range of activity/i)) {
      errorState.value.message = t('errors.validation.location_error_title');
      
      
      errorState.value.errors.push({
        field: 'geolocation', 
        message: t('errors.validation.location_out_of_bounds'),
        code: 'location_error'
      });
    } else if (errorMessage.match(/kürzlich\s+erstellten\s+Beitrag|duplicate|similar\s+report/i)) {
      
      const reportIdMatch = errorMessage.match(/(?:Beitrag\s+Nr:|Report\s+No:)\s*([^\s]+)/i);
      const reportId = reportIdMatch?.[1]?.trim();

      errorState.value.errors.push({
        field: 'general',
        message: reportId
          ? t('errors.validation.duplicate_report', { reportId })
          : t('errors.validation.duplicate_found'),
        code: 'duplicate_report',
        meta: { reportId }
      });
    } else if (errorMessage.match(/Datenschutzerklärung|privacy\s+policy|gdpr/i)) {
      errorState.value.errors.push({
        field: 'field_gdpr',
        message: t('errors.validation.gdpr_required'),
        code: 'gdpr_error'
      });
    } else if (errorMessage.match(/E-Mail|email/i)) {
      errorState.value.errors.push({
        field: 'field_e_mail',
        message: t('errors.validation.email_invalid'),
        code: 'email_error'
      });
    } else if (errorMessage.match(/required|missing|mandatory/i)) {
      
      const fieldMatch = errorMessage.match(/^([^:]+):/);
      const field = fieldMatch ? fieldMatch[1].trim() : 'general';
      
      errorState.value.errors.push({
        field,
        message: t('errors.validation.required_field', { field: field }),
        code: 'required_field'
      });
    } else {
      
      errorState.value.errors.push({
        field: 'general',
        message: t('errors.general'),
        code: 'error'
      });
    }
  }

    const addFormattedError = (field: string, message: string) => {
    
    let cleanField = field.replace(/^field_/, '');
    
    // Normalize field names from API to form field names
    const fieldMap: Record<string, string> = {
      'geolocation': 'field_geolocation',
      'gdpr': 'field_gdpr',
      'e_mail': 'field_e_mail',
      'email': 'field_e_mail',
      'category': 'field_category',
      'request_media': 'field_request_media',
      'name': 'field_name',
      'prename': 'field_prename',
      'phone': 'field_phone',
      'description': 'body',
    };

    
    const normalizedField = fieldMap[cleanField] || field;
    
    
    let translatedMessage = message;
    
    
    const errorPatterns = [
      { regex: /outside.+jurisdiction|range of activity|outside our range/i, key: 'errors.validation.location_out_of_bounds' },
      { regex: /field is required|required field/i, key: 'errors.validation.required_field', params: { field } },
      { regex: /invalid format|invalid email/i, key: 'errors.validation.invalid_format', params: { field } },
    ];
    
    
    for (const pattern of errorPatterns) {
      if (pattern.regex.test(message)) {
        translatedMessage = pattern.params 
          ? t(pattern.key, pattern.params) 
          : t(pattern.key);
        break;
      }
    }
    
    errorState.value.errors.push({
      field: normalizedField,
      message: translatedMessage,
      code: 'validation_error'
    });
  }

  const clearErrors = () => {
    errorState.value = {
      message: t('errors.validation.title'),
      errors: [],
      isVisible: false,
      meta: {}
    }
  }

  return { errorState, processApiErrors, clearErrors, addFormattedError }
}