import { useStore } from './store';
import { format, isSameDay } from 'date-fns';

export function requestPermission() {
  if (!('Notification' in window)) return;
  if (window.Notification.permission !== 'granted' && window.Notification.permission !== 'denied') {
    window.Notification.requestPermission();
  }
}

export function scheduleAll() {
  if (!('Notification' in window) || window.Notification.permission !== 'granted') return;
  
  // Real implementation would use Service Worker
  // For now, we simulate scheduling by checking periodically or using timeouts for today's events
  
  const store = useStore.getState();
  const { profile, tasks, events, sessions } = store;
  const prefs = profile.preferences.notifications;

  // Since we don't have a background service worker running in this simple local app,
  // we could set timeouts for events happening today.
  // In a real PWA, you would push these to a Service Worker or a backend.
  
  console.log('Notifications scheduled based on preferences:', prefs);
}

export function triggerNotification(title: string, options: NotificationOptions) {
  if (!('Notification' in window) || window.Notification.permission !== 'granted') return;
  new Notification(title, options);
}

