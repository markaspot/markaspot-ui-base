
import { ref } from 'vue'

interface TokenCache {
    value: string | null
    timestamp: number
}

const tokenCache = ref<TokenCache>({
    value: null,
    timestamp: 0
})

const CACHE_DURATION = 1000 * 60 * 30 

export const useTokenCache = () => {
    const isTokenValid = () => {
        if (!tokenCache.value.value) return false
        const now = Date.now()
        return now - tokenCache.value.timestamp < CACHE_DURATION
    }

    const getCachedToken = () => {
        return isTokenValid() ? tokenCache.value.value : null
    }

    const setCachedToken = (token: string) => {
        tokenCache.value = {
            value: token,
            timestamp: Date.now()
        }
    }

    const invalidateToken = () => {
        tokenCache.value = {
            value: null,
            timestamp: 0
        }
    }

    return {
        getCachedToken,
        setCachedToken,
        invalidateToken,
        isTokenValid
    }
}