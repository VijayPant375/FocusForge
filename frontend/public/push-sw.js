self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || 'FocusForge';
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});
