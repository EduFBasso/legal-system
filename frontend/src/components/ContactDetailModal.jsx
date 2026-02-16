// src/components/ContactDetailModal.jsx
import { useEffect, useState } from 'react';
import Modal from './Modal';
import ConfirmDialog from './common/ConfirmDialog';
import { FormField, FormSelect, FormMaskedField, AddressFieldGroup } from './common';
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
          trading_name: '',
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
      trading_name: contactData.trading_name || '',
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
        trading_name: editedContact.trading_name?.trim() || '',
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

      console.log('📤 Sending to backend:', JSON.stringify(dataToSend, null, 2));

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
                <FormField
                  label="Nome"
                  value={isEditing ? editedContact.name : contact.name}
                  onChange={(value) => handleChange('name', value)}
                  readOnly={!isEditing}
                  required
                />
                
                {/* Nome Fantasia: apenas para PJ */}
                {(currentData.person_type === 'PJ') && (
                  <FormField
                    label="Nome Fantasia"
                    value={isEditing ? (editedContact.trading_name || '') : (contact?.trading_name || '')}
                    onChange={(value) => handleChange('trading_name', value)}
                    readOnly={!isEditing}
                    emptyText="Não informado"
                  />
                )}
                
                <FormSelect
                  label="Tipo de Contato"
                  value={isEditing ? (editedContact.contact_type || 'CLIENT') : contact.contact_type}
                  onChange={(value) => handleChange('contact_type', value)}
                  options={[
                    { value: 'CLIENT', label: 'Cliente' },
                    { value: 'OPPOSING', label: 'Parte Contrária' },
                    { value: 'WITNESS', label: 'Testemunha' },
                    { value: 'LAWYER', label: 'Advogado Parceiro' },
                    { value: 'OTHER', label: 'Outro' },
                  ]}
                  readOnly={!isEditing}
                  displayValue={contact?.contact_type_display}
                />
                
                <FormSelect
                  label="Tipo de Pessoa"
                  value={isEditing ? (editedContact.person_type || 'PF') : contact.person_type}
                  onChange={(value) => handleChange('person_type', value)}
                  options={[
                    { value: 'PF', label: 'Pessoa Física' },
                    { value: 'PJ', label: 'Pessoa Jurídica' },
                  ]}
                  readOnly={!isEditing}
                  displayValue={contact?.person_type_display}
                />
                
                {/* Documento: sempre mostra se config ativa OU se tiver valor */}
                {(isEditing || settings.showEmptyFields || contact?.document_formatted) && (
                  <FormMaskedField
                    label={currentData.person_type === 'PF' ? 'CPF' : 'CNPJ'}
                    value={isEditing ? editedContact.document : (contact?.document_formatted || '')}
                    onChange={(value) => handleChange('document', value)}
                    mask={(value) => maskDocument(value, currentData.person_type)}
                    readOnly={!isEditing}
                    placeholder={currentData.person_type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                    maxLength={currentData.person_type === 'PF' ? 14 : 18}
                    emptyText="Não informado ⚠️"
                  />
                )}
              </div>
            </section>

            {/* Contact Info: mostra seção se tiver algum dado OU se config ativa ou modo edit */}
            {(isEditing || settings.showEmptyFields || contact?.has_contact_info) && (
              <section className="detail-section">
                <h3 className="section-title">📞 Contato</h3>
                <div className="detail-grid">
                  {(isEditing || settings.showEmptyFields || contact?.email) && (
                    <FormField
                      label="Email"
                      value={isEditing ? editedContact.email : (contact?.email || '')}
                      onChange={(value) => handleChange('email', value)}
                      type="email"
                      readOnly={!isEditing}
                      placeholder="email@exemplo.com"
                    />
                  )}
                  
                  {(isEditing || settings.showEmptyFields || contact?.phone) && (
                    <FormMaskedField
                      label="Telefone"
                      value={isEditing ? editedContact.phone : (contact?.phone_formatted || '')}
                      onChange={(value) => handleChange('phone', value)}
                      mask={maskPhone}
                      readOnly={!isEditing}
                      placeholder="(11) 3333-4444"
                      maxLength={15}
                    />
                  )}
                  
                  {(isEditing || settings.showEmptyFields || contact?.mobile) && (
                    <FormMaskedField
                      label="Celular"
                      value={isEditing ? editedContact.mobile : (contact?.mobile_formatted || '')}
                      onChange={(value) => handleChange('mobile', value)}
                      mask={maskPhone}
                      readOnly={!isEditing}
                      placeholder="(11) 98765-4321"
                      maxLength={15}
                      emptyText="Não informado ⚠️"
                    />
                  )}
                </div>
              </section>
            )}

            {/* Address: sempre mostra se config ativa OU se tiver endereço completo ou modo edit */}
            {(isEditing || settings.showEmptyFields || contact?.has_complete_address) && (
              <section className="detail-section">
                <h3 className="section-title">📍 Endereço</h3>
                
                {/* VIEW mode com endereço completo: mostra apenas endereço formatado */}
                {!isEditing && contact?.address_oneline && !settings.showEmptyFields ? (
                  <div className="detail-field full-width">
                    <label className="form-field-label">Endereço Completo</label>
                    <span className="form-field-value">
                      {contact.address_oneline}
                    </span>
                  </div>
                ) : (
                  /* EDIT mode ou showEmptyFields: mostra campos individuais */
                  <>
                    <AddressFieldGroup
                      address={isEditing ? editedContact : {
                        zip_code: contact?.zip_code || '',
                        address_line1: contact?.street || '',
                        address_number: contact?.number || '',
                        complement: contact?.complement || '',
                        neighborhood: contact?.neighborhood || '',
                        city: contact?.city || '',
                        state: contact?.state || '',
                      }}
                      onChange={handleChange}
                      readOnly={!isEditing}
                      showEmptyFields={settings.showEmptyFields}
                    />
                    
                    {/* Mostra endereço completo também quando em modo VIEW com showEmptyFields */}
                    {!isEditing && settings.showEmptyFields && contact?.address_oneline && (
                      <div className="detail-field full-width" style={{ marginTop: '16px' }}>
                        <label className="form-field-label">Endereço Completo</label>
                        <span className="form-field-value">
                          {contact.address_oneline}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {/* Notes: mostra se tiver conteúdo OU se config ativa ou modo edit */}
            {(isEditing || settings.showEmptyFields || contact?.notes) && (
              <section className="detail-section">
                <h3 className="section-title">📝 Observações</h3>
                <FormField
                  label=""
                  value={isEditing ? editedContact.notes : (contact?.notes || '')}
                  onChange={(value) => handleChange('notes', value)}
                  type="textarea"
                  readOnly={!isEditing}
                  placeholder="Adicione observações sobre este contato..."
                  rows={5}
                  className="notes-field"
                />
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
