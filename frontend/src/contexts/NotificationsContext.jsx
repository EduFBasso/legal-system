import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { getApiBaseUrl, getAuthToken } from '../utils/apiFetch';

const API_BASE_URL = getApiBaseUrl();
const POLL_INTERVAL = 30000; // 30 segundos

// eslint-disable-next-line react-refresh/only-export-components
export const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('default');
  const [authToken, setAuthToken] = useState(() => getAuthToken());
  const shownNotificationsRef = useRef(new Set()); // IDs já exibidas - usar ref para evitar re-renders

  const buildAuthHeaders = useCallback((json = false) => {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    if (json) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }, [authToken]);

  const resetNotificationsState = useCallback(() => {
    setNotifications(prev => (prev.length === 0 ? prev : []));
    setUnreadCount(prev => (prev === 0 ? prev : 0));
    setError(prev => (prev === null ? prev : null));
    shownNotificationsRef.current = new Set();
  }, []);

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
    if (shownNotificationsRef.current.has(notification.id)) {
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
    shownNotificationsRef.current = new Set([...shownNotificationsRef.current, notification.id]);
    
    // Quando clicar: marcar como lida e navegar
    webNotification.onclick = async () => {
      window.focus();
      
      // Marcar como lida no backend
      try {
        await fetch(`${API_BASE_URL}/notifications/${notification.id}/toggle_read/`, {
          method: 'POST',
          headers: buildAuthHeaders(),
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
  }, [buildAuthHeaders, permission]);

  // Buscar notificações não lidas
  const fetchUnreadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      if (!authToken) {
        setUnreadCount(0);
        setNotifications([]);
        return;
      }
      const response = await fetch(`${API_BASE_URL}/notifications/unread/`, {
        headers: buildAuthHeaders(),
      });
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
  }, [authToken, buildAuthHeaders, permission, showWebNotification]);

  // Buscar todas as notificações
  const fetchAllNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/notifications/`, {
        headers: buildAuthHeaders(),
      });
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
  // ATENÇÃO: Este endpoint faz TOGGLE (alterna entre lida/não lida)
  // Por isso, só deve ser chamado se a notificação ainda não estiver lida
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/toggle_read/`,
        { method: 'POST', headers: buildAuthHeaders() }
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
          shownNotificationsRef.current.delete(notificationId);
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
        { method: 'POST', headers: buildAuthHeaders() }
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
  const createTestNotification = async (mode = 'default') => {
    try {
      const endpoint = mode && mode !== 'default'
        ? `${API_BASE_URL}/notifications/test/?mode=${encodeURIComponent(mode)}`
        : `${API_BASE_URL}/notifications/test/`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: buildAuthHeaders(),
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
    shownNotificationsRef.current = new Set();
  };

  // Deletar notificação individual
  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/`,
        { method: 'DELETE', headers: buildAuthHeaders() }
      );
      
      if (response.ok || response.status === 204) {
        // Remover do estado local
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao deletar notificação:', err);
      return false;
    }
  };

  // Deletar múltiplas notificações
  const deleteMultipleNotifications = async (notificationIds) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/delete_multiple/`,
        {
          method: 'POST',
          headers: buildAuthHeaders(true),
          body: JSON.stringify({ notification_ids: notificationIds })
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Remover do estado local
        setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
        // Recalcular não lidas
        setUnreadCount(prev => {
          const deletedUnread = notifications.filter(
            n => notificationIds.includes(n.id) && !n.read
          ).length;
          return Math.max(0, prev - deletedUnread);
        });
        return { success: true, deleted: data.deleted };
      }
      return { success: false, message: data.message };
    } catch (err) {
      console.error('Erro ao deletar múltiplas notificações:', err);
      return { success: false, message: err.message };
    }
  };

  // Deletar todas as notificações
  const deleteAllNotifications = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/delete_all/`,
        { method: 'POST', headers: buildAuthHeaders() }
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setNotifications([]);
        setUnreadCount(0);
        return { success: true, deleted: data.deleted };
      }
      return { success: false, message: data.message };
    } catch (err) {
      console.error('Erro ao deletar todas as notificações:', err);
      return { success: false, message: err.message };
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
    if (!authToken) {
      resetNotificationsState();
      return;
    }

    // Buscar imediatamente
    fetchUnreadNotifications();
    
    // Configurar polling
    const interval = setInterval(() => {
      fetchUnreadNotifications();
    }, POLL_INTERVAL);
    
    return () => clearInterval(interval);
  }, [authToken, fetchUnreadNotifications, resetNotificationsState]);

  // Atualizar notificações ao finalizar busca de publicações
  // Inclui retries curtos para cobrir criação assíncrona no backend
  useEffect(() => {
    if (!authToken) {
      return;
    }

    const handlePublicationsSearchCompleted = () => {
      fetchUnreadNotifications();

      const retryFast = setTimeout(() => {
        fetchUnreadNotifications();
      }, 1500);

      const retrySlow = setTimeout(() => {
        fetchUnreadNotifications();
      }, 4000);

      return () => {
        clearTimeout(retryFast);
        clearTimeout(retrySlow);
      };
    };

    let clearRetries = null;

    const onSearchCompleted = () => {
      if (typeof clearRetries === 'function') {
        clearRetries();
      }
      clearRetries = handlePublicationsSearchCompleted();
    };

    window.addEventListener('publicationsSearchCompleted', onSearchCompleted);

    return () => {
      window.removeEventListener('publicationsSearchCompleted', onSearchCompleted);
      if (typeof clearRetries === 'function') {
        clearRetries();
      }
    };
  }, [authToken, fetchUnreadNotifications]);

  useEffect(() => {
    const handleAuthChanged = () => {
      setAuthToken(getAuthToken());
      resetNotificationsState();
    };

    window.addEventListener('auth:changed', handleAuthChanged);
    return () => window.removeEventListener('auth:changed', handleAuthChanged);
  }, [fetchUnreadNotifications, resetNotificationsState]);

  // Fallback: se o localStorage mudar (ou auth mudar fora do fluxo normal), atualizar token
  useEffect(() => {
    const handleStorage = (event) => {
      if (!event || event.key === null || event.key === 'legal_system_auth') {
        setAuthToken(getAuthToken());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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
    deleteNotification,
    deleteMultipleNotifications,
    deleteAllNotifications,
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
