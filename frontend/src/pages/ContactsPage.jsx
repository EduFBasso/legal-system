// src/pages/ContactsPage.jsx
import { useState, useEffect } from 'react';
import ContactCard from '../components/ContactCard';
import ContactDetailModal from '../components/ContactDetailModal';
import contactsAPI from '../services/api';
import './ContactsPage.css';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load all contacts on mount
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactsAPI.getAll();
      setContacts(data);
    } catch (err) {
      setError('Erro ao carregar contatos. Verifique se o backend está rodando.');
      console.error('Load contacts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewContact = (contactId) => {
    setSelectedContactId(contactId);
    setIsModalOpen(true);
  };

  const handleNewContact = () => {
    setSelectedContactId(null); // null = CREATE mode
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContactId(null);
  };

  const handleContactUpdated = (savedContact, wasCreating, wasDeleted) => {
    if (wasDeleted) {
      // Remove deleted contact from list
      setContacts(prevContacts =>
        prevContacts.filter(c => c.id !== selectedContactId)
      );
    } else if (wasCreating) {
      // Add new contact to list
      setContacts(prevContacts => [savedContact, ...prevContacts]);
    } else {
      // Update existing contact in list
      setContacts(prevContacts =>
        prevContacts.map(c => c.id === savedContact.id ? savedContact : c)
      );
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="contacts-page">
      {/* Search Bar + New Button */}
      <div className="contacts-header">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Filtrar contatos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-new-contact" onClick={handleNewContact}>
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
        ) : contacts.length === 0 ? (
          <div className="contacts-empty">
            <p>📋 Nenhum contato cadastrado ainda.</p>
            <p>Clique em "Novo Contato" para começar.</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="contacts-empty">
            <p>🔍 Nenhum contato encontrado para "{searchTerm}"</p>
          </div>
        ) : (
          filteredContacts.map(contact => (
            <ContactCard 
              key={contact.id} 
              contact={contact}
              onView={() => handleViewContact(contact.id)}
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
      />
    </div>
  );
}
