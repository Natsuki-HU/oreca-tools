if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', async () => {
    try {
      const swUrl = new URL('../service-worker.js', import.meta.url);
      const scopeUrl = new URL('../', import.meta.url);
      const registration = await navigator.serviceWorker.register(swUrl, { scope: scopeUrl.pathname });
      registration.update().catch(() => {});
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}
