import { useEffect, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    permission,
    fetchAllNotifications,
    markAsRead,
    markAllAsRead,
    requestPermission,
    createTestNotification,
  } = useNotifications();
  
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  useEffect(() => {
    fetchAllNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualizar prompt baseado na permissão (sem useEffect para evitar cascading)
  const shouldShowPrompt = permission === 'denied' || permission === 'default';
  
  useEffect(() => {
    setShowPermissionPrompt(shouldShowPrompt);
  }, [shouldShowPrompt]);

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    const confirmAction = window.confirm('Marcar todas as notificações como lidas?');
    if (confirmAction) {
      await markAllAsRead();
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      alert('Permissão concedida! Você receberá notificações do sistema.');
    } else {
      alert('Permissão negada. Você pode ativá-la nas configurações do navegador.');
    }
  };

  const handleCreateTest = async () => {
    const success = await createTestNotification();
    if (success) {
      alert('Notificação de teste criada!');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#dc2626',
      high: '#ea580c',
      medium: '#2563eb',
      low: '#64748b',
    };
    return colors[priority] || colors.medium;
  };

  const getTypeIcon = (type) => {
    const icons = {
      publication: '📰',
      deadline: '⏰',
      process: '⚖️',
      system: '💻',
    };
    return icons[type] || '🔔';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="notifications-page">
        <div className="page-header">
          <h1>🔔 Notificações</h1>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando notificações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div>
          <h1>🔔 Notificações</h1>
          {unreadCount > 0 && (
            <span className="unread-count">{unreadCount} não lida{unreadCount !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="header-actions">
          {unreadCount > 0 && (
            <button 
              className="btn-secondary" 
              onClick={handleMarkAllAsRead}
              disabled={loading}
            >
              ✓ Marcar todas como lidas
            </button>
          )}
          <button 
            className="btn-primary" 
            onClick={handleCreateTest}
            disabled={loading}
          >
            🧪 Criar Teste
          </button>
        </div>
      </div>

      {/* Prompt de permissão Web Notifications */}
      {showPermissionPrompt && (
        <div className="permission-prompt">
          <div className="prompt-content">
            <span className="prompt-icon">🔔</span>
            <div className="prompt-text">
              <strong>Ative as notificações do navegador</strong>
              <p>Receba alertas mesmo quando o sistema estiver em segundo plano</p>
            </div>
            <button 
              className="btn-primary btn-sm" 
              onClick={handleRequestPermission}
            >
              {permission === 'denied' ? 'Ativar nas Configurações' : 'Ativar Notificações'}
            </button>
            <button 
              className="btn-ghost btn-sm" 
              onClick={() => setShowPermissionPrompt(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="notifications-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todas ({notifications.length})
        </button>
        <button
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Não lidas ({unreadCount})
        </button>
        <button
          className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
          onClick={() => setFilter('read')}
        >
          Lidas ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Lista de notificações */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔕</span>
            <h3>Nenhuma notificação</h3>
            <p>
              {filter === 'unread' && 'Você não tem notificações não lidas'}
              {filter === 'read' && 'Você não tem notificações lidas'}
              {filter === 'all' && 'Você ainda não recebeu notificações'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-card ${notification.read ? 'read' : 'unread'}`}
              style={{ borderLeftColor: getPriorityColor(notification.priority) }}
            >
              <div className="notification-icon">
                {getTypeIcon(notification.type)}
              </div>
              
              <div className="notification-content">
                <div className="notification-header">
                  <h3 className="notification-title">{notification.title}</h3>
                  <span className="notification-time">{formatDate(notification.created_at)}</span>
                </div>
                
                <p className="notification-message">{notification.message}</p>
                
                <div className="notification-footer">
                  <span className="notification-type">{notification.type_display}</span>
                  <span 
                    className="notification-priority"
                    style={{ color: getPriorityColor(notification.priority) }}
                  >
                    {notification.priority_display}
                  </span>
                  
                  {!notification.read && (
                    <button
                      className="btn-mark-read"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      ✓ Marcar como lida
                    </button>
                  )}
                  
                  {notification.link && (
                    <a 
                      href={notification.link} 
                      className="notification-link"
                      target={notification.link.startsWith('http') ? '_blank' : '_self'}
                      rel={notification.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                      onClick={() => {
                        if (!notification.read) {
                          handleMarkAsRead(notification.id);
                        }
                      }}
                    >
                      {notification.link.startsWith('http') ? '� Consultar Processo' : 'Ver detalhes →'}
                    </a>
                  )}
                </div>
              </div>
              
              {!notification.read && <div className="unread-indicator"></div>}
            </div>
          ))
        )}
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
