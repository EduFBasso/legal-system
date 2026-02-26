import { Calendar, RefreshCw } from 'lucide-react';
import * as deadlinesService from '../../services/deadlinesService';
import EmptyState from '../common/EmptyState';

/**
 * DeadlinesTab - Aba de Prazos Processuais
 * Exibe prazos com filtros: todos, vencidos, próximos, futuros
 */
function DeadlinesTab({ 
  id,
  deadlines = [],
  deadlineFilter = 'all',
  setDeadlineFilter = () => {},
  loadingDeadlines = false,
  loadDeadlines = () => {},
  setActiveSection = () => {},
  formatDate = (date) => new Date(date).toLocaleDateString('pt-BR'),
}) {
  const getFilteredDeadlines = () => {
    return deadlines.filter(deadline => {
      if (deadlineFilter === 'all') return true;
      const status = deadlinesService.getDeadlineStatus(deadline.data_limite_prazo);
      if (deadlineFilter === 'overdue') return status === 'overdue';
      if (deadlineFilter === 'upcoming') return status === 'urgent' || status === 'upcoming';
      if (deadlineFilter === 'future') return status === 'future';
      return true;
    });
  };

  const getFilterCount = (filter) => {
    switch(filter) {
      case 'overdue':
        return deadlines.filter(d => deadlinesService.getDeadlineStatus(d.data_limite_prazo) === 'overdue').length;
      case 'upcoming':
        return deadlines.filter(d => {
          const status = deadlinesService.getDeadlineStatus(d.data_limite_prazo);
          return status === 'urgent' || status === 'upcoming';
        }).length;
      case 'future':
        return deadlines.filter(d => deadlinesService.getDeadlineStatus(d.data_limite_prazo) === 'future').length;
      default:
        return deadlines.length;
    }
  };

  return (
    <div className="case-section">
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">⏰ Prazos Processuais</h2>
            <p className="section-subtitle">Gestão de prazos e vencimentos</p>
          </div>
          <div className="deadlines-filters">
            <button
              className={`filter-btn ${deadlineFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDeadlineFilter('all')}
            >
              Todos ({getFilterCount('all')})
            </button>
            <button
              className={`filter-btn ${deadlineFilter === 'overdue' ? 'active' : ''}`}
              onClick={() => setDeadlineFilter('overdue')}
            >
              Vencidos ({getFilterCount('overdue')})
            </button>
            <button
              className={`filter-btn ${deadlineFilter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setDeadlineFilter('upcoming')}
            >
              Próximos ({getFilterCount('upcoming')})
            </button>
            <button
              className={`filter-btn ${deadlineFilter === 'future' ? 'active' : ''}`}
              onClick={() => setDeadlineFilter('future')}
            >
              Futuros ({getFilterCount('future')})
            </button>
          </div>
        </div>

        {loadingDeadlines ? (
          <div className="loading-container">
            <RefreshCw className="spinning" size={32} />
            <p>Carregando prazos...</p>
          </div>
        ) : deadlines.length === 0 ? (
          <EmptyState
            icon={Calendar}
            message="Nenhum prazo cadastrado"
            hint="Adicione prazos nas movimentações para acompanhar vencimentos."
            action={
              <button 
                className="btn btn-primary"
                onClick={() => setActiveSection('movimentacoes')}
              >
                Ir para Movimentações
              </button>
            }
          />
        ) : (
          <div className="deadlines-list">
            {getFilteredDeadlines().map(deadline => {
              const status = deadlinesService.getDeadlineStatus(deadline.data_limite_prazo);
              const statusInfo = deadlinesService.getDeadlineStatusInfo(status);
              
              return (
                <div key={deadline.id} className="deadline-card" style={{ borderLeftColor: statusInfo.color }}>
                  <div className="deadline-header">
                    <span className="deadline-status" style={{ color: statusInfo.color }}>
                      {statusInfo.label}
                    </span>
                    <span className="deadline-date">
                      {formatDate(deadline.data_limite_prazo)}
                    </span>
                  </div>
                  <div className="deadline-content">
                    <div className="deadline-type">{deadline.tipo_display || deadline.tipo}</div>
                    <h4 className="deadline-title">{deadline.titulo}</h4>
                    {deadline.descricao && (
                      <p className="deadline-description">{deadline.descricao}</p>
                    )}
                    <div className="deadline-meta">
                      <span>📅 Movimentação: {formatDate(deadline.data)}</span>
                      <span>⏱️ Prazo: {deadline.prazo} dias</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default DeadlinesTab;
