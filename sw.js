// sw.js
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim()); // Take control of all pages immediately
});

// Handle Incoming Push Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const title = data.title || "M.M ISLAMIC ENGLISH SCHOOL";
  const options = {
    body: data.message || "You have a new update.",
    icon: "https://raw.githubusercontent.com/Dev-AmmarAhmed/mm-islamic-student-dashboard/main/icon.jpg",
    badge: "https://raw.githubusercontent.com/Dev-AmmarAhmed/mm-islamic-student-dashboard/main/icon.jpg",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/",
      type: data.type
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle Notification Clicks (Redirect to appropriate dashboard)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if already open
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if not open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
