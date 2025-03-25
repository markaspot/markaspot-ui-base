
import { useMarkASpotSettings } from '~/composables/core/useMarkASpotSettings'

export default defineNuxtPlugin(async () => {
    const { settings, fetchSettings } = useMarkASpotSettings()

    await fetchSettings()

    if (settings.value) {
        const domains = new Set<string>()
        const prefetchUrls = new Set<string>()

        if (settings.value.mapbox_style) {
            const styleUrl = new URL(settings.value.mapbox_style)
            domains.add(styleUrl.origin)
            prefetchUrls.add(settings.value.mapbox_style)
        }
        if (settings.value.mapbox_style_dark) {
            const darkStyleUrl = new URL(settings.value.mapbox_style_dark)
            domains.add(darkStyleUrl.origin)
            prefetchUrls.add(settings.value.mapbox_style_dark)
        }

        useHead({
            link: [
                
                ...Array.from(domains).map(domain => ({
                    rel: 'preconnect',
                    href: domain
                })),
                
                ...Array.from(prefetchUrls).map(url => ({
                    rel: 'prefetch',
                    href: url,
                    as: 'fetch',
                    crossorigin: 'anonymous'
                }))
            ]
        })
    }
})