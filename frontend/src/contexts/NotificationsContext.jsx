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
  const [shownNotifications, setShownNotifications] = useState(new Set()); // IDs já exibidas

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
    // Verificar se já foi exibida nesta sessão
    if (shownNotifications.has(notification.id)) {
      return;
    }
    
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
    
    // Marcar como já exibida
    setShownNotifications(prev => new Set([...prev, notification.id]));
    
    // Quando clicar: marcar como lida e navegar
    webNotification.onclick = async () => {
      window.focus();
      
      // Marcar como lida no backend
      try {
        await fetch(`${API_BASE_URL}/notifications/${notification.id}/toggle_read/`, {
          method: 'POST'
        });
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Erro ao marcar notificação como lida:', err);
      }
      
      if (notification.link) {
        window.location.href = notification.link;
      }
      webNotification.close();
    };
    
    // Auto-marcar como lida após 10 segundos (se não for urgente)
    if (notification.priority !== 'urgent') {
      setTimeout(async () => {
        try {
          await fetch(`${API_BASE_URL}/notifications/${notification.id}/toggle_read/`, {
            method: 'POST'
          });
          setNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
          console.error('Erro ao auto-marcar notificação:', err);
        }
      }, 10000);
    }
  }, [permission, shownNotifications]);

  // Buscar notificações não lidas
  const fetchUnreadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/notifications/unread/`);
      const data = await response.json();
      
      if (response.ok) {
        const newNotifications = data.notifications || [];
        
        // Atualizar contador de não lidas
        setUnreadCount(data.count || 0);
        
        // Merge inteligente: adicionar novas não lidas sem remover as lidas do estado
        setNotifications(prev => {
          // Se o estado está vazio, usar apenas as não lidas
          if (prev.length === 0) {
            return newNotifications;
          }
          
          // Criar mapa das notificações existentes para fácil lookup
          const existingMap = new Map(prev.map(n => [n.id, n]));
          
          // Adicionar/atualizar notificações não lidas
          newNotifications.forEach(notif => {
            existingMap.set(notif.id, notif);
          });
          
          // Retornar array ordenado por created_at (mais recente primeiro)
          return Array.from(existingMap.values()).sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          );
        });
        
        // Se houver novas notificações e temos permissão, mostrar Web Notification
        if (permission === 'granted' && newNotifications.length > 0) {
          // Mostrar apenas notificações criadas há menos de 2 minutos
          const recentNotifications = newNotifications.filter(notif => {
            const createdAt = new Date(notif.created_at);
            const now = new Date();
            const diffSeconds = (now - createdAt) / 1000;
            return diffSeconds < 120; // 2 minutos
          });
          
          // Mostrar cada notificação recente (se ainda não foi exibida)
          recentNotifications.forEach(notif => {
            showWebNotification(notif);
          });
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
        const data = await response.json();
        // Atualizar estado local
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: data.read } : n)
        );
        
        if (data.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        } else {
          // Se foi marcada como não lida, permitir reexibir
          setShownNotifications(prev => {
            const newSet = new Set(prev);
            newSet.delete(notificationId);
            return newSet;
          });
          setUnreadCount(prev => prev + 1);
        }
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

  // Limpar cache de notificações exibidas (útil para testes)
  const clearShownNotifications = () => {
    setShownNotifications(new Set());
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
    clearShownNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
