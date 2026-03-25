import { useEffect, useMemo, useState } from 'react';

import './VinculosTab.css';

import EmptyState from '../common/EmptyState';
import PartyRoleBadge from '../common/PartyRoleBadge';
import { contactsAPI } from '../../services/api';
import { openCaseDetailWindow } from '../../utils/publicationNavigation';

function VinculosTab({
  caseData,
  linkedCases = [],
  loading = false,
  parties = [],
  mentionedProcessLinks = [],
  onMentionedProcessRoleChange = () => {},
  onRemoveMentionedProcess = () => {},
  readOnly = false,
}) {
  const clientId = caseData?.cliente_principal || null;
  const clientName = caseData?.cliente_nome || 'Cliente';
  const currentCaseId = caseData?.id || null;

  const uniqueContactIds = useMemo(() => {
    const ids = parties
      .map((party) => party?.contact)
      .filter(Boolean)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
    return Array.from(new Set(ids));
  }, [parties]);

  const [contactsById, setContactsById] = useState({});
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadContacts = async () => {
      if (uniqueContactIds.length === 0) {
        setContactsById({});
        setContactsError(null);
        return;
      }

      setLoadingContacts(true);
      setContactsError(null);

      try {
        const results = await Promise.allSettled(uniqueContactIds.map((id) => contactsAPI.getById(id)));
        if (!isActive) return;

        const nextMap = {};
        let hadFailures = false;

        results.forEach((result, index) => {
          const id = uniqueContactIds[index];
          if (result.status === 'fulfilled') {
            nextMap[id] = result.value;
          } else {
            hadFailures = true;
          }
        });

        setContactsById(nextMap);
        if (hadFailures) {
          setContactsError('Alguns contatos não puderam ser carregados.');
        }
      } catch {
        if (!isActive) return;
        setContactsById({});
        setContactsError('Erro ao carregar vínculos dos contatos.');
      } finally {
        if (isActive) {
          setLoadingContacts(false);
        }
      }
    };

    loadContacts();

    return () => {
      isActive = false;
    };
  }, [uniqueContactIds]);

  const handleOpenContact = (e) => {
    e?.stopPropagation?.();
    if (readOnly) return;
    if (!clientId) return;
    window.open(`/contacts?open=${clientId}`, '_blank', 'noopener,noreferrer');
  };

  const handleOpenPartyContact = (e, contactId) => {
    e?.stopPropagation?.();
    if (readOnly) return;
    if (!contactId) return;
    window.open(`/contacts?open=${contactId}`, '_blank', 'noopener,noreferrer');
  };

  const handleOpenCase = (caseId) => {
    if (readOnly) return;
    if (!caseId) return;
    openCaseDetailWindow(caseId);
  };

  return (
    <div className="case-section">
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">🔗 Vínculos</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="vinculos-section vinculos-section--contacts">
            <div className="vinculos-subtitle vinculos-subtitle--lg">👥 Vínculos por contato</div>

            {parties.length === 0 ? (
              <EmptyState
                icon="👤"
                title="Nenhuma parte vinculada"
                description="Adicione partes ao processo para visualizar vínculos por contato."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(loadingContacts || contactsError) && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {loadingContacts && <span>Carregando vínculos dos contatos…</span>}
                    {!loadingContacts && contactsError && <span>{contactsError}</span>}
                  </div>
                )}

                {parties.map((party) => {
                  const contactId = party?.contact ? Number(party.contact) : null;
                  const contactDetails = contactId ? contactsById[contactId] : null;
                  const linkedFromContact = Array.isArray(contactDetails?.linked_cases)
                    ? contactDetails.linked_cases
                    : [];

                  const otherCases = currentCaseId
                    ? linkedFromContact.filter((item) => Number(item.case_id) !== Number(currentCaseId))
                    : linkedFromContact;

                  return (
                    <div
                      key={party?.id || `${party?.contact}-${party?.role}`}
                      style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary vinculos-contact-button"
                          onClick={(e) => handleOpenPartyContact(e, contactId)}
                          title="Abrir contato em nova aba"
                          disabled={readOnly}
                        >
                          👁 {party?.contact_name || `Contato #${contactId || ''}`}
                        </button>

                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <PartyRoleBadge role={party?.role} label={party?.role_display || party?.role} size="sm" />
                          {party?.is_client && (
                            <PartyRoleBadge label="CLIENTE" isClient={true} showCheck={true} size="sm" />
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontWeight: 700, marginBottom: '6px' }}>📋 Processos vinculados deste contato</div>

                        {loadingContacts && !contactDetails ? (
                          <div>Carregando…</div>
                        ) : otherCases.length === 0 ? (
                          <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            Nenhum outro processo vinculado.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {otherCases.map((linkedCase) => (
                              <button
                                key={linkedCase.id}
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleOpenCase(linkedCase.case_id)}
                                title="Abrir processo em nova aba"
                                style={{ textAlign: 'left', justifyContent: 'space-between', width: '100%', display: 'flex', gap: '12px' }}
                                disabled={readOnly}
                              >
                                <span>
                                  📄 {linkedCase.numero_processo}
                                </span>
                                <span style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <PartyRoleBadge role={linkedCase.role} label={linkedCase.role_display} size="sm" />
                                  {linkedCase.is_client && (
                                    <PartyRoleBadge label="CLIENTE" isClient={true} showCheck={true} size="sm" />
                                  )}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="vinculos-subtitle vinculos-subtitle--lg">🔗 Vínculos por processo</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div className="vinculos-subtitle">Processos mencionados em movimentações</div>

                {mentionedProcessLinks.length === 0 ? (
                  <EmptyState
                    icon="🧾"
                    title="Nenhum processo mencionado ainda"
                    description="Clique em um CNJ na aba Movimentações para adicionar aqui."
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {mentionedProcessLinks.map((item) => (
                      <div
                        key={item.cnj}
                        style={{
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          padding: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                          <div style={{ fontWeight: 800 }}>📄 {item.cnj}</div>
                          <input
                            className="financeiro-input"
                            type="text"
                            value={item.papel || ''}
                            onChange={(e) => onMentionedProcessRoleChange(item.cnj, e.target.value)}
                            placeholder="Papel (opcional)"
                            disabled={readOnly}
                          />
                        </div>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveMentionedProcess(item.cnj);
                          }}
                          title="Remover"
                          style={{ whiteSpace: 'nowrap' }}
                          disabled={readOnly}
                        >
                          🗑️ Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="vinculos-subtitle vinculos-subtitle--lg vinculos-subtitle--mb-lg">Cliente principal</div>
                {clientId ? (
                  <button
                    type="button"
                    className="btn btn-secondary vinculos-contact-button"
                    onClick={handleOpenContact}
                    title="Abrir contato em nova aba"
                    disabled={readOnly}
                  >
                    👁 {clientName}
                  </button>
                ) : (
                  <div>Não definido</div>
                )}
              </div>

              <div>
                <div className="vinculos-subtitle vinculos-subtitle--lg vinculos-subtitle--mb-lg">Outros processos do mesmo cliente</div>

                {loading ? (
                  <div>Carregando vínculos…</div>
                ) : linkedCases.length === 0 ? (
                  <EmptyState
                    icon="🔎"
                    title="Nenhum vínculo encontrado"
                    description="Não há outros processos com o mesmo cliente principal."
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {linkedCases.map((linkedCase) => (
                      <button
                        key={linkedCase.id}
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleOpenCase(linkedCase.id)}
                        title="Abrir processo em nova aba"
                        style={{ textAlign: 'left', justifyContent: 'space-between', width: '100%', display: 'flex', gap: '12px' }}
                        disabled={readOnly}
                      >
                        <span>
                          📄 {linkedCase.numero_processo_formatted || linkedCase.numero_processo}
                          {linkedCase.titulo ? ` — ${linkedCase.titulo}` : ''}
                        </span>
                        <span>
                          {linkedCase.status_display || linkedCase.status || ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VinculosTab;
