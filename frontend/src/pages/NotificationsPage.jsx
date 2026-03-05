import { useEffect, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationDetailModal from '../components/NotificationDetailModal';
import PublicationDetailModal from '../components/PublicationDetailModal';
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
    deleteNotification,
    deleteAllNotifications,
    requestPermission,
    createTestNotification,
  } = useNotifications();
  
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [sourceNotification, setSourceNotification] = useState(null); // Track which notification opened this publication
  const [loadingPublication, setLoadingPublication] = useState(false);

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
    // Mark as read when viewing details
    await markAsRead(notification.id);
    
    // Se for notificação de publicação, buscar dados da publicação
    if (notification.type === 'publication' && notification.metadata?.id_api) {
      setLoadingPublication(true);
      try {
        const response = await fetch(
          `http://localhost:8000/api/publications/${notification.metadata.id_api}`
        );
        const data = await response.json();
        
        if (data.success && data.publication) {
          setSourceNotification(notification); // Store source notification
          setSelectedPublication(data.publication);
        } else {
          // Se não encontrar publicação, mostrar modal de notificação normal
          setSelectedNotification(notification);
        }
      } catch (error) {
        console.error('Erro ao buscar publicação:', error);
        // Em caso de erro, mostrar modal de notificação normal
        setSelectedNotification(notification);
      } finally {
        setLoadingPublication(false);
      }
    } else {
      // Para outros tipos de notificação, mostrar modal normal
      setSelectedNotification(notification);
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
          {notifications.length > 0 && (
            <button
              className="btn-danger"
              onClick={handleDeleteAll}
              disabled={loading}
            >
              🗑 Apagar todas
            </button>
          )}
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
          <button
            className="btn-warning"
            onClick={handleCreateTestStale90Days}
            disabled={loading}
            title="Criar notificação de teste de processo sem publicação há mais de 90 dias"
          >
            🧪 Teste 90+ dias
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
                    
                    <button
                      className="notification-link"
                      onClick={() => handleViewDetails(notification)}
                      disabled={loadingPublication}
                    >
                      {loadingPublication ? 'Carregando...' : 'Ver detalhes →'}
                    </button>

                    {notification.link && notification.link.startsWith('http') && (
                      <a 
                        href={notification.link} 
                        className="notification-link"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (!notification.read) {
                            handleMarkAsRead(notification.id);
                          }
                        }}
                      >
                        🔗 Consultar Processo
                      </a>
                    )}

                    <button
                      className="btn-delete-notification"
                      onClick={() => handleDeleteNotification(notification.id)}
                      title="Apagar notificação"
                    >
                      🗑 Apagar
                    </button>
                  </div>

              </div>
            </div>
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

      {/* Modal de Publicação */}
      {selectedPublication && (
        <PublicationDetailModal
          publication={selectedPublication}
          onClose={() => {
            setSelectedPublication(null);
            setSourceNotification(null);
          }}
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
