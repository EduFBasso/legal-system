import { useEffect } from 'react';
import './NotificationDetailModal.css';

export default function NotificationDetailModal({ notification, onClose, onMarkAsRead }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#64748b',
    };
    return colors[priority] || '#64748b';
  };

  const handleMarkAsReadClick = async () => {
    if (!notification.read && onMarkAsRead) {
      await onMarkAsRead(notification.id);
    }
  };

  const handleExternalLink = () => {
    if (notification.link && notification.link.startsWith('http')) {
      window.open(notification.link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content notification-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="notification-type-icon">{getTypeIcon(notification.type)}</div>
            <div className="modal-title-section">
              <h2 className="modal-title">{notification.title}</h2>
              <div className="notification-badges">
                <span className="type-badge">{notification.type_display}</span>
                <span 
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(notification.priority) }}
                >
                  {notification.priority_display}
                </span>
                {!notification.read && (
                  <span className="unread-badge">Não lida</span>
                )}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="notification-detail-section">
            <h3 className="section-title">Mensagem</h3>
            <p className="notification-message-full">{notification.message}</p>
          </div>

          <div className="notification-info-grid">
            <div className="info-item">
              <span className="info-label">Criada em:</span>
              <span className="info-value">{formatDate(notification.created_at)}</span>
            </div>
            
            {notification.read && notification.read_at && (
              <div className="info-item">
                <span className="info-label">Lida em:</span>
                <span className="info-value">{formatDate(notification.read_at)}</span>
              </div>
            )}
          </div>

          {notification.metadata && (
            <div className="notification-detail-section">
              <h3 className="section-title">Informações Adicionais</h3>
              <pre className="metadata-content">{JSON.stringify(notification.metadata, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Fechar
          </button>
          
          {!notification.read && onMarkAsRead && (
            <button className="btn-primary" onClick={handleMarkAsReadClick}>
              ✓ Marcar como Lida
            </button>
          )}

          {notification.link && notification.link.startsWith('http') && (
            <button className="btn-primary" onClick={handleExternalLink}>
              🔗 Abrir Link Externo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
