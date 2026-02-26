import { Users, UserPlus, Trash2 } from 'lucide-react';
import EmptyState from '../common/EmptyState';

/**
 * PartiesTab - Aba de Partes do Processo
 * Exibe lista de partes vinculadas ao case
 */
function PartiesTab({
  id,
  parties = [],
  loadingParties = false,
  onAddPartyClick = () => {},
  onRemoveParty = () => {},
}) {
  return (
    <div className="case-section">
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">👥 Partes do Processo</h2>
          <button 
            className="btn btn-success"
            onClick={onAddPartyClick}
          >
            <UserPlus size={18} />
            Adicionar Parte
          </button>
        </div>

        {loadingParties ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando partes...</p>
          </div>
        ) : parties.length === 0 ? (
          <EmptyState
            icon={Users}
            message="Nenhuma parte cadastrada"
            hint="Clique em 'Adicionar Parte' para vincular pessoas a este processo"
          />
        ) : (
          <div className="parties-list">
            {parties.map(party => (
              <div key={party.id} className="party-card">
                <div className="party-info">
                  <div className="party-header">
                    <span className="party-icon">
                      {party.contact_person_type === 'PF' ? '👤' : '🏢'}
                    </span>
                    <div className="party-details">
                      <h3 className="party-name">{party.contact_name}</h3>
                      <span className={`party-role-badge role-${party.role.toLowerCase()}`}>
                        {party.role_display}
                      </span>
                      {party.is_client && (
                        <span className="client-badge">✅ Cliente</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="party-contact-info">
                    {party.contact_document && (
                      <span className="party-detail">
                        📄 {party.contact_document}
                      </span>
                    )}
                    {party.contact_phone && (
                      <span className="party-detail">
                        📱 {party.contact_phone}
                      </span>
                    )}
                    {party.contact_email && (
                      <span className="party-detail">
                        ✉️ {party.contact_email}
                      </span>
                    )}
                  </div>

                  {party.observacoes && (
                    <div className="party-notes">
                      <strong>Observações:</strong> {party.observacoes}
                    </div>
                  )}
                </div>

                <button 
                  className="btn-remove-party"
                  onClick={() => onRemoveParty(party.id, party.contact_name)}
                  title="Remover do processo"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PartiesTab;
