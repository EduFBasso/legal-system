import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { useHighlight } from '../hooks/useHighlight';
import casesService from '../services/casesService';
import './NotificationsSummary.css';

/**
 * Componente para exibir resumo de notificações na sidebar
 * Mostra mini-cartões com notificações recentes não lidas
 */
export default function NotificationsSummary() {
  const navigate = useNavigate();
  const { notifications, unreadCount, fetchUnreadNotifications, markAsRead } = useNotifications();
  const [staleCases, setStaleCases] = useState([]);
  
  // Sistema de destaque unificado - usando hook customizado
  const highlight = useHighlight({ 
    className: 'pulse-active-mini',
    initialState: false  // Começa desativado
  });

  // Atualizar notificações periodicamente
  useEffect(() => {
    fetchUnreadNotifications();
  }, [fetchUnreadNotifications]);

  // Buscar processos sem movimentacao/publicacao ha 90+ dias
  useEffect(() => {
    let isMounted = true;

    const fetchStaleCases = async () => {
      try {
        const response = await casesService.getAll({
          status: 'INATIVO',
          ordering: '-data_ultima_movimentacao'
        });

        const caseList = Array.isArray(response) ? response : (response.results || []);
        const stale = caseList
          .filter((caseItem) => (caseItem.dias_sem_movimentacao || 0) >= 90)
          .slice(0, 3);

        if (isMounted) {
          setStaleCases(stale);
        }
      } catch (error) {
        console.error('Erro ao buscar processos inativos:', error);
        if (isMounted) {
          setStaleCases([]);
        }
      }
    };

    fetchStaleCases();

    return () => {
      isMounted = false;
    };
  }, []);

  // Pegar apenas as 3 notificações não lidas mais recentes
  const recentUnread = notifications
    .filter(n => !n.read)
    .slice(0, 3);

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

  const getCaseNumber = (caseItem) => {
    return caseItem.numero_processo_formatted || caseItem.numero_processo || `Processo #${caseItem.id}`;
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
          
          {unreadCount > 3 && (
            <div className="more-notifications" onClick={handleViewAll}>
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

      {/* Container condicional: somente aparece se existir processo sem publicacao/movimentacao ha 90+ dias */}
      {staleCases.length > 0 && (
        <div className="stale-cases-summary">
          <div className="stale-cases-title">🟨 Alerta 90+ dias sem publicação</div>
          <div className="stale-cases-list">
            {staleCases.map((caseItem) => (
              <button
                key={caseItem.id}
                type="button"
                className="stale-case-item"
                onClick={() => navigate(`/cases/${caseItem.id}`)}
                title="Abrir processo"
              >
                <div className="stale-case-number">{getCaseNumber(caseItem)}</div>
                <div className="stale-case-days">{caseItem.dias_sem_movimentacao || 90} dias</div>
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
