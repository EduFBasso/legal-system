// src/components/ContactDetailModal.jsx
import { useEffect, useState } from 'react';
import Modal from './Modal';
import ConfirmDialog from './common/ConfirmDialog';
import { useSettings } from '../contexts/SettingsContext';
import contactsAPI from '../services/api';
import { maskDocument, maskPhone, maskCEP, unmask } from '../utils/masks';
import './ContactDetailModal.css';

export default function ContactDetailModal({ contactId, isOpen, onClose, onContactUpdated }) {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const { settings } = useSettings();

  // Detect mode: CREATE if no contactId, VIEW/EDIT otherwise
  const isCreating = !contactId;

  useEffect(() => {
    if (isOpen) {
      if (contactId) {
        // Load existing contact
        loadContactDetails();
        setIsEditing(false);
      } else {
        // Creating new contact
        const emptyContact = {
          name: '',
          person_type: 'PF',
          contact_type: 'CLIENT',
          document: '',
          email: '',
          phone: '',
          mobile: '',
          address_line1: '',
          address_number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          zip_code: '',
          notes: '',
        };
        setContact(emptyContact);
        setEditedContact(emptyContact);
        setIsEditing(true); // Start in edit mode for CREATE
        setError(null);
      }
    }
  }, [isOpen, contactId]);

  // Helper: Apply masks to contact data for editing
  // Maps backend field names to frontend field names + applies masks
  const applyMasksToContact = (contactData) => {
    return {
      ...contactData,
      // Map backend field names to frontend names
      document: contactData.document_number ? maskDocument(contactData.document_number, contactData.person_type) : '',
      address_line1: contactData.street || '',
      address_number: contactData.number || '',
      // Apply masks to phone fields
      phone: contactData.phone ? maskPhone(contactData.phone) : '',
      mobile: contactData.mobile ? maskPhone(contactData.mobile) : '',
      zip_code: contactData.zip_code ? maskCEP(contactData.zip_code) : '',
    };
  };

  const loadContactDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactsAPI.getById(contactId);
      setContact(data);
      setEditedContact(applyMasksToContact(data)); // Apply masks for editing
    } catch (err) {
      setError('Erro ao carregar detalhes do contato');
      console.error('Load contact details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditedContact(applyMasksToContact(contact)); // Apply masks when entering edit mode
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (isCreating) {
      // Close modal if creating
      onClose();
    } else {
      // Revert changes if editing
      setEditedContact({ ...contact });
      setIsEditing(false);
      setError(null);
    }
  };

  const handleChange = (field, value) => {
    let formattedValue = value;
    
    // Apply masks based on field type
    if (field === 'document') {
      formattedValue = maskDocument(value, editedContact.person_type);
    } else if (field === 'phone' || field === 'mobile') {
      formattedValue = maskPhone(value);
    } else if (field === 'zip_code') {
      formattedValue = maskCEP(value);
    } else if (field === 'state') {
      // Uppercase for state
      formattedValue = value.toUpperCase().slice(0, 2);
    }
    
    setEditedContact(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const handleSave = async () => {
    try {
      // Validation: name is required
      if (!editedContact.name || editedContact.name.trim() === '') {
        setError('❌ O nome é obrigatório');
        return;
      }

      setSaving(true);
      setError(null);

      // Prepare data for API (unmask formatted fields + correct field names)
      const dataToSend = {
        name: editedContact.name.trim(),
        person_type: editedContact.person_type,
        contact_type: editedContact.contact_type,
        document_number: unmask(editedContact.document || ''),
        email: editedContact.email || '',
        phone: unmask(editedContact.phone || ''),
        mobile: unmask(editedContact.mobile || ''),
        street: editedContact.address_line1 || '',
        number: editedContact.address_number || '',
        complement: editedContact.complement || '',
        neighborhood: editedContact.neighborhood || '',
        city: editedContact.city || '',
        state: editedContact.state || '',
        zip_code: unmask(editedContact.zip_code || ''),
        notes: editedContact.notes || '',
      };

      console.log('📤 Sending to backend:', dataToSend);

      let savedContact;
      if (isCreating) {
        // CREATE: POST /api/contacts/
        savedContact = await contactsAPI.create(dataToSend);
      } else {
        // UPDATE: PUT /api/contacts/{id}/
        savedContact = await contactsAPI.update(contactId, dataToSend);
      }

      setContact(savedContact);
      setEditedContact(applyMasksToContact(savedContact)); // Map back to frontend format
      setIsEditing(false);

      // Notify parent to update list
      if (onContactUpdated) {
        onContactUpdated(savedContact, isCreating);
      }

      // Close modal after successful creation
      if (isCreating) {
        onClose();
      }
    } catch (err) {
      if (isCreating) {
        setError('Erro ao criar contato. Tente novamente.');
      } else {
        setError('Erro ao salvar alterações. Tente novamente.');
      }
      console.error('Save contact error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    // Validate password if configured
    if (settings.deletePassword) {
      if (deletePassword !== settings.deletePassword) {
        setDeleteError('❌ Senha incorreta');
        return;
      }
    }

    try {
      setSaving(true);
      setDeleteError('');
      
      await contactsAPI.delete(contactId);
      
      // Notify parent to remove from list
      if (onContactUpdated) {
        onContactUpdated(null, false, true); // Pass deleted flag
      }
      
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error('Delete error:', err);
      setDeleteError(`❌ Erro ao excluir: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletePassword('');
    setDeleteError('');
  };

  if (!isOpen) return null;

  const currentData = isEditing ? editedContact : contact;

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={isEditing && !isCreating ? null : onClose}
      title={
        isCreating 
          ? "➕ Novo Contato" 
          : isEditing 
            ? "✏️ Editar Contato" 
            : "Detalhes do Contato"
      }
      size="large"
    >
      {loading ? (
        <div className="detail-loading">
          <p>Carregando...</p>
        </div>
      ) : error ? (
        <div className="detail-error">
          <p>❌ {error}</p>
          <button onClick={loadContactDetails} className="btn-retry-detail">
            🔄 Tentar Novamente
          </button>
        </div>
      ) : contact ? (
        <div className="contact-detail-content">
          {/* Photo Section - only show in VIEW/EDIT mode */}
          {!isCreating && (
            <div className="detail-photo-section">
              {contact.photo_large ? (
                <img 
                  src={contact.photo_large} 
                  alt={contact.name}
                  className="detail-photo"
                />
              ) : (
                <div className="detail-photo-placeholder">
                  <span className="photo-icon">
                    {contact.person_type === 'PF' ? '👤' : '🏢'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Info Sections */}
          <div className="detail-sections">
            {/* Basic Info */}
            <section className="detail-section">
              <h3 className="section-title">📋 Informações Básicas</h3>
              <div className="detail-grid">
                <div className="detail-field">
                  <label>Nome</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="edit-input"
                      value={editedContact.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  ) : (
                    <span>{contact.name}</span>
                  )}
                </div>
                <div className="detail-field">
                  <label>Tipo de Contato</label>
                  {isEditing ? (
                    <select
                      className="edit-input"
                      value={editedContact.contact_type || 'CLIENT'}
                      onChange={(e) => handleChange('contact_type', e.target.value)}
                    >
                      <option value="CLIENT">Cliente</option>
                      <option value="OPPOSING">Parte Contrária</option>
                      <option value="WITNESS">Testemunha</option>
                      <option value="LAWYER">Advogado Parceiro</option>
                      <option value="OTHER">Outro</option>
                    </select>
                  ) : (
                    <span className="badge-type">{contact.contact_type_display}</span>
                  )}
                </div>
                <div className="detail-field">
                  <label>Tipo de Pessoa</label>
                  {isEditing ? (
                    <select
                      className="edit-input"
                      value={editedContact.person_type || 'PF'}
                      onChange={(e) => handleChange('person_type', e.target.value)}
                    >
                      <option value="PF">Pessoa Física</option>
                      <option value="PJ">Pessoa Jurídica</option>
                    </select>
                  ) : (
                    <span>{contact.person_type_display}</span>
                  )}
                </div>
                
                {/* Documento: sempre mostra se config ativa OU se tiver valor */}
                {(isEditing || settings.showEmptyFields || contact.document_formatted) && (
                  <div className="detail-field">
                    <label>{currentData.person_type === 'PF' ? 'CPF' : 'CNPJ'}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="edit-input"
                        value={editedContact.document || ''}
                        onChange={(e) => handleChange('document', e.target.value)}
                        placeholder={currentData.person_type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                        maxLength={currentData.person_type === 'PF' ? 14 : 18}
                      />
                    ) : (
                      <span className={!contact.document_formatted ? 'field-empty' : ''}>
                        {contact.document_formatted || 'Não informado ⚠️'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Contact Info: mostra seção se tiver algum dado OU se config ativa ou modo edit */}
            {(isEditing || settings.showEmptyFields || contact.has_contact_info) && (
              <section className="detail-section">
                <h3 className="section-title">📞 Contato</h3>
                <div className="detail-grid">
                  {(isEditing || settings.showEmptyFields || contact.email) && (
                    <div className="detail-field">
                      <label>Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          className="edit-input"
                          value={editedContact.email || ''}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="email@exemplo.com"
                        />
                      ) : (
                        <span className={!contact.email ? 'field-empty' : ''}>
                          {contact.email || 'Não informado'}
                        </span>
                      )}
                    </div>
                  )}
                  {(isEditing || settings.showEmptyFields || contact.phone) && (
                    <div className="detail-field">
                      <label>Telefone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          className="edit-input"
                          value={editedContact.phone || ''}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          placeholder="(11) 3333-4444"
                          maxLength={15}
                        />
                      ) : (
                        <span className={!contact.phone ? 'field-empty' : ''}>
                          {contact.phone || 'Não informado'}
                        </span>
                      )}
                    </div>
                  )}
                  {(isEditing || settings.showEmptyFields || contact.mobile) && (
                    <div className="detail-field">
                      <label>Celular</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          className="edit-input"
                          value={editedContact.mobile || ''}
                          onChange={(e) => handleChange('mobile', e.target.value)}
                          placeholder="(11) 98765-4321"
                          maxLength={15}
                        />
                      ) : (
                        <span className={!contact.mobile ? 'field-empty' : ''}>
                          {contact.mobile || 'Não informado ⚠️'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Address: sempre mostra se config ativa OU se tiver endereço completo ou modo edit */}
            {(isEditing || settings.showEmptyFields || contact.has_complete_address) && (
              <section className="detail-section">
                <h3 className="section-title">📍 Endereço</h3>
                <div className="detail-grid">
                  {(isEditing || settings.showEmptyFields || contact.address_line1) && (
                    <div className="detail-field">
                      <label>Logradouro</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="edit-input"
                          value={editedContact.address_line1 || ''}
                          onChange={(e) => handleChange('address_line1', e.target.value)}
                          placeholder="Rua, Avenida..."
                        />
                      ) : (
                        <span className={!contact.address_line1 ? 'field-empty' : ''}>
                          {contact.address_line1 || 'Não informado'}
                        </span>
                      )}
                    </div>
                  )}
                  {(isEditing || settings.showEmptyFields || contact.address_number) && (
                    <div className="detail-field">
                      <label>Número</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="edit-input"
                          value={editedContact.address_number || ''}
                          onChange={(e) => handleChange('address_number', e.target.value)}
                          placeholder="123"
                        />
                      ) : (
                        <span className={!contact.address_number ? 'field-empty' : ''}>
                          {contact.address_number || 'Não informado'}
                        </span>
                      )}
                    </div>
                  )}
                  {(isEditing || settings.showEmptyFields || contact.complement) && (
                    <div className="detail-field">
                      <label>Complemento</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="edit-input"
                          value={editedContact.complement || ''}
                          onChange={(e) => handleChange('complement', e.target.value)}
                          placeholder="Apto, Sala..."
                        />
                      ) : (
                        <span className={!contact.complement ? 'field-empty' : ''}>
                          {contact.complement || 'Não informado'}
                        </span>
                      )}
                    </div>
                  )}
                  {(isEditing || settings.showEmptyFields || contact.neighborhood) && (
                    <div className="detail-field">
                      <label>Bairro</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="edit-input"
                          value={editedContact.neighborhood || ''}
                          onChange={(e) => handleChange('neighborhood', e.target.value)}
                          placeholder="Bairro"
                        />
                      ) : (
                        <span className={!contact.neighborhood ? 'field-empty' : ''}>
                          {contact.neighborhood || 'Não informado'}
                        </span>
                      )}
                    </div>
                  )}
                  {(isEditing || settings.showEmptyFields || contact.zip_code) && (
                    <div className="detail-field">
                      <label>CEP</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="edit-input"
                          value={editedContact.zip_code || ''}
                          onChange={(e) => handleChange('zip_code', e.target.value)}
                          placeholder="00000-000"
                          maxLength={9}
                        />
                      ) : (
                        <span className={!contact.zip_code ? 'field-empty' : ''}>
                          {contact.zip_code || 'Não informado'}
                        </span>
                      )}
                    </div>
                  )}
                  {(isEditing || settings.showEmptyFields || contact.city) && (
                    <div className="detail-field">
                      <label>Cidade</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="edit-input"
                          value={editedContact.city || ''}
                          onChange={(e) => handleChange('city', e.target.value)}
                          placeholder="São Paulo"
                        />
                      ) : (
                        <span className={!contact.city ? 'field-empty' : ''}>
                          {contact.city || 'Não informado'}
                        </span>
                      )}
                    </div>
                  )}
                  {(isEditing || settings.showEmptyFields || contact.state) && (
                    <div className="detail-field">
                      <label>Estado</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="edit-input"
                          value={editedContact.state || ''}
                          onChange={(e) => handleChange('state', e.target.value)}
                          placeholder="SP"
                          maxLength="2"
                        />
                      ) : (
                        <span className={!contact.state ? 'field-empty' : ''}>
                          {contact.state || 'Não informado'}
                        </span>
                      )}
                    </div>
                  )}
                  {!isEditing && (settings.showEmptyFields || contact.address_oneline) && (
                    <div className="detail-field full-width">
                      <label>Endereço Completo</label>
                      <span className={!contact.address_oneline ? 'field-empty' : ''}>
                        {contact.address_oneline || 'Não informado'}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Notes: mostra se tiver conteúdo OU se config ativa ou modo edit */}
            {(isEditing || settings.showEmptyFields || contact.notes) && (
              <section className="detail-section">
                <h3 className="section-title">📝 Observações</h3>
                {isEditing ? (
                  <textarea
                    className="edit-input edit-textarea"
                    value={editedContact.notes || ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={5}
                    placeholder="Adicione observações sobre este contato..."
                  />
                ) : (
                  <div className={`detail-notes ${!contact.notes ? 'field-empty' : ''}`}>
                    {contact.notes || 'Não informado'}
                  </div>
                )}
              </section>
            )}

            {/* Metadata - only show in VIEW/EDIT mode */}
            {!isCreating && (
              <section className="detail-section detail-metadata">
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <label>Criado em</label>
                    <span>{new Date(contact.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="metadata-item">
                    <label>Atualizado em</label>
                    <span>{new Date(contact.updated_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </section>
            )}

            {/* Action Buttons */}
            <div className="detail-actions">
              {!isEditing && !isCreating ? (
                <>
                  <button className="btn-delete" onClick={() => setShowDeleteConfirm(true)}>
                    🗑️ Excluir
                  </button>
                  <button className="btn-edit" onClick={handleEdit}>
                    ✏️ Editar
                  </button>
                </>
              ) : isEditing && !isCreating ? (
                <>
                  <button className="btn-delete" onClick={() => setShowDeleteConfirm(true)}>
                    🗑️ Excluir
                  </button>
                  <button className="btn-cancel-edit" onClick={handleCancel} disabled={saving}>
                    ❌ Cancelar
                  </button>
                  <button className="btn-save-edit" onClick={handleSave} disabled={saving}>
                    {saving ? '⏳ Salvando...' : '💾 Atualizar Informações'}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-cancel-edit" onClick={handleCancel} disabled={saving}>
                    ❌ Cancelar
                  </button>
                  <button className="btn-save-edit" onClick={handleSave} disabled={saving}>
                    {saving ? '⏳ Salvando...' : '➕ Criar Contato'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>

    {/* Delete Confirmation Modal */}
    <ConfirmDialog
      isOpen={showDeleteConfirm}
      type="danger"
      title="⚠️ Confirmar Exclusão"
      message={`Tem certeza que deseja excluir ${contact?.name}?`}
      warningMessage="Esta ação é irreversível!"
      confirmText={saving ? '⏳ Excluindo...' : '🗑️ Sim, excluir definitivamente'}
      cancelText="✅ Não, manter contato"
      onConfirm={handleDelete}
      onCancel={handleCancelDelete}
      requirePassword={!!settings.deletePassword}
      password={deletePassword}
      onPasswordChange={setDeletePassword}
      passwordError={deleteError}
    />
    </>
  );
}
