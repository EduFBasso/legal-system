import { UserPlus } from 'lucide-react';
import Toast from '../common/Toast';
import ContactDetailModal from '../ContactDetailModal';
import SelectContactModal from '../SelectContactModal';

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
  return (
    <>
      {/* Modal de Seleção de Contato */}
      {modalsNotif.showSelectContactModal && (
        <SelectContactModal
          isOpen={modalsNotif.showSelectContactModal}
          onClose={() => modalsNotif.setShowSelectContactModal(false)}
          onSelectContact={onSelectContactForParty}
          onCreateNew={onCreateNewContactForParty}
          existingPartyContactIds={parties.parties.map((p) => p.contact)}
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

      {/* Modal de Edição de Papel da Parte */}
      {parties.editingParty && (
        <div className="modal-overlay" onClick={() => parties.setEditingParty(null)}>
          <div className="modal-content party-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Papel da Parte</h2>
              <button className="modal-close" onClick={() => parties.setEditingParty(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="selected-contact-info">
                <span className="contact-icon">
                  {parties.editingParty.contact_person_type === 'PF' ? '👤' : '🏢'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <strong>{parties.editingParty.contact_name}</strong>
                    <button
                      className="btn-edit-contact-link"
                      onClick={() => modalsNotif.setEditingContactId(parties.editingParty.contact)}
                      title="Editar dados pessoais do contato"
                      style={{
                        background: 'none',
                        border: '1px solid #2563eb',
                        borderRadius: '4px',
                        padding: '0.4rem 0.8rem',
                        cursor: 'pointer',
                        color: '#2563eb',
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#2563eb';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'none';
                        e.target.style.color = '#2563eb';
                      }}
                    >
                      ✏️ Editar dados pessoais
                    </button>
                  </div>
                  {parties.editingParty.contact_document && (
                    <span className="contact-doc"> • {parties.editingParty.contact_document}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Papel no Processo *</label>
                <select
                  value={parties.editingPartyFormData.role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    parties.setEditingPartyFormData((prev) => ({
                      ...prev,
                      role: newRole,
                    }));
                  }}
                >
                  <option value="AUTOR">Autor/Requerente</option>
                  <option value="REU">Réu/Requerido</option>
                  <option value="TESTEMUNHA">Testemunha</option>
                  <option value="PERITO">Perito</option>
                  <option value="TERCEIRO">Terceiro Interessado</option>
                  <option value="CLIENTE">Cliente/Representado</option>
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={parties.editingPartyFormData.is_client}
                    onChange={(e) =>
                      parties.setEditingPartyFormData((prev) => ({ ...prev, is_client: e.target.checked }))
                    }
                  />
                  <span>É cliente do escritório neste processo</span>
                </label>
              </div>

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
              <button className="btn btn-secondary" onClick={() => parties.setEditingParty(null)}>
                Cancelar
              </button>
              <button className="btn btn-success" onClick={onSavePartyChanges}>
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
        />
      )}

      {/* Modal de Definir Papel da Parte */}
      {parties.showAddPartyModal && parties.selectedContact && (
        <div className="modal-overlay" onClick={parties.handleCloseAddPartyModal}>
          <div className="modal-content party-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adicionar ao Processo</h2>
              <button className="modal-close" onClick={parties.handleCloseAddPartyModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="selected-contact-info">
                <span className="contact-icon">
                  {parties.selectedContact.person_type === 'PF' ? '👤' : '🏢'}
                </span>
                <div>
                  <strong>{parties.selectedContact.name}</strong>
                  {parties.selectedContact.document_number && (
                    <span className="contact-doc"> • {parties.selectedContact.document_number}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Papel no Processo *</label>
                <select
                  value={parties.partyFormData.role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    parties.setPartyFormData((prev) => ({
                      ...prev,
                      role: newRole,
                      is_client:
                        newRole === 'CLIENTE'
                          ? true
                          : newRole === 'TESTEMUNHA' || newRole === 'PERITO'
                            ? false
                            : prev.is_client,
                    }));
                  }}
                >
                  <option value="AUTOR">Autor/Requerente</option>
                  <option value="REU">Réu/Requerido</option>
                  <option value="TESTEMUNHA">Testemunha</option>
                  <option value="PERITO">Perito</option>
                  <option value="TERCEIRO">Terceiro Interessado</option>
                  <option value="CLIENTE">Cliente/Representado</option>
                </select>
              </div>

              {!['TESTEMUNHA', 'PERITO', 'CLIENTE'].includes(parties.partyFormData.role) && (() => {
                const hasExistingClient = parties.parties.some((p) => p.is_client);
                return (
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={parties.partyFormData.is_client}
                        onChange={(e) => parties.setPartyFormData((prev) => ({ ...prev, is_client: e.target.checked }))}
                        disabled={hasExistingClient}
                      />
                      <span style={{ opacity: hasExistingClient ? 0.6 : 1 }}>
                        É cliente do escritório neste processo
                      </span>
                    </label>
                    {hasExistingClient && (
                      <div
                        className="field-hint"
                        style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}
                      >
                        ⓘ Este processo já possui um cliente cadastrado
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="form-group">
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
              <button className="btn btn-secondary" onClick={parties.handleCloseAddPartyModal}>
                Cancelar
              </button>
              <button className="btn btn-success" onClick={onSaveParty}>
                <UserPlus size={18} />
                Adicionar ao Processo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalsNotif.showDeleteConfirmModal && (
        <div className="modal-overlay" onClick={onCancelDelete}>
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
