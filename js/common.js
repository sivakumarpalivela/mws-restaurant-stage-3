// Register the service worker as this is common js file for both htmls
if ('serviceWorker' in navigator) {
 
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('../abc.js')
        .then(reg => console.log('Service Worker: Registered (pages)'))
        .catch(err => console.log(`Service Worker: Error: ${err}`));
    });
  }