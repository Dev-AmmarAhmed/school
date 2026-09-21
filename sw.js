// sw.js - LIGHTWEIGHT (NO CACHING FOR MAXIMUM SPEED)

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Puraana koi bhi cache fasa ho toh use uda do taaki app fast chale
      return Promise.all(cacheNames.map((cache) => caches.delete(cache)));
    }).then(() => self.clients.claim())
  );
});

// IMPORTANT: Bypass all network requests. Do not cache Firebase/API calls.
self.addEventListener('fetch', (event) => {
  return; 
});

// App-Level Push Notification Engine
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.message || "You have a new update.",
    icon: "https://raw.githubusercontent.com/Dev-AmmarAhmed/mm-islamic-student-dashboard/main/icon.jpg",
    badge: "https://raw.githubusercontent.com/Dev-AmmarAhmed/mm-islamic-student-dashboard/main/icon.jpg",
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    data: { url: data.url || "/", type: data.type }
  };
  event.waitUntil(self.registration.showNotification(data.title || "MM School", options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});
