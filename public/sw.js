// Service Worker for Campus Connect PWA
const CACHE_NAME = 'campus-connect-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache install failed:', error);
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip caching for Supabase auth and API requests
  if (event.request.url.includes('.supabase.co') || 
      event.request.url.includes('/auth/') ||
      event.request.url.includes('/rest/')) {
    // Pass through to network without caching
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-attendance') {
    event.waitUntil(syncAttendanceData());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from Campus Connect',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Campus Connect', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync attendance data when online
async function syncAttendanceData() {
  try {
    // This would sync any offline attendance data
    console.log('Syncing attendance data...');
    
    // Check if there's offline data to sync
    const offlineData = await getOfflineAttendanceData();
    
    if (offlineData.length > 0) {
      // Send data to server
      for (const data of offlineData) {
        await syncSingleAttendanceRecord(data);
      }
      
      // Clear offline data after successful sync
      await clearOfflineAttendanceData();
    }
  } catch (error) {
    console.error('Failed to sync attendance data:', error);
  }
}

// Helper functions for offline data management
async function getOfflineAttendanceData() {
  // This would get data from IndexedDB or localStorage
  return [];
}

async function syncSingleAttendanceRecord(data) {
  // This would send the data to the server
  console.log('Syncing record:', data);
}

async function clearOfflineAttendanceData() {
  // This would clear the offline storage
  console.log('Cleared offline data');
}