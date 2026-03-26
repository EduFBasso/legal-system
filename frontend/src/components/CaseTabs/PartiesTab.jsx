import { useState } from 'react';
import { Users, UserPlus, Trash2, Edit2 } from 'lucide-react';
import { formatCPF, formatCNPJ, formatPhone } from '../../utils/formatters';
import EmptyState from '../common/EmptyState';
import PartyRoleBadge from '../common/PartyRoleBadge';
import { Button } from '../common/Button';

import './PartiesTab.css';

/**
 * PartiesTab - Aba de Partes do Processo
 * Exibe lista de partes vinculadas ao case com formatação de documentos
 */
function PartiesTab({
  parties = [],
  loadingParties = false,
  caseData = null,
  onAddPartyClick = () => {},
  onRemoveParty = () => {},
  onEditParty = () => {},
  readOnly = false,
}) {
  const [selectedPartyId, setSelectedPartyId] = useState(null);

  const representations = Array.isArray(caseData?.representations) ? caseData.representations : [];

  // Helper to format document based on person type
  const formatDocument = (doc, personType) => {
    if (!doc) return '-';
    if (personType === 'PJ') {
      return formatCNPJ(doc);
    }
    return formatCPF(doc);
  };

  const handleSelectParty = (partyId) => {
    setSelectedPartyId(selectedPartyId === partyId ? null : partyId);
  };
  return (
    <div className="case-section">
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">👥 Partes do Processo</h2>
          <Button
            variant="success"
            size="md"
            onClick={() => {
              if (readOnly) return;
              onAddPartyClick();
            }}
            disabled={readOnly}
            aria-disabled={readOnly ? 'true' : undefined}
          >
            <UserPlus size={18} />
            Adicionar Parte
          </Button>
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
              <div key={party.id}>
                <div 
                  className={`party-card${selectedPartyId === party.id ? ' selected' : ''}`}
                  onClick={() => handleSelectParty(party.id)}
                >
                  <div className="party-info">
                    <div className="party-header">
                      <span className="party-icon">
                        {party.contact_person_type === 'PF' ? '👤' : '🏢'}
                      </span>
                      <div className="party-details">
                        <h3 className="party-name">{party.contact_name}</h3>
                        <div className="party-badges">
                          <PartyRoleBadge role={party.role} label={party.role_display} size="md" />
                          {party.is_client && (
                            <PartyRoleBadge label="CLIENTE" isClient={true} showCheck={true} size="md" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="party-contact-info">
                      {party.contact_document && (
                        <span className="party-detail">
                          📄 {formatDocument(party.contact_document, party.contact_person_type)}
                        </span>
                      )}
                      {party.contact_phone && (
                        <span className="party-detail">
                          📱 {formatPhone(party.contact_phone)}
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
                        <strong>Observações:</strong>{' '}
                        <span className="party-notes-text">{party.observacoes}</span>
                      </div>
                    )}
                  </div>

                  <div className="party-actions" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="edit"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (readOnly) return;
                        onEditParty(party);
                      }}
                      disabled={readOnly}
                      aria-disabled={readOnly ? 'true' : undefined}
                      aria-label="Editar"
                      title="Editar papel da parte no processo"
                    >
                      <Edit2 size={18} />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (readOnly) return;
                        onRemoveParty(party.id, party.contact_name);
                      }}
                      disabled={readOnly}
                      aria-disabled={readOnly ? 'true' : undefined}
                      aria-label="Excluir"
                      title="Remover do processo"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>

                {party.is_client && party.contact != null && (() => {
                  const rep = representations.find((r) => Number(r?.represented_contact) === Number(party.contact));
                  if (!rep) return null;

                  const representativeParty = parties.find((p) => Number(p?.contact) === Number(rep?.representative_contact));
                  const representativeName = representativeParty?.contact_name || rep?.representative_contact_name || 'Representante';
                  const representativePersonType = representativeParty?.contact_person_type || 'PF';
                  const repTypeLabel = (rep?.representation_type || '').trim();

                  return (
                    <div className="party-card party-card--representative">
                      <div className="party-info">
                        <div className="party-header">
                          <span className="party-icon">{representativePersonType === 'PF' ? '👤' : '🏢'}</span>
                          <div className="party-details">
                            <h3 className="party-name">{representativeName}</h3>
                            <div className="party-badges">
                              <PartyRoleBadge label="REPRESENTANTE" size="md" />
                              {repTypeLabel && <PartyRoleBadge label={repTypeLabel} size="md" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PartiesTab;
