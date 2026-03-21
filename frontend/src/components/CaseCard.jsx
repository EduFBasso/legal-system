import { useNavigate } from 'react-router-dom';
import { openCaseDetailWindow } from '../utils/publicationNavigation';
import PartyRoleBadge from './common/PartyRoleBadge';
import './CaseCard.css';

/**
 * Case Card Component
 * Displays a case summary card
 */
export default function CaseCard({ caseData, onClick, linkedCases = [] }) {
  const navigate = useNavigate();

  const renderRoleBadges = (badges = [], keyPrefix = 'badge') => (
    <div className="role-badges">
      {badges.map((badge) => (
        <PartyRoleBadge
          key={`${keyPrefix}-${badge}`}
          label={badge}
          size="sm"
        />
      ))}
    </div>
  );
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

  const statusClass = caseData?.status ? String(caseData.status).toLowerCase() : '';

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

  const handleOpenClientContact = (e, contactId) => {
    e.stopPropagation();
    if (!contactId) return;
    window.open(`/contacts?open=${contactId}`, '_blank', 'noopener,noreferrer');
  };

  const groupedParties = Array.isArray(caseData.parties_summary)
    ? Object.values(
        caseData.parties_summary.reduce((acc, party) => {
          const partyName = party?.name || 'Parte sem nome';
          if (!acc[partyName]) {
            acc[partyName] = {
              name: partyName,
              badges: [],
              isClient: false,
              contactId: null,
            };
          }

          if (party?.role_display && !acc[partyName].badges.includes(party.role_display)) {
            acc[partyName].badges.push(party.role_display);
          }

          if (party?.is_client && !acc[partyName].badges.includes('Cliente')) {
            acc[partyName].badges.push('Cliente');
            acc[partyName].isClient = true;
            acc[partyName].contactId = caseData?.cliente_principal || null;
          }

          return acc;
        }, {})
      )
    : [];

  return (
    <div className="case-card" onClick={handleCardClick}>
      {/* Header */}
      <div className="case-header">
        <div className="case-badges">
          <span 
            className="info-badge tribunal"
          >
            {caseData.tribunal_display || caseData.tribunal}
          </span>
          <span 
            className={`info-badge status ${statusClass ? `status-${statusClass}` : ''}`}
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
              🔗 Vínculo {linkedCases.length > 1 ? `(${linkedCases.length})` : ''}
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

        {/* Parties */}
        {groupedParties.length > 0 && (
          <div className="case-details case-parties-container">
            {groupedParties.map((party) => (
              <div key={party.name} className="party-line" title={party.name}>
                {party.isClient && party.contactId ? (
                  <button
                    type="button"
                    className="party-name-link"
                    onClick={(e) => handleOpenClientContact(e, party.contactId)}
                    title="Ver detalhes, selecionar ou criar outro processo com vínculo"
                  >
                    <span className="party-name-eye" aria-hidden="true">👁</span>
                    <span className="party-name">{party.name}</span>
                  </button>
                ) : (
                  <span className="party-name">{party.name}</span>
                )}
                {renderRoleBadges(party.badges, party.name)}
              </div>
            ))}
          </div>
        )}

        {linkedCases.length > 0 && (
          <div className="case-linked-group">
            <div className="linked-group-list">
              {linkedCases.map((linkedCase) => (
                <button
                  key={linkedCase.id}
                  className="linked-case-chip"
                  onClick={(e) => handleOpenLinkedCase(e, linkedCase.id)}
                  title={`Abrir processo ${linkedCase.numero_processo_formatted || linkedCase.numero_processo}`}
                >
                  <div className="linked-case-top-line">
                    <span className="linked-case-number">
                      {linkedCase.numero_processo_formatted || linkedCase.numero_processo}
                    </span>
                    {linkedCase.status_display && (
                      <span className="linked-case-status">{linkedCase.status_display}</span>
                    )}
                  </div>
                  {(linkedCase.linked_party_name || (linkedCase.linked_party_badges && linkedCase.linked_party_badges.length > 0)) && (
                    <div className="linked-case-bottom-line">
                      {linkedCase.linked_party_name && (
                        linkedCase.linked_party_contact_id ? (
                          <span
                            className="linked-party-name linked-party-name--clickable"
                            onClick={(e) => handleOpenClientContact(e, linkedCase.linked_party_contact_id)}
                            role="button"
                            tabIndex={0}
                            title="Ver detalhes, selecionar ou criar outro processo com vínculo"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenClientContact(e, linkedCase.linked_party_contact_id);
                              }
                            }}
                          >
                            <span className="party-name-eye" aria-hidden="true">👁</span>
                            {linkedCase.linked_party_name}
                          </span>
                        ) : (
                          <span className="linked-party-name">{linkedCase.linked_party_name}</span>
                        )
                      )}
                      {linkedCase.linked_party_badges && linkedCase.linked_party_badges.length > 0 && (
                        renderRoleBadges(linkedCase.linked_party_badges, `linked-${linkedCase.id}`)
                      )}
                    </div>
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
