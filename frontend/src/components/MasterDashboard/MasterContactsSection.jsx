import ContactCard from '../ContactCard';

export default function MasterContactsSection({
  selectedLawyer,
  contactsSearch,
  onContactsSearchChange,
  contactsError,
  contactsLoading,
  contacts,
  selectedContactId,
  onSelectContact,
  onViewContact,
  onCreateTask,
}) {
  return (
    <section className="master-admin-contacts-section" aria-label="Contatos (somente leitura)">
      <div className="master-admin-contacts-header">
        <div>
          <h2 className="master-admin-contacts-title">Contatos</h2>
          <p className="master-admin-contacts-subtitle">Espelho read-only da página de contatos com filtro local.</p>
        </div>
        <div className="master-admin-contacts-search-wrap">
          <span className="master-admin-contacts-search-icon">🔍</span>
          <input
            type="text"
            className="master-admin-contacts-search"
            placeholder="Buscar contato..."
            value={contactsSearch}
            onChange={onContactsSearchChange}
          />
        </div>
      </div>

      <div className="master-admin-contacts-readonly">
        {!selectedLawyer ? (
          <div className="master-admin-contacts-feedback">Selecione um Advogado para visualizar os contatos.</div>
        ) : contactsError ? (
          <div className="master-admin-contacts-feedback master-admin-contacts-feedback--error">{contactsError}</div>
        ) : contactsLoading ? (
          <div className="master-admin-contacts-feedback">Carregando contatos...</div>
        ) : contacts.length === 0 ? (
          <div className="master-admin-contacts-feedback">Nenhum contato encontrado para o filtro aplicado.</div>
        ) : (
          contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              readOnly={true}
              allowViewInReadOnly={true}
              isSelected={selectedContactId === contact.id}
              onSelect={() => onSelectContact(contact.id)}
              onView={() => onViewContact(contact.id)}
              onCreateTask={onCreateTask}
              onLinkToCase={undefined}
            />
          ))
        )}
      </div>
    </section>
  );
}
