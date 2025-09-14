import { useToast } from '@/hooks/use-toast';
import { config } from './config';

export type NotificationType = 'event_reminder' | 'team_invitation' | 'attendance_logged' | 'club_approved';

export interface NotificationTemplate {
  title: string;
  message: string;
}

// Notification templates
const templates: Record<NotificationType, (data: any) => NotificationTemplate> = {
  event_reminder: (data) => ({
    title: 'Event Reminder',
    message: `Don't forget about "${data.eventTitle}" starting at ${new Date(data.startTime).toLocaleString()}`,
  }),
  team_invitation: (data) => ({
    title: 'Team Invitation',
    message: `You've been invited to join team "${data.teamName}" for "${data.eventTitle}"`,
  }),
  attendance_logged: (data) => ({
    title: 'Attendance Confirmed',
    message: `Your attendance for "${data.eventTitle}" has been logged successfully`,
  }),
  club_approved: (data) => ({
    title: 'Club Approved',
    message: `Your club "${data.clubName}" has been approved and is now active`,
  }),
};

/**
 * Show a toast notification (simplified implementation)
 */
export function showNotification(
  type: NotificationType,
  data: any = {},
  toast?: any
): void {
  if (!config.enableNotifications) {
    console.log('Notifications disabled in config');
    return;
  }

  const template = templates[type](data);
  
  if (toast) {
    toast({
      title: template.title,
      description: template.message,
    });
  } else {
    // Fallback to browser notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(template.title, {
        body: template.message,
        icon: '/icons/icon-192x192.png',
      });
    }
  }
}

/**
 * Browser push notification support
 */
export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private registration: ServiceWorkerRegistration | null = null;

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return;
    }

    if ('serviceWorker' in navigator && this.registration) {
      // Use service worker for better notification management
      await this.registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      });
    } else {
      // Fallback to basic notification
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        ...options,
      });
    }
  }

  async init(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready;
      } catch (error) {
        console.warn('Service worker not available:', error);
      }
    }
  }
}

// Initialize push notification manager
export const pushNotificationManager = PushNotificationManager.getInstance();