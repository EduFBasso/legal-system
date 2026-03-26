// src/components/MasterContactDetailsModal.jsx
import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import contactsAPI from '../services/api';

export default function MasterContactDetailsModal({ contactId, teamMemberId, isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contact, setContact] = useState(null);

  const scopeParams = useMemo(() => {
    if (!teamMemberId) return {};
    return { team_member_id: teamMemberId };
  }, [teamMemberId]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!isOpen) return;
      if (!contactId) {
        setContact(null);
        setError('');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await contactsAPI.getById(contactId, scopeParams);
        if (!mounted) return;
        setContact(data || null);
      } catch {
        if (!mounted) return;
        setContact(null);
        setError('Não foi possível carregar os detalhes deste contato agora.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [contactId, isOpen, scopeParams]);

  if (!isOpen) return null;

  const titleName = contact?.name ? `: ${contact.name}` : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalhes do Contato (somente leitura)${titleName}`}
      size="large"
    >
      {loading ? (
        <div className="detail-loading">
          <p>Carregando...</p>
        </div>
      ) : error ? (
        <div className="detail-error">
          <p>❌ {error}</p>
        </div>
      ) : !contact ? (
        <div>
          <p>Contato não encontrado.</p>
        </div>
      ) : (
        <div className="contact-detail-content">
          <section className="detail-section">
            <h3 className="section-title">📋 Informações Básicas</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Nome</label>
                <p>{contact.name || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Tipo</label>
                <p>{contact.person_type_display || (contact.person_type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física')}</p>
              </div>
              <div className="detail-item">
                <label>Documento</label>
                <p>{contact.document_formatted || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Email</label>
                <p>{contact.email || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Telefone</label>
                <p>{contact.phone_formatted || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Celular</label>
                <p>{contact.mobile_formatted || '—'}</p>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <h3 className="section-title">📍 Endereço</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>CEP</label>
                <p>{contact.zip_code_formatted || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Logradouro</label>
                <p>{contact.street || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Número</label>
                <p>{contact.number || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Complemento</label>
                <p>{contact.complement || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Bairro</label>
                <p>{contact.neighborhood || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Cidade/UF</label>
                <p>
                  {(contact.city || '—')}{contact.state ? `/${contact.state}` : ''}
                </p>
              </div>
              <div className="detail-item">
                <label>Endereço completo</label>
                <p>{contact.address_oneline || '—'}</p>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <h3 className="section-title">📝 Observações</h3>
            <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{contact.notes || '—'}</p>
          </section>

          <section className="detail-section">
            <h3 className="section-title">📄 Processos vinculados</h3>
            {!contact.linked_cases || contact.linked_cases.length === 0 ? (
              <p>—</p>
            ) : (
              <ul>
                {contact.linked_cases.map((lc) => (
                  <li key={lc.id}>
                    <strong>{lc.numero_processo}</strong>
                    {lc.role_display ? ` — ${lc.role_display}` : ''}
                    {lc.is_client ? ' (Cliente)' : ''}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}
