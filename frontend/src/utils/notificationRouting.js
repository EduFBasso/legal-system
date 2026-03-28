import { openPublicationDetailsWindow } from './publicationNavigation';

export function buildNotificationsHighlightPath(notificationId) {
  if (!notificationId) return '/notifications';
  return `/notifications?highlight=${encodeURIComponent(String(notificationId))}`;
}

export function routeNotification({ notification, navigate, mode = 'details' }) {
  if (!notification) return false;

  if (
    notification.type === 'process' &&
    notification.metadata?.alert_type === 'stale_90_days'
  ) {
    if (notification.metadata?.case_id) {
      navigate(`/cases/${notification.metadata.case_id}?tab=info`);
    } else {
      navigate('/cases');
    }
    return true;
  }

  if (notification.type === 'publication') {
    if (mode === 'notifications') {
      navigate(buildNotificationsHighlightPath(notification.id));
      return true;
    }

    const publicationId = notification.metadata?.id_api;
    if (publicationId) {
      openPublicationDetailsWindow(publicationId);
    } else {
      navigate('/search-history');
    }
    return true;
  }

  return false;
}
