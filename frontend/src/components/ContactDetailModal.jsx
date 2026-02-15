// src/components/ContactDetailModal.jsx
import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useSettings } from '../contexts/SettingsContext';
import contactsAPI from '../services/api';
import './ContactDetailModal.css';

export default function ContactDetailModal({ contactId, isOpen, onClose, onContactUpdated }) {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState(null);
  const [saving, setSaving] = useState(false);
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
          contact_type: 'CL',
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

  const loadContactDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactsAPI.getById(contactId);
      setContact(data);
      setEditedContact(data); // Initialize edit data
    } catch (err) {
      setError('Erro ao carregar detalhes do contato');
      console.error('Load contact details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditedContact({ ...contact }); // Copy current data
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
    setEditedContact(prev => ({
      ...prev,
      [field]: value
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

      // Prepare data for API (only send editable fields)
      const dataToSend = {
        name: editedContact.name.trim(),
        person_type: editedContact.person_type,
        contact_type: editedContact.contact_type,
        document: editedContact.document || '',
        email: editedContact.email || '',
        phone: editedContact.phone || '',
        mobile: editedContact.mobile || '',
        address_line1: editedContact.address_line1 || '',
        address_number: editedContact.address_number || '',
        complement: editedContact.complement || '',
        neighborhood: editedContact.neighborhood || '',
        city: editedContact.city || '',
        state: editedContact.state || '',
        zip_code: editedContact.zip_code || '',
        notes: editedContact.notes || '',
      };

      let savedContact;
      if (isCreating) {
        // CREATE: POST /api/contacts/
        savedContact = await contactsAPI.create(dataToSend);
      } else {
        // UPDATE: PUT /api/contacts/{id}/
        savedContact = await contactsAPI.update(contactId, dataToSend);
      }

      setContact(savedContact);
      setEditedContact(savedContact);
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

  if (!isOpen) return null;

  const currentData = isEditing ? editedContact : contact;

  // Helper to render field (view or edit mode)
  const renderField = (label, field, type = 'text', options = {}) => {
    const value = currentData?.[field] || '';
    const isEmpty = !value;

    if (!isEditing) {
      // View mode
      if (!settings.showEmptyFields && isEmpty && !options.alwaysShow) {
        return null;
      }
      return (
        <div className="detail-field" key={field}>
          <label>{label}</label>
          <span className={isEmpty ? 'field-empty' : ''}>
            {value || 'Não informado' + (options.critical ? ' ⚠️' : '')}
          </span>
        </div>
      );
    } else {
      // Edit mode
      if (type === 'textarea') {
        return (
          <div className="detail-field full-width" key={field}>
            <label>{label}</label>
            <textarea
              className="edit-input"
              value={value}
              onChange={(e) => handleChange(field, e.target.value)}
              rows={4}
            />
          </div>
        );
      } else if (type === 'select') {
        return (
          <div className="detail-field" key={field}>
            <label>{label}</label>
            <select
              className="edit-input"
              value={value}
              onChange={(e) => handleChange(field, e.target.value)}
            >
              {options.choices?.map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        );
      } else {
        return (
          <div className="detail-field" key={field}>
            <label>{label}</label>
            <input
              type={type}
              className="edit-input"
              value={value}
              onChange={(e) => handleChange(field, e.target.value)}
              placeholder={options.placeholder || ''}
            />
          </div>
        );
      }
    }
  };

  return (
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
                      value={editedContact.contact_type || 'CL'}
                      onChange={(e) => handleChange('contact_type', e.target.value)}
                    >
                      <option value="CL">Cliente</option>
                      <option value="AD">Adversário</option>
                      <option value="PA">Parceiro</option>
                      <option value="TE">Testemunha</option>
                      <option value="JU">Juiz</option>
                      <option value="PR">Promotor</option>
                      <option value="PE">Perito</option>
                      <option value="OF">Oficial de Justiça</option>
                      <option value="OU">Outro</option>
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
                        placeholder="Digite o documento"
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
                          placeholder="12345-678"
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
              {!isEditing ? (
                <button className="btn-edit" onClick={handleEdit}>
                  ✏️ Editar
                </button>
              ) : (
                <>
                  <button className="btn-cancel-edit" onClick={handleCancel} disabled={saving}>
                    ❌ Cancelar
                  </button>
                  <button className="btn-save-edit" onClick={handleSave} disabled={saving}>
                    {saving 
                      ? '⏳ Salvando...' 
                      : isCreating 
                        ? '➕ Criar Contato'
                        : '💾 Atualizar Informações'
                    }
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
