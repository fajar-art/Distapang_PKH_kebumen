// Service Worker for SiMantap PKH Web Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'SiMantap PKH',
    body: 'Ada pembaruan data atau jadwal tugas baru.',
    icon: '/logo-simantap.png',
    badge: '/logo-simantap.png',
    url: '/beranda',
    tag: 'simantap-notification',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo-simantap.png',
    badge: data.badge || '/logo-simantap.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/beranda',
      timestamp: Date.now(),
    },
    tag: data.tag || `simantap-${Date.now()}`,
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/beranda';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
