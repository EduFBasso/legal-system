// src/components/SelectContactModal.jsx
import { useState, useEffect, useCallback } from 'react';
import ContactCard from './ContactCard';
import { getAllContacts } from '@/services/contactsService';
import './SelectContactModal.css';

export default function SelectContactModal({ 
  isOpen, 
  onClose, 
  onSelectContact, 
  onCreateNew,
  existingPartyContactIds = [] // Array of contact IDs already linked to this case
}) {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState(null);

  // Load contacts on mount or search change
  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = searchTerm ? { search: searchTerm } : {};
      const data = await getAllContacts(params);
      setContacts(data);
    } catch (err) {
      const isUnauthorized = err?.status === 401;
      setError(isUnauthorized
        ? 'Sessão expirada. Faça login novamente para carregar os contatos.'
        : 'Erro ao carregar contatos');
      console.error('Load contacts error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      loadContacts();
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen, loadContacts]);

  const handleSelectContact = (contactId) => {
    // Check if contact is already linked to this case
    if (existingPartyContactIds.includes(contactId)) {
      return; // Prevent selection
    }
    // Just highlight the card
    setSelectedContactId(contactId);
  };

  const handleConfirmSelection = () => {
    if (!selectedContactId) return;
    
    const selectedContact = contacts.find(c => c.id === selectedContactId);
    if (selectedContact) {
      onSelectContact(selectedContact);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="modal-content select-contact-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Selecionar Contato</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Search Input */}
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Buscar por nome, CPF/CNPJ, telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          {/* Contact List */}
          <div className="contacts-list">
            {error ? (
              <div className="contacts-error">
                <p>❌ {error}</p>
                <button onClick={loadContacts} className="btn-retry">
                  🔄 Tentar Novamente
                </button>
              </div>
            ) : loading ? (
              <div className="contacts-loading">
                <p>Carregando contatos...</p>
              </div>
            ) : contacts.length === 0 && !searchTerm ? (
              <div className="contacts-empty">
                <p>📋 Nenhum contato cadastrado ainda.</p>
                <p>Clique em "Criar Novo Contato" abaixo.</p>
              </div>
            ) : contacts.length === 0 && searchTerm ? (
              <div className="contacts-empty">
                <p>🔍 Nenhum resultado para "{searchTerm}"</p>
                <p>Tente buscar por outro termo ou crie um novo contato.</p>
              </div>
            ) : (
              contacts.map(contact => {
                const isAlreadyLinked = existingPartyContactIds.includes(contact.id);
                return (
                  <div
                    key={contact.id}
                    className={isAlreadyLinked ? 'contact-card-disabled-wrapper' : ''}
                    title={isAlreadyLinked ? 'Este contato já está vinculado a este processo. Edite o papel acima.' : undefined}
                  >
                    <ContactCard 
                      contact={contact}
                      isSelected={selectedContactId === contact.id && !isAlreadyLinked}
                      onSelect={() => handleSelectContact(contact.id)}
                      onView={null} // Hide view button in selection mode
                      onLinkToCase={null} // Hide link button
                    />
                    {isAlreadyLinked && (
                      <div className="already-linked-badge">
                        ⚠️ Já vinculado - Edite o papel
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn-secondary" 
            onClick={onCreateNew}
          >
            ➕ Criar Novo Contato
          </button>
          
          <div className="footer-actions">
            <button 
              className="btn-cancel" 
              onClick={onClose}
            >
              Cancelar
            </button>
            <button 
              className="btn-primary" 
              onClick={handleConfirmSelection}
              disabled={!selectedContactId}
            >
              Selecionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
