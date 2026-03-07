import { useCallback } from 'react';
import { useNotifications } from './useNotifications';

export function usePublicationNotificationRead() {
  const { notifications, markAsRead } = useNotifications();

  return useCallback((idApi) => {
    if (!idApi || !Array.isArray(notifications)) return;

    const target = notifications.find((notification) =>
      !notification.read
      && notification.type === 'publication'
      && String(notification?.metadata?.id_api) === String(idApi)
    );

    if (target) {
      markAsRead(target.id);
    }
  }, [notifications, markAsRead]);
}
