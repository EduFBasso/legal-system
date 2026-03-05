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

  return (
    <div className="notifications-summary">
      {/* Título do container */}
      <div className="notifications-container-title">
        📰 Publicações Recentes
      </div>

      {/* Header com contador */}
      <div className="notifications-header" onClick={handleViewAll}>
        <div className="notification-count-badge">
          {publicationUnreadCount > 0 ? (
            <>
              <span className="count-number">{publicationUnreadCount}</span>
              <span className="count-label">não {publicationUnreadCount === 1 ? 'lida' : 'lidas'}</span>
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
              className={`notification-mini-card ${getPriorityClass(notification.priority)} ${highlight.className}`}
              onClick={() => handleNotificationClick(notification.id)}
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
          
          {publicationUnreadCount > 3 && (
            <div className="more-notifications" onClick={handleViewAll}>
              +{publicationUnreadCount - 3} mais
            </div>
          )}
        </div>
      ) : (
        <div className="no-notifications">
          <span className="no-notifications-icon">✅</span>
          <p>Tudo em dia!</p>
        </div>
      )}

      {/* Container condicional: somente aparece se existir processo sem publicacao/movimentacao ha 90+ dias */}
      {staleAlertItems.length > 0 && (
        <div className="stale-cases-summary">
          <div className="stale-cases-title">🟨 Alerta 90+ dias sem publicação</div>
          <div className="stale-cases-list">
            {staleAlertItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className="stale-case-item"
                onClick={() => handleStaleAlertClick(item)}
                title="Abrir processo"
              >
                <div className="stale-case-number">{item.number}</div>
                <div className="stale-case-days">{item.days} dias</div>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="stale-cases-view-all"
            onClick={() => navigate('/cases')}
          >
            Ver todos os inativos →
          </button>
        </div>
      )}
    </div>
  );
}
