import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import './NotificationsSummary.css';

/**
 * Componente para exibir resumo de notificações na sidebar
 * Mostra mini-cartões com notificações recentes não lidas
 */
export default function NotificationsSummary() {
  const navigate = useNavigate();
  const { notifications, unreadCount, fetchUnreadNotifications } = useNotifications();

  // Atualizar notificações periodicamente
  useEffect(() => {
    fetchUnreadNotifications();
  }, [fetchUnreadNotifications]);

  // Pegar apenas as 3 notificações não lidas mais recentes
  const recentUnread = notifications
    .filter(n => !n.read)
    .slice(0, 3);

  const handleViewAll = () => {
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

  return (
    <div className="notifications-summary">
      {/* Header com contador */}
      <div className="notifications-header" onClick={handleViewAll}>
        <div className="notification-count-badge">
          {unreadCount > 0 ? (
            <>
              <span className="count-number">{unreadCount}</span>
              <span className="count-label">não {unreadCount === 1 ? 'lida' : 'lidas'}</span>
            </>
          ) : (
            <span className="count-label">Nenhuma nova</span>
          )}
        </div>
        <span className="view-all-link">Ver todas →</span>
      </div>

      {/* Mini-cartões de notificações */}
      {recentUnread.length > 0 ? (
        <div className="notifications-mini-cards">
          {recentUnread.map((notification) => (
            <div
              key={notification.id}
              className={`notification-mini-card ${getPriorityClass(notification.priority)}`}
              onClick={handleViewAll}
            >
              <div className="mini-card-icon">
                {getTypeIcon(notification.type)}
              </div>
              <div className="mini-card-content">
                <div className="mini-card-title">{notification.title}</div>
                <div className="mini-card-time">{formatTimeAgo(notification.created_at)}</div>
              </div>
            </div>
          ))}
          
          {unreadCount > 3 && (
            <div className="more-notifications">
              +{unreadCount - 3} mais
            </div>
          )}
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
