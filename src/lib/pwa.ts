// PWA utilities for Campus Connect

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAManager {
  private static instance: PWAManager;
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  async init(): Promise<void> {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available
                this.showUpdateNotification();
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }

    // Handle install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
    });

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
    });

    // Detect if running as PWA
    this.checkIfInstalled();
  }

  private checkIfInstalled(): void {
    // Check if running in standalone mode (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    this.isInstalled = isStandalone || isIOSStandalone;
  }

  private showUpdateNotification(): void {
    // Show a notification that an update is available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Campus Connect Update Available', {
        body: 'A new version of Campus Connect is available. Please refresh to update.',
        icon: '/icons/icon-192x192.png',
        tag: 'app-update'
      });
    }
  }

  canInstall(): boolean {
    return this.deferredPrompt !== null && !this.isInstalled;
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  getInstallInstructions(): { platform: string; instructions: string[] } {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return {
        platform: 'Chrome',
        instructions: [
          'Click the three dots menu (⋮) in the top right',
          'Select "Install Campus Connect"',
          'Click "Install" in the popup'
        ]
      };
    } else if (userAgent.includes('firefox')) {
      return {
        platform: 'Firefox',
        instructions: [
          'Click the address bar',
          'Look for the install icon (+)',
          'Click to install Campus Connect'
        ]
      };
    } else if (userAgent.includes('safari')) {
      return {
        platform: 'Safari',
        instructions: [
          'Tap the Share button',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to install Campus Connect'
        ]
      };
    } else if (userAgent.includes('edg')) {
      return {
        platform: 'Edge',
        instructions: [
          'Click the three dots menu (...) in the top right',
          'Select "Apps" → "Install Campus Connect"',
          'Click "Install" in the popup'
        ]
      };
    }
    
    return {
      platform: 'Browser',
      instructions: [
        'Look for an install option in your browser menu',
        'Add Campus Connect to your home screen for easy access'
      ]
    };
  }

  isRunningAsPWA(): boolean {
    return this.isInstalled;
  }

  // Offline support utilities
  async enableOfflineSupport(): Promise<void> {
    if ('caches' in window) {
      try {
        // Pre-cache critical resources
        const cache = await caches.open('campus-connect-critical');
        await cache.addAll([
          '/',
          '/static/js/bundle.js',
          '/static/css/main.css',
          '/manifest.json'
        ]);
      } catch (error) {
        console.error('Failed to enable offline support:', error);
      }
    }
  }

  // Background sync for attendance data
  async registerBackgroundSync(tag: string): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Type assertion for sync property which may not be in TypeScript definitions
        await (registration as any).sync.register(tag);
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }

  // Check network status
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Add network status listeners
  addNetworkListeners(onOnline: () => void, onOffline: () => void): void {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
  }

  removeNetworkListeners(onOnline: () => void, onOffline: () => void): void {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  }

  // Clear service worker and caches (useful for debugging)
  async clearServiceWorkerAndCaches(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        // Unregister service worker
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('Service worker unregistered');
        }
        
        // Clear all caches
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
        
        console.log('All caches cleared');
        
        // Reload the page to start fresh
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear service worker and caches:', error);
      }
    }
  }
}

export const pwaManager = PWAManager.getInstance();

// Hook for React components
export function usePWA() {
  return {
    canInstall: pwaManager.canInstall(),
    promptInstall: () => pwaManager.promptInstall(),
    isInstalled: pwaManager.isRunningAsPWA(),
    getInstallInstructions: () => pwaManager.getInstallInstructions(),
    isOnline: pwaManager.isOnline(),
    clearServiceWorker: () => pwaManager.clearServiceWorkerAndCaches(),
  };
}

// Make debug functions available globally
if (typeof window !== 'undefined') {
  (window as any).clearServiceWorker = () => pwaManager.clearServiceWorkerAndCaches();
  (window as any).pwaManager = pwaManager;
}