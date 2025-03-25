
import { ref, onMounted, onUnmounted } from 'vue'

export function useLayout() {
    
    const isDesktop = ref<boolean | null>(null)

    const updateLayout = () => {
        isDesktop.value = window.innerWidth >= 768
    }

    onMounted(() => {
        updateLayout()
        window.addEventListener('resize', updateLayout)
    })

    onUnmounted(() => {
        window.removeEventListener('resize', updateLayout)
    })

    return {
        isDesktop,
        
        isLayoutReady: computed(() => isDesktop.value !== null)
    }
}