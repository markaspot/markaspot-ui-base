// composables/core/useLanguage.ts
import { ref, computed } from 'vue'

export function useLanguage() {
    const currentLocale = ref('en')
    const isChangingLocale = ref(false)
    
    // Always return only English
    const availableLocales = computed(() => [
        { code: 'en', name: 'English' }
    ])

    const switchLanguage = async () => {
        console.warn('Language switching is disabled in base edition')
    }

    const getNextLocale = () => 'en'

    return {
        currentLocale,
        switchLanguage,
        isChangingLocale,
        availableLocales,
        getNextLocale
    }
}