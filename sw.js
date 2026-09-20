// sw.js - Realtime Service Worker (No Offline Caching)

self.addEventListener('install', (event) => {
  // Immediately take control without waiting
  self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
  // Clear any old caches if they accidentally exist from previous versions
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((cache) => caches.delete(cache)));
    }).then(() => self.clients.claim())
  );
});

// App-Level Push Notification Engine
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const title = data.title || "M.M ISLAMIC ENGLISH SCHOOL";
  
  const options = {
    body: data.message || "You have a new update.",
    icon: "https://raw.githubusercontent.com/Dev-AmmarAhmed/mm-islamic-student-dashboard/6ffc7a916bc2902c4baea4a123634fbe732647b1/book-floating-cartoon-vector-icon-illustration-education-object-icon-isolated-flat-vector_138676-13661.jpg",
    badge: "https://raw.githubusercontent.com/Dev-AmmarAhmed/mm-islamic-student-dashboard/6ffc7a916bc2902c4baea4a123634fbe732647b1/book-floating-cartoon-vector-icon-illustration-education-object-icon-isolated-flat-vector_138676-13661.jpg",
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true, // Notification tab tak nahi hategi jab tak user click na kare
    data: {
      url: data.url || "/",
      type: data.type
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Handler - Directs user exactly to the right dashboard
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus if dashboard is already open in background
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If closed, open a new window securely
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
