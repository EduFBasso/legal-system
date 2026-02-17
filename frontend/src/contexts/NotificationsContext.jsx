import { createContext, useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const POLL_INTERVAL = 30000; // 30 segundos

// eslint-disable-next-line react-refresh/only-export-components
export const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('default');

  // Solicitar permissão para Web Notifications
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      if (Notification.permission === 'default') {
        // Solicitar permissão automaticamente após 2 segundos
        setTimeout(() => {
          Notification.requestPermission().then(result => {
            setPermission(result);
          });
        }, 2000);
      }
    }
  }, []);

  // Mostrar Web Notification
  const showWebNotification = useCallback((notification) => {
    if (permission !== 'granted') return;
    
    const options = {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `notification-${notification.id}`,
      requireInteraction: notification.priority === 'urgent',
      data: {
        id: notification.id,
        link: notification.link
      }
    };
    
    const webNotification = new Notification(notification.title, options);
    
    webNotification.onclick = () => {
      window.focus();
      if (notification.link) {
        window.location.href = notification.link;
      }
      webNotification.close();
    };
  }, [permission]);

  // Buscar notificações não lidas
  const fetchUnreadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/notifications/unread/`);
      const data = await response.json();
      
      if (response.ok) {
        const newNotifications = data.notifications || [];
        setNotifications(newNotifications);
        setUnreadCount(data.count || 0);
        
        // Se houver novas notificações e temos permissão, mostrar Web Notification
        if (permission === 'granted' && newNotifications.length > 0) {
          const latestNotification = newNotifications[0];
          
          // Verificar se é uma notificação nova (criada há menos de 1 minuto)
          const createdAt = new Date(latestNotification.created_at);
          const now = new Date();
          const diffSeconds = (now - createdAt) / 1000;
          
          if (diffSeconds < 60) {
            showWebNotification(latestNotification);
          }
        }
        
        setError(null);
      } else {
        throw new Error('Erro ao buscar notificações');
      }
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [permission, showWebNotification]);

  // Buscar todas as notificações
  const fetchAllNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/notifications/`);
      const data = await response.json();
      
      if (response.ok) {
        setNotifications(data.results || data || []);
        const unread = (data.results || data).filter(n => !n.read).length;
        setUnreadCount(unread);
        setError(null);
      } else {
        throw new Error('Erro ao buscar notificações');
      }
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Marcar notificação como lida
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/toggle_read/`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        // Atualizar estado local
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
      return false;
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/mark_all_read/`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
      return false;
    }
  };

  // Criar notificação de teste
  const createTestNotification = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/test/`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchUnreadNotifications();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao criar notificação de teste:', err);
      return false;
    }
  };



  // Solicitar permissão manualmente
  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    }
    return false;
  };

  // Polling: Buscar notificações a cada 30 segundos
  useEffect(() => {
    // Buscar imediatamente
    fetchUnreadNotifications();
    
    // Configurar polling
    const interval = setInterval(() => {
      fetchUnreadNotifications();
    }, POLL_INTERVAL);
    
    return () => clearInterval(interval);
  }, [fetchUnreadNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    permission,
    fetchUnreadNotifications,
    fetchAllNotifications,
    markAsRead,
    markAllAsRead,
    requestPermission,
    createTestNotification,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
