// src/pages/ContactsPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ContactCard from '../components/ContactCard';
import ContactDetailModal from '../components/ContactDetailModal';
import Toast from '../components/common/Toast';
import contactsAPI from '../services/api';
import './ContactsPage.css';

export default function ContactsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasRunSearchEffectRef = useRef(false);
  
  // Modal state
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const openCasesForLinking = (contact) => {
    if (!contact?.id) return;
    navigate(`/cases?action=link&contactId=${contact.id}`);
  };


  // Helper to show toast
  const displayToast = (message, type = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Load all contacts on mount
  useEffect(() => {
    loadContacts();
  }, []);

  // Search effect with debounce
  useEffect(() => {
    // Evita disparar loadContacts 2x no mount:
    // - 1x no useEffect de mount
    // - 1x aqui (debounce) mesmo com searchTerm vazio
    if (!hasRunSearchEffectRef.current) {
      hasRunSearchEffectRef.current = true;
      return;
    }

    const timer = setTimeout(() => {
      loadContacts();
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Auto-reload contacts when user returns from linking in another tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User came back to this tab, reload contacts to get updated linked_cases
        loadContacts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-open modal if "open" query param is present
  useEffect(() => {
    const contactIdToOpen = searchParams.get('open');
    if (contactIdToOpen && contacts.length > 0) {
      const contactId = parseInt(contactIdToOpen, 10);
      // Check if contact exists in the list
      const contactExists = contacts.some(c => c.id === contactId);
      if (contactExists) {
        setSelectedContactId(contactId);
        setIsModalOpen(true);
        // Remove query param after opening
        setSearchParams({});
      }
    }
  }, [searchParams, contacts, setSearchParams]);

  // Focus/select contact card if "focus" query param is present (without opening modal)
  useEffect(() => {
    const contactIdToFocus = searchParams.get('focus');
    if (!contactIdToFocus || contacts.length === 0) return;

    const contactId = parseInt(contactIdToFocus, 10);
    const contactExists = contacts.some(c => c.id === contactId);
    if (!contactExists) return;

    setSelectedContactId(contactId);

    setTimeout(() => {
      const element = document.getElementById(`contact-card-${contactId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    const params = new URLSearchParams(searchParams);
    params.delete('focus');
    setSearchParams(params);
  }, [searchParams, contacts, setSearchParams]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      // Pass search parameter to backend
      const params = searchTerm ? { search: searchTerm } : {};
      const data = await contactsAPI.getAll(params);
      setContacts(data);
    } catch (err) {
      if (err?.status === 401) {
        setError('Sessão expirada. Faça login novamente para carregar os contatos.');
      } else {
        setError('Erro ao carregar contatos. Verifique se o backend está rodando.');
      }
      console.error('Load contacts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewContact = (contactId) => {
    setSelectedContactId(contactId);
    setIsModalOpen(true);
  };

  const handleSelectContact = (contactId) => {
    // Apenas seleciona o cartão, não abre modal
    setSelectedContactId(contactId);
  };

  const handleNewContact = () => {
    setSelectedContactId(null); // null = CREATE mode
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // NÃO limpar selectedContactId aqui - manter seleção visual
  };

  const handleContactUpdated = (savedContact, wasCreating, wasDeleted) => {
    if (wasDeleted) {
      // Remove deleted contact from list
      setContacts(prevContacts =>
        prevContacts.filter(c => c.id !== selectedContactId)
      );
      setSelectedContactId(null); // Limpar seleção após deletar
      displayToast('🗑️ Contato excluído com sucesso', 'success');
    } else if (wasCreating) {
      // Add new contact to list
      setContacts(prevContacts => [savedContact, ...prevContacts]);
      displayToast('✅ Contato criado com sucesso!', 'success');
    } else {
      // Update existing contact in list
      setContacts(prevContacts =>
        prevContacts.map(c => c.id === savedContact.id ? savedContact : c)
      );
      displayToast('✅ Alterações salvas!', 'success');
    }
  };

  const handleLinkToCase = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      openCasesForLinking(contact);
    }
  };

  return (
    <div className="contacts-page">
      {/* Search Bar + New Button */}
      <div className="contacts-header">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nome, CPF/CNPJ, telefone ou processo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="contacts-btn-new" onClick={handleNewContact}>
          + Novo Contato
        </button>
      </div>

      {/* Contacts List */}
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
            <p>Clique em "Novo Contato" para começar.</p>
          </div>
        ) : contacts.length === 0 && searchTerm ? (
          <div className="contacts-empty">
            <p>🔍 Nenhum resultado para "{searchTerm}"</p>
            <p>Tente buscar por nome, CPF/CNPJ, telefone ou número de processo</p>
          </div>
        ) : (
          contacts.map(contact => (
            <ContactCard 
              key={contact.id} 
              contact={contact}
              isSelected={selectedContactId === contact.id}
              onSelect={() => handleSelectContact(contact.id)}
              onView={() => handleViewContact(contact.id)}
              onLinkToCase={() => handleLinkToCase(contact.id)}
            />
          ))
        )}
      </div>

      {/* Detail Modal */}
      <ContactDetailModal
        contactId={selectedContactId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onContactUpdated={handleContactUpdated}
        onLinkToCase={(contact) => {
          openCasesForLinking(contact);
        }}
        allowModification={
          // Permite edição em 3 casos:
          // 1. Criando novo contato (sem selectedContactId)
          // 2. Contato sem vínculos (linked_cases vazio)
          // 3. Contato que é cliente em algum processo
          !selectedContactId || (() => {
            const contact = contacts.find(c => c.id === selectedContactId);
            if (!contact) return true;
            
            // Se não tem vínculos, pode editar
            if (!contact.linked_cases || contact.linked_cases.length === 0) {
              return true;
            }
            
            // Se tem vínculos, só pode editar se for cliente
            return contact.is_client_anywhere === true;
          })()
        }
      />
      
      {/* Toast Notifications */}
      <Toast
        isOpen={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
        autoCloseMs={3000}
      />
    </div>
  );
}
