import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { useHighlight } from '../hooks/useHighlight';
import './NotificationsSummary.css';

/**
 * Componente para exibir resumo de notificações na sidebar
 * Mostra mini-cartões com notificações recentes não lidas
 */
export default function NotificationsSummary() {
  const navigate = useNavigate();
  const { notifications, fetchUnreadNotifications, markAsRead } = useNotifications();
  const [staleNotifications, setStaleNotifications] = useState([]);
  
  // Sistema de destaque unificado - usando hook customizado
  const highlight = useHighlight({ 
    className: 'pulse-active-mini',
    initialState: false  // Começa desativado
  });

  // Atualizar notificações periodicamente
  useEffect(() => {
    fetchUnreadNotifications();
  }, [fetchUnreadNotifications]);

  // Buscar apenas notificacoes de processo 90+ dias (bloco dourado condicional)
  useEffect(() => {
    const stale = notifications
      .filter((notification) =>
        !notification.read &&
        notification.type === 'process' &&
        notification.metadata?.alert_type === 'stale_90_days'
      )
      .slice(0, 3)
      .map((notification) => ({
        key: `notification-${notification.id}`,
        number: notification.metadata?.case_number || 'TESTE-90D-0001',
        days: notification.metadata?.days_without_activity || 90,
        link: notification.link || '/cases',
        notificationId: notification.id,
      }));

    setStaleNotifications(stale);
  }, [notifications]);

  // Pegar apenas as 3 publicacoes nao lidas mais recentes
  const recentUnread = notifications
    .filter(n => !n.read && n.type === 'publication')
    .slice(0, 3);

  const publicationUnreadCount = notifications.filter(
    (notification) => !notification.read && notification.type === 'publication'
  ).length;

  const handleViewAll = () => {
    navigate('/notifications');
  };

  const handleNotificationClick = async (notificationId) => {
    // Marcar como lida
    await markAsRead(notificationId);
    // Navegar para a página de notificações
    navigate('/notifications');
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

  const getPriorityClass = (priority) => {
    return priority === 'urgent' || priority === 'high' ? 'high-priority' : '';
  };

  const staleAlertItems = staleNotifications;

  const handleStaleAlertClick = async (item) => {
    if (item.notificationId) {
      await markAsRead(item.notificationId);
    }
    navigate(item.link || '/cases');
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const formatSidebarPublicationTitle = (notification) => {
    if (notification.type !== 'publication') {
      return notification.title;
    }

    const processNumber = notification.metadata?.numero_processo;

    if (!processNumber) {
      return notification.title;
    }

    return `Proc. ${processNumber}`;
  };

  // Contar total de notificações não lidas (publicações + alertas 90+)
  const totalUnreadCount = publicationUnreadCount + staleAlertItems.length;
  const hasNotifications = recentUnread.length > 0 || staleAlertItems.length > 0;

  return (
    <div className="notifications-summary">
      {/* Header com contador */}
      <div className="notifications-header" onClick={handleViewAll}>
        <div className="notification-count-badge">
          {totalUnreadCount > 0 ? (
            <>
              <span className="count-number">{totalUnreadCount}</span>
              <span className="count-label">não {totalUnreadCount === 1 ? 'lida' : 'lidas'}</span>
            </>
          ) : (
            <span className="count-label">Tudo em dia</span>
          )}
        </div>
        <span className="view-all-link">Ver todas →</span>
      </div>

      {/* Mini-cartões unificados de notificações e alertas */}
      {hasNotifications ? (
        <div className="notifications-cards-container">
          {/* Cartões de publicações */}
          {recentUnread.map((notification) => (
            <div
              key={notification.id}
              className={`notification-card publication-card ${highlight.className}`}
              onClick={() => handleNotificationClick(notification.id)}
            >
              <div className="card-header">
                <span className="card-type">Publicação</span>
              </div>
              <div className="card-content">
                <div className="card-title">{formatSidebarPublicationTitle(notification)}</div>
                <div className="card-meta">
                  {notification.metadata?.tribunal && (
                    <span className="card-tribunal">{abbreviateCourt(notification.metadata.tribunal)}</span>
                  )}
                  <span className="card-time">{formatTimeAgo(notification.created_at)}</span>
                </div>
              </div>
            </div>
          ))}

          {publicationUnreadCount > 3 && (
            <div className="more-notifications" onClick={handleViewAll}>
              +{publicationUnreadCount - 3} publicações
            </div>
          )}

          {/* Cartões de alertas 90+ dias */}
          {staleAlertItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className="notification-card stale-alert-card"
              onClick={() => handleStaleAlertClick(item)}
              title="Abrir processo"
            >
              <div className="card-header">
                <span className="card-type alert-type">Alerta</span>
              </div>
              <div className="card-content">
                <div className="alert-status">Processo inativo há mais de 90 dias</div>
                <div className="card-title">{item.number}</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="no-notifications">
          <span className="no-notifications-icon">✅</span>
          <p>Tudo em dia!</p>
        </div>
      )}
    </div>
  );
}

/**
 * Abreviar nome do tribunal/source para exibição
 */
function abbreviateCourt(court) {
  if (!court) return '';
  // Se for uma URL ou algo com /, pega o último segmento
  if (court.includes('/')) {
    court = court.split('/').pop();
  }
  // Remove "tribunal" se houver
  court = court.replace(/tribunal|court/gi, '').trim();
  // Limita a 10 caracteres
  return court.substring(0, 10) + (court.length > 10 ? '...' : '');
}
