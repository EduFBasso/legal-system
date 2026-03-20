import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { useSettings } from '../contexts/SettingsContext';
import NotificationDetailModal from '../components/NotificationDetailModal';
import { routeNotification } from '../utils/notificationRouting';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    permission,
    fetchAllNotifications,
    markAsRead,
    deleteNotification,
    deleteAllNotifications,
    requestPermission,
    createTestNotification,
  } = useNotifications();
  
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const highlightNotificationId = new URLSearchParams(location.search).get('highlight');

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

  const handleMarkAllAsUnread = async () => {
    const readNotifications = notifications.filter((notification) => notification.read);
    if (readNotifications.length === 0) return;

    const confirmAction = window.confirm('Marcar todas as notificações como não lidas?');
    if (!confirmAction) return;

    try {
      await Promise.all(readNotifications.map((notification) => markAsRead(notification.id)));
    } catch (error) {
      console.error('Erro ao marcar notificações como não lidas:', error);
      alert('Não foi possível marcar todas como não lidas.');
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
    const success = await createTestNotification('default');
    if (success) {
      alert('Notificação de teste criada!');
    }
  };

  const handleCreateTestStale90Days = async () => {
    const success = await createTestNotification('stale_90_days');
    if (success) {
      alert('Notificação de teste 90+ dias criada!');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    const confirmAction = window.confirm('Deseja apagar esta notificação?');
    if (!confirmAction) return;

    const success = await deleteNotification(notificationId);
    if (!success) {
      alert('Não foi possível apagar a notificação.');
    }
  };

  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;

    const confirmAction = window.confirm('Deseja apagar TODAS as notificações? Esta ação não pode ser desfeita.');
    if (!confirmAction) return;

    const result = await deleteAllNotifications();
    if (!result?.success) {
      alert(result?.message || 'Não foi possível apagar todas as notificações.');
    }
  };

  // Função para buscar publicação e abrir modal apropriado
  const handleViewDetails = async (notification) => {
    // Mark as read when viewing details (only if not already read)
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    const routed = routeNotification({ notification, navigate, mode: 'details' });

    // Se veio de um minicard (via ?highlight=) e o usuário clicou no card destacado,
    // remover o highlight da URL para o card voltar ao estilo "lido".
    if (
      notification.type === 'publication'
      && notification.metadata?.id_api
      && String(notification.id) === String(highlightNotificationId)
    ) {
      navigate('/notifications', { replace: true });
    }
    if (routed) {
      return;
    }
    
    // Para outros tipos de notificação, mostrar modal normal
    setSelectedNotification(notification);
  };



  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const readCount = Math.max(0, notifications.length - unreadCount);
  const badgeLabel = unreadCount > 0
    ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}`
    : `${readCount} lida${readCount !== 1 ? 's' : ''}`;

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#dc2626',
      high: '#ea580c',
      medium: '#2563eb',
      low: '#64748b',
    };
    return colors[priority] || colors.medium;
  };

  const getNotificationCardClass = (notification) => {
    // Se for publicação, usar classe publication-card com cores indigo
    if (notification.type === 'publication') {
      return 'publication-card';
    }
    // Se for processo com alerta 90+ dias, usar classe stale-alert-card com cores amber
    if (
      notification.type === 'process' &&
      notification.metadata?.alert_type === 'stale_90_days'
    ) {
      return 'stale-alert-card';
    }
    // Fallback para cartão padrão
    return '';
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
        <div className="header-top-row">
          <div className="header-title-wrap">
            <span className="header-title-icon">🔔</span>
            <h1>Notificações</h1>
          </div>
          <span className={`unread-count ${unreadCount > 0 ? 'badge-unread' : 'badge-read'}`}>
            {badgeLabel}
          </span>
        </div>

        <div className="header-actions">
          {readCount > 0 && (
            <button 
              className="btn-secondary" 
              onClick={handleMarkAllAsUnread}
              disabled={loading}
            >
              ✓ Marcar todas como não lidas
            </button>
          )}

          {notifications.length > 0 && (
            <button
              className="btn-danger"
              onClick={handleDeleteAll}
              disabled={loading}
            >
              🗑 Apagar todas
            </button>
          )}

          {settings?.showNotificationTestButtons && (
            <>
              <button 
                className="btn-primary" 
                onClick={handleCreateTest}
                disabled={loading}
              >
                🧪 Criar Teste
              </button>
              <button
                className="btn-warning"
                onClick={handleCreateTestStale90Days}
                disabled={loading}
                title="Criar notificação de teste de processo sem publicação há mais de 90 dias"
              >
                🧪 Teste 90+ dias
              </button>
            </>
          )}
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

      {/* Banner removido - fluxo intuitivo não precisa de explicação */}

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
            (() => {
              const isHighlighted = String(notification.id) === String(highlightNotificationId);
              const highlightedClass = isHighlighted && notification.type === 'publication'
                ? 'selected pulse-active'
                : (isHighlighted ? 'selected' : '');

              return (
            <div
              key={notification.id}
              id={`notification-${notification.id}`}
              className={`notification-card ${notification.read ? 'read' : 'unread'} ${getNotificationCardClass(notification)} ${highlightedClass}`}
              onClick={() => handleViewDetails(notification)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleViewDetails(notification);
                }
              }}
              role="button"
              tabIndex={0}
              title="Clique para marcar como lida e abrir detalhes"
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

                    <button
                      className="btn-delete-notification"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      onKeyDown={(event) => {
                        event.stopPropagation();
                      }}
                      title="Apagar notificação"
                      aria-label="Apagar notificação"
                    >
                      🗑
                    </button>
                  </div>

              </div>
            </div>
              );
            })()
          ))
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onMarkAsRead={handleMarkAsRead}
        />
      )}
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
