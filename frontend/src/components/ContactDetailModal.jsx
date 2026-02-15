// src/components/ContactDetailModal.jsx
import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useSettings } from '../contexts/SettingsContext';
import contactsAPI from '../services/api';
import './ContactDetailModal.css';

export default function ContactDetailModal({ contactId, isOpen, onClose }) {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { settings } = useSettings();

  useEffect(() => {
    if (isOpen && contactId) {
      loadContactDetails();
    }
  }, [isOpen, contactId]);

  const loadContactDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactsAPI.getById(contactId);
      setContact(data);
    } catch (err) {
      setError('Erro ao carregar detalhes do contato');
      console.error('Load contact details error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes do Contato"
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
          {/* Photo Section */}
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

          {/* Info Sections */}
          <div className="detail-sections">
            {/* Basic Info */}
            <section className="detail-section">
              <h3 className="section-title">📋 Informações Básicas</h3>
              <div className="detail-grid">
                <div className="detail-field">
                  <label>Nome</label>
                  <span>{contact.name}</span>
                </div>
                <div className="detail-field">
                  <label>Tipo de Contato</label>
                  <span className="badge-type">{contact.contact_type_display}</span>
                </div>
                <div className="detail-field">
                  <label>Tipo de Pessoa</label>
                  <span>{contact.person_type_display}</span>
                </div>
                
                {/* Documento: sempre mostra se config ativa OU se tiver valor */}
                {(settings.showEmptyFields || contact.document_formatted) && (
                  <div className="detail-field">
                    <label>{contact.person_type === 'PF' ? 'CPF' : 'CNPJ'}</label>
                    <span className={!contact.document_formatted ? 'field-empty' : ''}>
                      {contact.document_formatted || 'Não informado ⚠️'}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Contact Info: mostra seção se tiver algum dado OU se config ativa */}
            {(settings.showEmptyFields || contact.has_contact_info) && (
              <section className="detail-section">
                <h3 className="section-title">📞 Contato</h3>
                <div className="detail-grid">
                  {(settings.showEmptyFields || contact.email) && (
                    <div className="detail-field">
                      <label>Email</label>
                      <span className={!contact.email ? 'field-empty' : ''}>
                        {contact.email || 'Não informado'}
                      </span>
                    </div>
                  )}
                  {(settings.showEmptyFields || contact.phone) && (
                    <div className="detail-field">
                      <label>Telefone</label>
                      <span className={!contact.phone ? 'field-empty' : ''}>
                        {contact.phone || 'Não informado'}
                      </span>
                    </div>
                  )}
                  {(settings.showEmptyFields || contact.mobile) && (
                    <div className="detail-field">
                      <: sempre mostra se config ativa OU se tiver endereço completo */}
            {(settings.showEmptyFields || contact.has_complete_address) && (
              <section className="detail-section">
                <h3 className="section-title">📍 Endereço</h3>
                <div className="detail-grid">
                  {(settings.showEmptyFields || contact.address_oneline) && (
                    <div className="detail-field full-width">
                      <label>Endereço Completo</label>
                      <span className={!contact.address_oneline ? 'field-empty' : ''}>
                        {contact.address_oneline || 'Não informado'}
                      </span>
                    </div>
                  )}
                  {(settings.showEmptyFields || contact.zip_code) && (
                    <div className="detail-field">
                      <label>CEP</label>
                      <span className={!contact.zip_code ? 'field-empty' : ''}>
                        {contact.zip_code || 'Não informado'}
                      </span>
                    </div>
                  )}
                  {(settings.showEmptyFields || contact.city) && (
                    <div className="detail-field">
                      <label>Cidade</label>
                      <span className={!contact.city ? 'field-empty' : ''}>
                        {contact.city || 'Não informado'}
                      </span>
                    </div>
                  )}
                  {(settings.showEmptyFields || contact.state) && (
                    <div className="detail-field">
                      <label>Estado</label>
                      <span className={!contact.state ? 'field-empty' : ''}>
                        {contact.state || 'Não informado'}
                      
                  {contact.city && (
                    <div className="detail-field">
                      <label>Cidade</label>
                      <span>{contact.city}</span>
                    </div>
                  )}
                  {contact.state && (
                    <div className="detail-field">
                      <label>Estado</label>
                      <span>{contact.state}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Notes */}
            {contact.notes && (
              <section className="detail-section">
                <h3 className="section-title">📝 Observações</h3>
                <div className="detail-notes">
                  {contact.notes}
                </div>
              </section>
            )}

            {/* Metadata */}
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
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
