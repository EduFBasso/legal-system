import { Check } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import './PrazoRow.css';

/**
 * PrazoRow - Individual deadline row with checkbox + date + description + status badge
 * Shows a single prazo (deadline) within a movement
 */
function PrazoRow({ 
  prazo, 
  onToggleCompleted = () => {},
}) {
  const getStatusInfo = () => {
    if (prazo.completed) {
      return { label: 'CONCLUÍDO', color: '#e0e7ff', textColor: '#3730a3' };
    }
    
    const dias = prazo.dias_restantes;
    if (dias < 0) {
      return { label: 'VENCIDO', color: '#f3f4f6', textColor: '#6b7280', strikethrough: true };
    }
    
    switch (prazo.status_urgencia) {
      case 'URGENTISSIMO':
        return { label: 'URGENTÍSSIMO', color: '#fecaca', textColor: '#991b1b', days: dias };
      case 'URGENTE':
        return { label: 'URGENTE', color: '#fed7aa', textColor: '#92400e', days: dias };
      case 'NORMAL':
        return { label: 'NORMAL', color: '#d1fae5', textColor: '#065f46', days: dias };
      default:
        return { label: 'SEM STATUS', color: '#f3f4f6', textColor: '#6b7280' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`prazo-row ${prazo.completed ? 'completed' : ''}`}>
      <div className="prazo-checkbox-wrapper">
        <input
          type="checkbox"
          checked={prazo.completed || false}
          onChange={() => onToggleCompleted(prazo)}
          className="prazo-checkbox"
          title={prazo.completed ? 'Marcar como não resolvido' : 'Marcar como resolvido'}
        />
        {prazo.completed && <Check size={16} className="check-icon" />}
      </div>

      <div className="prazo-date">
        {formatDate(prazo.data_limite)}
      </div>

      <div className="prazo-description">
        {prazo.descricao}
      </div>

      <div 
        className="prazo-status-badge"
        style={{ 
          backgroundColor: statusInfo.color,
          color: statusInfo.textColor,
        }}
      >
        <span className="status-label">{statusInfo.label}</span>
        {statusInfo.days !== undefined && (
          <span className="status-days">
            ({statusInfo.days} {statusInfo.days === 1 ? 'dia' : 'dias'})
          </span>
        )}
      </div>
    </div>
  );
}

export default PrazoRow;
