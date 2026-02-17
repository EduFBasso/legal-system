import { useContext } from 'react';
import { NotificationsContext } from '../contexts/NotificationsContext';

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationsProvider');
  }
  return context;
}
