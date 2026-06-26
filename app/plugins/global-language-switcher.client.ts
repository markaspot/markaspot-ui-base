// Global language switcher for external HTML content
export default defineNuxtPlugin(() => {
    // Register the function immediately when plugin loads
    if (typeof window !== 'undefined') {
        (window as any).switchToLS = function () {
            console.log('switchToLS called - emitting custom event');

            // Simply emit the custom event - the component will handle it
            window.dispatchEvent(new CustomEvent('switchLanguage', {
                detail: { locale: 'de-ls' }
            }));
        };

        console.log('Global switchToLS function registered');
    }
});
