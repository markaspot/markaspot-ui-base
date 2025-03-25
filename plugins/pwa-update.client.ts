
export default defineNuxtPlugin((nuxtApp) => {
  if (process.client && 'serviceWorker' in navigator) {
    let refreshing = false;

    
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    
    
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister().then(boolean => {
          
        });
      }
    }).catch(error => {
      console.error('Service worker unregister failed:', error);
    });

    
    window.addEventListener('beforeinstallprompt', (e) => {
      
      e.preventDefault();
    });
  }
});
