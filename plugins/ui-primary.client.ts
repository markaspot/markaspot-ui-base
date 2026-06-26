export default defineNuxtPlugin(() => {
    const root = document.documentElement;

    const applyPrimary = () => {
        const isDark = root.classList.contains('dark');
        // Bind Nuxt UI ring color to our Tailwind role tokens
        root.style.setProperty('--ui-primary', isDark ? 'var(--color-primary-400)' : 'var(--color-primary-500)');
    };

    // Initial apply
    applyPrimary();

    // React to color mode changes (dark class toggles on <html>)
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'class') {
                applyPrimary();
            }
        }
    });

    observer.observe(root, { attributes: true });

    // Clean up on HMR/dispose
    if (import.meta.hot) {
        import.meta.hot.dispose(() => observer.disconnect());
    }
});
