import { useNavigate } from 'react-router-dom';
import { openCaseDetailWindow } from '../utils/publicationNavigation';
import './CaseCard.css';

/**
 * Case Card Component
 * Displays a case summary card
 */
export default function CaseCard({ caseData, onClick, linkedCases = [] }) {
  const navigate = useNavigate();
  /**
   * Handle card click - open in new tab
   */
  const handleCardClick = (e) => {
    // Previne a abertura se clicou no botão de copiar
    if (e.target.closest('.btn-copy-processo')) {
      return;
    }

    if (typeof onClick === 'function') {
      onClick(caseData);
      return;
    }
    
    // Abre em nova aba
    openCaseDetailWindow(caseData.id);
  };

  /**
   * Get tribunal badge color
   */
  const getTribunalColor = (tribunal) => {
    const colors = {
      'TJSP': '#1976d2',
      'STF': '#c62828',
      'STJ': '#6a1b9a',
      'TRF1': '#00796b',
      'TRF2': '#00796b',
      'TRF3': '#00796b',
      'TRF4': '#00796b',
      'TRF5': '#00796b',
      'TST': '#f57c00',
    };
    return colors[tribunal] || '#757575';
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status) => {
    const colors = {
      'ATIVO': '#4caf50',
      'INATIVO': '#9e9e9e',
      'SUSPENSO': '#ff9800',
      'ARQUIVADO': '#757575',
      'ENCERRADO': '#2196f3',
    };
    return colors[status] || '#757575';
  };

  /**
   * Format date to Brazilian format
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  /**
   * Get urgency badge
   */
  const getUrgencyBadge = () => {
    if (caseData.dias_sem_movimentacao === null) return null;

    if (caseData.dias_sem_movimentacao > 90) {
      return (
        <span className="badge badge-inactive">
          {caseData.dias_sem_movimentacao}d sem movimento
        </span>
      );
    }
    
    if (caseData.dias_sem_movimentacao > 60) {
      return (
        <span className="badge badge-warning">
          {caseData.dias_sem_movimentacao}d sem movimento
        </span>
      );
    }
    
    return null;
  };

  /**
   * Navigate to deadlines page when tasks badge is clicked
   */
  const handleTasksBadgeClick = (e) => {
    e.stopPropagation();
    navigate('/deadlines');
  };

  /**
   * Copy process number to clipboard
   */
  const handleCopyProcesso = (e) => {
    e.stopPropagation();
    if (caseData.numero_processo) {
      navigator.clipboard.writeText(caseData.numero_processo).then(() => {
        const btn = e.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copiado!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.classList.remove('copied');
        }, 2000);
      });
    }
  };

  const handleOpenLinkedCase = (e, linkedCaseId) => {
    e.stopPropagation();
    openCaseDetailWindow(linkedCaseId);
  };

  return (
    <div className="case-card" onClick={handleCardClick}>
      {/* Header */}
      <div className="case-header">
        <div className="case-badges">
          <span 
            className="badge badge-tribunal"
            style={{ backgroundColor: getTribunalColor(caseData.tribunal) }}
          >
            {caseData.tribunal_display || caseData.tribunal}
          </span>
          <span 
            className="badge badge-status"
            style={{ backgroundColor: getStatusColor(caseData.status) }}
          >
            {caseData.status_display || caseData.status}
          </span>
          {caseData.dias_sem_movimentacao !== null && caseData.dias_sem_movimentacao > 90 && (
            <span className="badge badge-auto-status-inactive">
              Inativo &gt;90d
            </span>
          )}
          {getUrgencyBadge()}
          {linkedCases.length > 0 && (
            <span className="badge badge-linked-cases">
              Vinculado a {linkedCases.length} {linkedCases.length === 1 ? 'processo' : 'processos'}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="case-body">
        {/* Process Number */}
        {caseData.numero_processo && (
          <div className="case-processo">
            <span className="processo-number">
              {caseData.numero_processo_formatted || caseData.numero_processo}
            </span>
            <button
              className="btn-copy"
              onClick={handleCopyProcesso}
              title="Copiar número do processo"
            >
              📋
            </button>
          </div>
        )}

        {/* Title */}
        <h3 className="case-title">{caseData.titulo || 'Sem título'}</h3>

        {/* Location */}
        <div className="case-location">
          {caseData.comarca && (
            <span className="location-item">
              📍 {caseData.comarca}
            </span>
          )}
          {caseData.vara && (
            <span className="location-item">
              🏛️ {caseData.vara}
            </span>
          )}
        </div>

        {/* Details Grid */}
        <div className="case-details">
          <div className="detail-item">
            <span className="detail-label">Distribuição:</span>
            <span className="detail-value">{formatDate(caseData.data_distribuicao)}</span>
          </div>
          {caseData.data_ultima_movimentacao && (
            <div className="detail-item">
              <span className="detail-label">Última Mov.:</span>
              <span className="detail-value">{formatDate(caseData.data_ultima_movimentacao)}</span>
            </div>
          )}
        </div>

        {linkedCases.length > 0 && (
          <div className="case-linked-group">
            <span className="linked-group-label">Processos vinculados (mesmo cliente)</span>
            <div className="linked-group-list">
              {linkedCases.map((linkedCase) => (
                <button
                  key={linkedCase.id}
                  className="linked-case-chip"
                  onClick={(e) => handleOpenLinkedCase(e, linkedCase.id)}
                  title={`Abrir processo ${linkedCase.numero_processo_formatted || linkedCase.numero_processo}`}
                >
                  <span className="linked-case-number">
                    {linkedCase.numero_processo_formatted || linkedCase.numero_processo}
                  </span>
                  {linkedCase.status_display && (
                    <span className="linked-case-status">{linkedCase.status_display}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {caseData.tags && caseData.tags.length > 0 && (
          <div className="case-tags">
            {caseData.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
            {caseData.tags.length > 3 && (
              <span className="tag tag-more">
                +{caseData.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Parties */}
        {caseData.parties_summary && caseData.parties_summary.length > 0 && (
          <div className="case-parties">
            <span className="parties-label">Partes:</span>
            <div className="parties-list">
              {caseData.parties_summary.slice(0, 3).map((party, i) => (
                <span
                  key={i}
                  className={`party-chip${party.is_client ? ' party-chip--client' : ''}`}
                  title={`${party.name} · ${party.role_display}`}
                >
                  {party.name} - ({party.is_client ? 'Cliente' : party.role_display})
                </span>
              ))}
              {caseData.parties_summary.length > 3 && (
                <span className="party-chip party-chip--more">
                  +{caseData.parties_summary.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="case-footer">
        <span className="footer-text">
          Atualizado em {formatDate(caseData.updated_at?.split('T')[0])}
        </span>
        {caseData.active_tasks_count > 0 && (
          <button
            className="tasks-badge"
            onClick={handleTasksBadgeClick}
            title={`${caseData.active_tasks_count} ${caseData.active_tasks_count === 1 ? 'tarefa pendente' : 'tarefas pendentes'} neste processo`}
          >
            ⏰ {caseData.active_tasks_count} {caseData.active_tasks_count === 1 ? 'tarefa' : 'tarefas'}
          </button>
        )}
      </div>
    </div>
  );
}
