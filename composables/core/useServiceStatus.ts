
import { ref, readonly } from 'vue'
import { useI18n } from 'vue-i18n'


const isServiceDown = ref(false)
const lastCheckTime = ref<number | null>(null)
const retryAfter = ref<number | null>(null)
const consecutiveFailures = ref(0)
const MAX_RETRY_INTERVAL = 30000 


const getDefaultMessage = () => 'The service is temporarily unavailable. Please try again later.'
const getRetryMessage = (seconds: number) => `The service is temporarily unavailable. Please try again in ${seconds} seconds.`

export function useServiceStatus() {
  
  let t: any = (key: string, fallback: string) => fallback
  try {
    const i18n = useI18n()
    t = i18n.t
  } catch (error) {
    console.warn('i18n not available in current context, using fallback messages')
  }

    const registerServiceFailure = (options: any = {}) => {
    isServiceDown.value = true
    lastCheckTime.value = Date.now()
    consecutiveFailures.value++
    
    
    const response = options.headers ? options : null
    const statusCode = options.statusCode || (response?.status ? response.status : null)
    
    
    
    
    retryAfter.value = 30000  
    
    console.warn(`Backend service unavailable. Status: ${statusCode}. Retry after: ${retryAfter.value}ms`)
  }

    const registerServiceSuccess = () => {
    if (isServiceDown.value) {
      console.info('Backend service is now available')
    }
    isServiceDown.value = false
    lastCheckTime.value = Date.now()
    consecutiveFailures.value = 0
    retryAfter.value = null
  }

    const shouldRetry = () => {
    if (!isServiceDown.value) return true
    if (!lastCheckTime.value || !retryAfter.value) return true
    
    return Date.now() - lastCheckTime.value > retryAfter.value
  }

    const getServiceDownMessage = () => {
    const defaultMessage = t('service_unavailable.message', getDefaultMessage())
    
    if (retryAfter.value && retryAfter.value > 0) {
      const seconds = Math.ceil(retryAfter.value / 1000)
      return t('service_unavailable.retry', { seconds }, getRetryMessage(seconds))
    }
    
    return defaultMessage
  }

  return {
    isServiceDown: readonly(isServiceDown),
    retryAfter: readonly(retryAfter),
    registerServiceFailure,
    registerServiceSuccess,
    shouldRetry,
    getServiceDownMessage
  }
}