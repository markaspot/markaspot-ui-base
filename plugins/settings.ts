
import { useMarkASpotSettings } from '~/composables/core/useMarkASpotSettings'
import { useFormSettings } from '~/composables/form/useFormSettings'

export default defineNuxtPlugin(async () => {
    const { settings: formSettings, fetchSettings: fetchFormSettings } = useFormSettings()

    try {
        await fetchFormSettings()
         
    } catch (e) {
        console.error('Failed loading form settings:', e)
    }
})