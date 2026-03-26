import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, UserPlus } from 'lucide-react';
import Toast from '../common/Toast';
import ContactDetailModal from '../ContactDetailModal';
import SelectContactModal from '../SelectContactModal';
import SearchableCreatableSelectField from '../FormFields/SearchableCreatableSelectField';
import casesService from '../../services/casesService';

import './CaseDetailModals.css';

export default function CaseDetailModals({
  modalsNotif,
  parties,
  caseData,

  onSelectContactForParty,
  onCreateNewContactForParty,

  onSavePartyChanges,
  onSaveParty,

  onCancelDelete,
  onConfirmDelete,
}) {
  const defaultPartyRoleOptions = useMemo(() => ([
    { value: 'AUTOR', label: 'Autor/Requerente', editable: false },
    { value: 'REU', label: 'Réu/Requerido', editable: false },
    { value: 'TESTEMUNHA', label: 'Testemunha', editable: false },
    { value: 'PERITO', label: 'Perito', editable: false },
    { value: 'TERCEIRO', label: 'Terceiro Interessado', editable: false },
  ]), []);

  const [partyRoleOptions, setPartyRoleOptions] = useState(defaultPartyRoleOptions);

  const [representationTypeOptions, setRepresentationTypeOptions] = useState([]);
  const [showSelectRepresentativeModal, setShowSelectRepresentativeModal] = useState(false);
  const [showCreateRepresentativeModal, setShowCreateRepresentativeModal] = useState(false);
  const [representativeTarget, setRepresentativeTarget] = useState(null); // 'add' | 'edit'
  const [editingRepresentativeContactId, setEditingRepresentativeContactId] = useState(null);
  const [editingRepresentativeTarget, setEditingRepresentativeTarget] = useState(null); // 'add' | 'edit'

  useEffect(() => {
    const shouldLoad = !!parties.editingParty || !!parties.showAddPartyModal;
    if (!shouldLoad) return;

    let isActive = true;
    Promise.resolve(casesService.getPartyRoleOptions())
      .then((options) => {
        if (!isActive) return;
        if (Array.isArray(options) && options.length > 0) {
          setPartyRoleOptions(options);
        }
      })
      .catch(() => {
        // Fallback silencioso para defaults.
      });

    return () => {
      isActive = false;
    };
  }, [parties.editingParty, parties.showAddPartyModal]);

  useEffect(() => {
    const shouldLoad = !!parties.editingParty || !!parties.showAddPartyModal;
    if (!shouldLoad) return;

    let isActive = true;
    Promise.resolve(casesService.getRepresentationTypeOptions())
      .then((options) => {
        if (!isActive) return;
        if (Array.isArray(options)) {
          setRepresentationTypeOptions(options);
        }
      })
      .catch(() => {
        // Fallback silencioso.
      });

    return () => {
      isActive = false;
    };
  }, [parties.editingParty, parties.showAddPartyModal]);

  const onCreatePartyRoleOption = useCallback(async (label) => {
    try {
      const created = await casesService.createPartyRoleOption(label);
      if (created && typeof created === 'object') {
        setPartyRoleOptions((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          const exists = next.some((opt) => String(opt?.value) === String(created.value));
          if (!exists) next.push(created);
          return next;
        });
      }
      return created;
    } catch (error) {
      modalsNotif?.showToast?.(error?.message || 'Erro ao cadastrar papel no processo', 'error');
      return null;
    }
  }, [modalsNotif]);

  const onEditPartyRoleOption = useCallback(async (idToUpdate, label) => {
    try {
      const updated = await casesService.updatePartyRoleOption(idToUpdate, label);
      if (updated && typeof updated === 'object') {
        setPartyRoleOptions((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          const index = next.findIndex((opt) => Number(opt?.id) === Number(updated.id));
          if (index >= 0) {
            next[index] = { ...next[index], ...updated };
            return next;
          }
          const byValue = next.findIndex((opt) => String(opt?.value) === String(updated.value));
          if (byValue >= 0) {
            next[byValue] = { ...next[byValue], ...updated };
            return next;
          }
          return [...next, updated];
        });
      }
      return updated;
    } catch (error) {
      modalsNotif?.showToast?.(error?.message || 'Erro ao editar papel no processo', 'error');
      return null;
    }
  }, [modalsNotif]);

  const onCreateRepresentationTypeOption = useCallback(async (label) => {
    try {
      const created = await casesService.createRepresentationTypeOption(label);
      if (created && typeof created === 'object') {
        setRepresentationTypeOptions((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          const exists = next.some((opt) => String(opt?.value) === String(created.value));
          if (!exists) next.push(created);
          return next;
        });
      }
      return created;
    } catch (error) {
      modalsNotif?.showToast?.(error?.message || 'Erro ao cadastrar tipo de representação', 'error');
      return null;
    }
  }, [modalsNotif]);

  const onEditRepresentationTypeOption = useCallback(async (idToUpdate, label) => {
    try {
      const updated = await casesService.updateRepresentationTypeOption(idToUpdate, label);
      if (updated && typeof updated === 'object') {
        setRepresentationTypeOptions((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          const index = next.findIndex((opt) => Number(opt?.id) === Number(updated.id));
          if (index >= 0) {
            next[index] = { ...next[index], ...updated };
            return next;
          }
          const byValue = next.findIndex((opt) => String(opt?.value) === String(updated.value));
          if (byValue >= 0) {
            next[byValue] = { ...next[byValue], ...updated };
            return next;
          }
          return [...next, updated];
        });
      }
      return updated;
    } catch (error) {
      modalsNotif?.showToast?.(error?.message || 'Erro ao editar tipo de representação', 'error');
      return null;
    }
  }, [modalsNotif]);

  const openRepresentativePicker = useCallback((target) => {
    setRepresentativeTarget(target);
    setShowSelectRepresentativeModal(true);
  }, []);

  const openEditRepresentativeContact = useCallback((target, contactId) => {
    if (!contactId) return;
    setEditingRepresentativeTarget(target);
    setEditingRepresentativeContactId(contactId);
  }, []);

  const handleRepresentativeContactUpdated = useCallback((updatedContact) => {
    if (!updatedContact || !updatedContact.id) return;

    if (editingRepresentativeTarget === 'edit') {
      parties.setEditingPartyFormData((prev) => {
        const prevId = prev?.representative_contact?.id;
        if (!prevId || Number(prevId) !== Number(updatedContact.id)) return prev;
        return {
          ...prev,
          representative_contact: updatedContact,
        };
      });
    } else {
      parties.setPartyFormData((prev) => {
        const prevId = prev?.representative_contact?.id;
        if (!prevId || Number(prevId) !== Number(updatedContact.id)) return prev;
        return {
          ...prev,
          representative_contact: updatedContact,
        };
      });
    }

    modalsNotif?.showToast?.('Dados do representante atualizados!', 'success');
  }, [editingRepresentativeTarget, modalsNotif, parties]);

  const applyRepresentativeSelection = useCallback((contact) => {
    if (!contact) return;

    const representedContactId = representativeTarget === 'edit'
      ? parties.editingParty?.contact
      : parties.selectedContact?.id;

    if (representedContactId && Number(contact.id) === Number(representedContactId)) {
      modalsNotif?.showToast?.('Representante não pode ser o mesmo contato do cliente.', 'error', 6000);
      return;
    }

    if (representativeTarget === 'edit') {
      parties.setEditingPartyFormData((prev) => ({
        ...prev,
        representative_contact: contact,
      }));
    } else {
      parties.setPartyFormData((prev) => ({
        ...prev,
        representative_contact: contact,
      }));
    }
    setShowSelectRepresentativeModal(false);
  }, [modalsNotif, parties, representativeTarget]);

  const openCreateRepresentativeContact = useCallback(() => {
    setShowSelectRepresentativeModal(false);
    setShowCreateRepresentativeModal(true);
  }, []);

  return (
    <>
      {/* Modal de Seleção de Contato */}
      {modalsNotif.showSelectContactModal && (
        <SelectContactModal
          isOpen={modalsNotif.showSelectContactModal}
          onClose={() => modalsNotif.setShowSelectContactModal(false)}
          onSelectContact={onSelectContactForParty}
          onCreateNew={onCreateNewContactForParty}
          existingPartyContactIds={(() => {
            const partyContactIds = parties.parties.map((p) => p.contact);
            const representativeContactIds = (caseData?.representations || [])
              .map((r) => r?.representative_contact)
              .filter(Boolean);
            return Array.from(new Set([...partyContactIds, ...representativeContactIds]));
          })()}
          disabledContactReason="Este contato já está sendo usado neste processo (como parte ou representante)."
        />
      )}

      {/* Modal de Novo Cliente/Parte */}
      {modalsNotif.showContactModal && (
        <ContactDetailModal
          contactId={null}
          isOpen={modalsNotif.showContactModal}
          onClose={() => modalsNotif.setShowContactModal(false)}
          onContactUpdated={modalsNotif.handleContactCreated}
          showLinkToProcessButton={false}
          onLinkToProcess={onSelectContactForParty}
        />
      )}

      {/* Modal de Seleção de Representante */}
      {showSelectRepresentativeModal && (
        <SelectContactModal
          isOpen={showSelectRepresentativeModal}
          onClose={() => setShowSelectRepresentativeModal(false)}
          onSelectContact={applyRepresentativeSelection}
          onCreateNew={openCreateRepresentativeContact}
          existingPartyContactIds={[]}
          disabledContactIds={(() => {
            const representedContactId = representativeTarget === 'edit'
              ? parties.editingParty?.contact
              : parties.selectedContact?.id;
            const partyContactIds = Array.isArray(parties.parties)
              ? parties.parties.map((p) => p?.contact).filter(Boolean)
              : [];

            const blockedIds = [
              ...partyContactIds,
              ...(representedContactId ? [representedContactId] : []),
            ];

            // Permitir apenas o próprio representado (se estiver na lista) ser filtrado via regra específica.
            // Aqui a regra é: ninguém que já é parte pode ser selecionado como representante.
            return Array.from(new Set(blockedIds));
          })()}
          disabledContactReason="Este contato já está vinculado a este processo como parte e não pode ser escolhido como representante."
        />
      )}

      {/* Modal de Criar Representante */}
      {showCreateRepresentativeModal && (
        <ContactDetailModal
          contactId={null}
          isOpen={showCreateRepresentativeModal}
          onClose={() => setShowCreateRepresentativeModal(false)}
          onContactUpdated={modalsNotif.handleContactCreated}
          showLinkToProcessButton={false}
          modalOverlayClassName="modal-overlay--top"
          onLinkToProcess={(created) => {
            applyRepresentativeSelection(created);
            setShowCreateRepresentativeModal(false);
          }}
        />
      )}

      {/* Modal de Editar Representante (dados pessoais) */}
      {!!editingRepresentativeContactId && (
        <ContactDetailModal
          contactId={editingRepresentativeContactId}
          isOpen={!!editingRepresentativeContactId}
          onClose={() => {
            setEditingRepresentativeContactId(null);
            setEditingRepresentativeTarget(null);
          }}
          onContactUpdated={(updated) => {
            handleRepresentativeContactUpdated(updated);
            setEditingRepresentativeContactId(null);
            setEditingRepresentativeTarget(null);
          }}
          showLinkToProcessButton={false}
          openInEditMode={true}
          modalOverlayClassName="modal-overlay--top"
        />
      )}

      {/* Modal de Edição de Papel da Parte */}
      {parties.editingParty && (
        <div className="modal-overlay case-detail-modal-overlay" onClick={() => parties.setEditingParty(null)}>
          <div className="modal-content party-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Papel da Parte</h2>
              <button className="modal-close" onClick={() => parties.setEditingParty(null)}>×</button>
            </div>

            <div className="modal-body">
              <section className="party-modal__section">
                <div className="party-modal__section-header">
                  <h3 className="party-modal__section-title">📌 Parte no Processo</h3>
                </div>

                <div className="party-modal__section-body">
                  <div className="selected-contact-info party-modal__contact-card">
                    <span className="contact-icon">
                      {parties.editingParty.contact_person_type === 'PF' ? '👤' : '🏢'}
                    </span>
                    <div className="party-modal__grow">
                      <div className="party-modal__contact-header">
                        <strong className="party-modal__contact-name">{parties.editingParty.contact_name}</strong>
                      </div>
                      {parties.editingParty.contact_document && (
                        <span className="contact-doc"> • {parties.editingParty.contact_document}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group party-modal__field party-modal__client-flag">
                    <label className="checkbox-label checkbox-label-strong party-modal__client-flag-label">
                      <input
                        type="checkbox"
                        checked={parties.editingPartyFormData.is_client}
                        onChange={(e) =>
                          parties.setEditingPartyFormData((prev) => ({
                            ...prev,
                            is_client: e.target.checked,
                            ...(e.target.checked
                              ? {}
                              : {
                                is_represented: false,
                                representative_contact: null,
                                representation_type: '',
                              }),
                          }))
                        }
                      />
                      <span>É cliente do escritório neste processo</span>
                    </label>
                  </div>

                  <div className="form-group party-modal__field">
                    <label>Papel no Processo *</label>
                    <SearchableCreatableSelectField
                      value={parties.editingPartyFormData.role}
                      onChange={(newRole) => {
                        parties.setEditingPartyFormData((prev) => ({
                          ...prev,
                          role: newRole,
                          ...(prev.is_client
                            ? {}
                            : {
                              is_represented: false,
                              representative_contact: null,
                              representation_type: '',
                            }),
                        }));
                      }}
                      options={partyRoleOptions}
                      placeholder="Pesquisar ou selecionar..."
                      allowCreate={true}
                      onCreateOption={onCreatePartyRoleOption}
                      onEditOption={onEditPartyRoleOption}
                      reduceListOnQuery={true}
                    />
                  </div>
                </div>
              </section>

              {!['TESTEMUNHA', 'PERITO'].includes(parties.editingPartyFormData.role) && (
                <section className="party-modal__section">
                  <div className="party-modal__section-header">
                    <h3 className="party-modal__section-title">🛡️ Representação</h3>
                    <span className="party-modal__section-subtitle">(quando aplicável)</span>
                  </div>

                  <div className="party-modal__section-body">
                    <div className="party-modal__hint">
                      ⓘ A representação é cadastrada apenas para o cliente do escritório neste processo
                    </div>
                    <div className="form-group party-modal__field">
                      <label className="party-modal__radio-label">
                        Tem representante legal?
                      </label>
                      <div className="party-modal__radio-row">
                        <label className="checkbox-label">
                          <input
                            type="radio"
                            name="edit-party-has-representative"
                            checked={!parties.editingPartyFormData.is_represented}
                            onChange={() =>
                              parties.setEditingPartyFormData((prev) => ({
                                ...prev,
                                is_represented: false,
                                representative_contact: null,
                                representation_type: '',
                              }))
                            }
                          />
                          <span>Não</span>
                        </label>
                        <label className="checkbox-label">
                          <input
                            type="radio"
                            name="edit-party-has-representative"
                            checked={!!parties.editingPartyFormData.is_represented}
                            onChange={() =>
                              parties.setEditingPartyFormData((prev) => ({
                                ...prev,
                                is_represented: true,
                              }))
                            }
                          />
                          <span>Sim</span>
                        </label>
                      </div>
                    </div>

                    {parties.editingPartyFormData.is_represented && (
                      <>
                        <div className="form-group party-modal__field">
                          <label>Representante *</label>

                          {parties.editingPartyFormData.representative_contact ? (
                            <div className="selected-contact-info selected-contact-info--representative party-modal__representative-row">
                              <span className="contact-icon">👤</span>
                              <div className="party-modal__grow">
                                <strong className="party-modal__representative-name">{parties.editingPartyFormData.representative_contact.name}</strong>
                              </div>
                              <button
                                type="button"
                                className="party-modal__icon-button"
                                onClick={() => openEditRepresentativeContact('edit', parties.editingPartyFormData.representative_contact?.id)}
                                title="Editar dados do representante"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-md"
                                onClick={() => openRepresentativePicker('edit')}
                              >
                                Trocar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-success btn-md"
                              onClick={() => openRepresentativePicker('edit')}
                            >
                              Selecionar Representante
                            </button>
                          )}
                        </div>

                        <div className="form-group party-modal__field">
                          <label>Tipo de representação *</label>
                          <SearchableCreatableSelectField
                            value={parties.editingPartyFormData.representation_type}
                            onChange={(newValue) => {
                              parties.setEditingPartyFormData((prev) => ({
                                ...prev,
                                representation_type: newValue,
                              }));
                            }}
                            options={representationTypeOptions}
                            placeholder="Pesquisar ou selecionar..."
                            allowCreate={true}
                            onCreateOption={onCreateRepresentationTypeOption}
                            onEditOption={onEditRepresentationTypeOption}
                            onSearchOptions={(q) => casesService.getRepresentationTypeOptions(q)}
                            reduceListOnQuery={true}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </section>
              )}

              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={parties.editingPartyFormData.observacoes}
                  onChange={(e) =>
                    parties.setEditingPartyFormData((prev) => ({ ...prev, observacoes: e.target.value }))
                  }
                  placeholder="Ex: Cliente pela contraparte, não é nosso cliente..."
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={() => parties.setEditingParty(null)}>
                Cancelar
              </button>
              <button className="btn btn-success btn-md" onClick={onSavePartyChanges}>
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Contato (dados pessoais) */}
      {modalsNotif.editingContactId && (
        <ContactDetailModal
          contactId={modalsNotif.editingContactId}
          isOpen={!!modalsNotif.editingContactId}
          onClose={() => modalsNotif.setEditingContactId(null)}
          onContactUpdated={() => {
            modalsNotif.handleContactUpdated();
            parties.loadParties();
          }}
          showLinkToProcessButton={false}
          openInEditMode={true}
          modalOverlayClassName="modal-overlay--top"
        />
      )}

      {/* Modal de Definir Papel da Parte */}
      {parties.showAddPartyModal && parties.selectedContact && (
        <div className="modal-overlay case-detail-modal-overlay" onClick={parties.handleCloseAddPartyModal}>
          <div className="modal-content party-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adicionar ao Processo</h2>
              <button className="modal-close" onClick={parties.handleCloseAddPartyModal}>×</button>
            </div>

            <div className="modal-body">
              <section className="party-modal__section">
                <div className="party-modal__section-header">
                  <h3 className="party-modal__section-title">📌 Parte no Processo</h3>
                </div>

                <div className="party-modal__section-body">
                  <div className="selected-contact-info party-modal__contact-card">
                    <span className="contact-icon">
                      {parties.selectedContact.person_type === 'PF' ? '👤' : '🏢'}
                    </span>
                    <div className="party-modal__grow">
                      <div className="party-modal__contact-header">
                        <strong className="party-modal__contact-name">{parties.selectedContact.name}</strong>
                      </div>
                      {parties.selectedContact.document_number && (
                        <span className="contact-doc"> • {parties.selectedContact.document_number}</span>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const hasExistingClient = parties.parties.some((p) => p.is_client);
                    if (hasExistingClient) {
                      return (
                        <div className="party-modal__hint">
                          ⓘ Este processo já possui um cliente cadastrado
                        </div>
                      );
                    }

                    return (
                      <div className="form-group party-modal__field party-modal__client-flag">
                        <label className="checkbox-label checkbox-label-strong party-modal__client-flag-label">
                          <input
                            type="checkbox"
                            checked={parties.partyFormData.is_client}
                            onChange={(e) => parties.setPartyFormData((prev) => ({
                              ...prev,
                              is_client: e.target.checked,
                              ...(e.target.checked
                                ? {}
                                : {
                                  is_represented: false,
                                  representative_contact: null,
                                  representation_type: '',
                                }),
                            }))}
                          />
                          <span>É cliente do escritório neste processo</span>
                        </label>
                      </div>
                    );
                  })()}

                  <div className="form-group party-modal__field">
                    <label>Papel no Processo *</label>
                    <SearchableCreatableSelectField
                      value={parties.partyFormData.role}
                      onChange={(newRole) => {
                        parties.setPartyFormData((prev) => {
                          const nextIsClient =
                            newRole === 'CLIENTE'
                              ? true
                              : newRole === 'TESTEMUNHA' || newRole === 'PERITO'
                                ? false
                                : prev.is_client;

                          return {
                            ...prev,
                            role: newRole,
                            is_client: nextIsClient,
                            ...(nextIsClient
                              ? {}
                              : {
                                is_represented: false,
                                representative_contact: null,
                                representation_type: '',
                              }),
                          };
                        });
                      }}
                      options={partyRoleOptions}
                      placeholder="Pesquisar ou selecionar..."
                      allowCreate={true}
                      onCreateOption={onCreatePartyRoleOption}
                      onEditOption={onEditPartyRoleOption}
                      reduceListOnQuery={true}
                    />
                  </div>
                </div>
              </section>

              {!['TESTEMUNHA', 'PERITO'].includes(parties.partyFormData.role) && parties.partyFormData.is_client && (
                <section className="party-modal__section">
                  <div className="party-modal__section-header">
                    <h3 className="party-modal__section-title">🛡️ Representação</h3>
                    <span className="party-modal__section-subtitle">(quando aplicável)</span>
                  </div>

                  <div className="party-modal__section-body">
                    <div className="form-group party-modal__field">
                      <label className="party-modal__radio-label">
                        Tem representante legal?
                      </label>
                      <div className="party-modal__radio-row">
                        <label className="checkbox-label">
                          <input
                            type="radio"
                            name="add-party-has-representative"
                            checked={!parties.partyFormData.is_represented}
                            onChange={() =>
                              parties.setPartyFormData((prev) => ({
                                ...prev,
                                is_represented: false,
                                representative_contact: null,
                                representation_type: '',
                              }))
                            }
                          />
                          <span>Não</span>
                        </label>
                        <label className="checkbox-label">
                          <input
                            type="radio"
                            name="add-party-has-representative"
                            checked={!!parties.partyFormData.is_represented}
                            onChange={() =>
                              parties.setPartyFormData((prev) => ({
                                ...prev,
                                is_represented: true,
                              }))
                            }
                          />
                          <span>Sim</span>
                        </label>
                      </div>
                    </div>

                    {parties.partyFormData.is_represented && (
                      <>
                        <div className="form-group party-modal__field">
                          <label>Representante *</label>

                          {parties.partyFormData.representative_contact ? (
                            <div className="selected-contact-info selected-contact-info--representative party-modal__representative-row">
                              <span className="contact-icon">👤</span>
                              <div className="party-modal__grow">
                                <strong className="party-modal__representative-name">{parties.partyFormData.representative_contact.name}</strong>
                              </div>
                              <button
                                type="button"
                                className="party-modal__icon-button"
                                onClick={() => openEditRepresentativeContact('add', parties.partyFormData.representative_contact?.id)}
                                title="Editar dados do representante"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-md"
                                onClick={() => openRepresentativePicker('add')}
                              >
                                Trocar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-success btn-md"
                              onClick={() => openRepresentativePicker('add')}
                            >
                              Selecionar Representante
                            </button>
                          )}
                        </div>

                        <div className="form-group party-modal__field">
                          <label>Tipo de representação *</label>
                          <SearchableCreatableSelectField
                            value={parties.partyFormData.representation_type}
                            onChange={(newValue) => {
                              parties.setPartyFormData((prev) => ({
                                ...prev,
                                representation_type: newValue,
                              }));
                            }}
                            options={representationTypeOptions}
                            placeholder="Pesquisar ou selecionar..."
                            allowCreate={true}
                            onCreateOption={onCreateRepresentationTypeOption}
                            onEditOption={onEditRepresentationTypeOption}
                            onSearchOptions={(q) => casesService.getRepresentationTypeOptions(q)}
                            reduceListOnQuery={true}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </section>
              )}

              <div className="form-group party-modal__field">
                <label>Observações</label>
                <textarea
                  value={parties.partyFormData.observacoes}
                  onChange={(e) => parties.setPartyFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
                  rows="3"
                  placeholder="Observações sobre a participação desta parte..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={parties.handleCloseAddPartyModal}>
                Cancelar
              </button>
              <button className="btn btn-success btn-md" onClick={onSaveParty}>
                <UserPlus size={18} />
                Adicionar ao Processo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalsNotif.showDeleteConfirmModal && (
        <div className="modal-overlay case-detail-modal-overlay" onClick={onCancelDelete}>
          <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '2px solid #ef4444' }}>
              <h2 style={{ color: '#7f1d1d', margin: 0 }}>🗑️ Deletar Processo</h2>
              <button className="modal-close" onClick={onCancelDelete} style={{ color: '#ef4444' }}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '1rem', marginBottom: '1rem', color: '#374151' }}>
                Tem certeza que deseja deletar este processo <strong>{caseData?.numero_processo}</strong>?
              </p>

              {(caseData?.publicacao_origem || caseData?.publicacao_origem_id) && (
                <div
                  style={{
                    background: '#fef3c7',
                    border: '1px solid #fcd34d',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                  }}
                >
                  <p style={{ margin: '0 0 0.75rem 0', fontWeight: 600, color: '#92400e' }}>
                    ⚠️ Este processo está vinculado a uma publicação:
                  </p>
                  <p style={{ margin: 0, color: '#78350f', fontSize: '0.95rem' }}>
                    <strong>{caseData?.publicacao_origem_numero_processo}</strong> - {caseData?.publicacao_origem_tipo}
                  </p>
                </div>
              )}

              {(caseData?.publicacao_origem || caseData?.publicacao_origem_id) && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={modalsNotif.deletePublicationToo}
                      onChange={(e) => modalsNotif.setDeletePublicationToo(e.target.checked)}
                      style={{ marginTop: '0.25rem', cursor: 'pointer' }}
                    />
                    <span style={{ color: '#374151' }}>
                      <strong>Deletar também a publicação de origem</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
                        {modalsNotif.deletePublicationToo
                          ? '✓ A publicação será deletada do sistema e não poderá ser recuperada'
                          : 'A publicação será desvinculada e retornará à lista "Publicações Não Vinculadas"'}
                      </p>
                    </span>
                  </label>
                </div>
              )}

              <div
                style={{
                  background: '#f3f4f6',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  color: '#6b7280',
                  marginTop: '1rem',
                }}
              >
                ℹ️ Esta ação é irreversível. O processo será marcado como deletado por segurança.
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb' }}>
              <button className="btn btn-secondary" onClick={onCancelDelete}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={onConfirmDelete} style={{ background: '#ef4444' }}>
                🗑️ Deletar Processo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast - Renderizado por último para ficar visualmente acima */}
      {modalsNotif.toast && (
        <Toast
          isOpen={true}
          message={modalsNotif.toast.message}
          type={modalsNotif.toast.type}
          autoCloseMs={modalsNotif.toast.duration || 3000}
          onClose={() => modalsNotif.setToast(null)}
        />
      )}
    </>
  );
}
