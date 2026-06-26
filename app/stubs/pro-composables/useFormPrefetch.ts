export function useFormPrefetch() {
    return {
        prefetched: readonly(ref(false)),
        prefetchError: readonly(ref<Error | null>(null)),
        prefetchFormChunks: async () => {},
        initPrefetch: () => {}
    };
}
