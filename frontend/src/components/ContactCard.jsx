// src/components/ContactCard.jsx
import './ContactCard.css';

export default function ContactCard({ contact }) {
  const {
    name,
    contact_type_display,
    person_type,
    document_formatted,
    primary_contact,
    photo_thumbnail,
  } = contact;

  // Ícone padrão: 👤 PF, 🏢 PJ
  const defaultIcon = person_type === 'PF' ? '👤' : '🏢';

  return (
    <div className="contact-card">
      {/* Photo/Icon */}
      <div className="contact-avatar">
        {photo_thumbnail ? (
          <img src={photo_thumbnail} alt={name} />
        ) : (
          <span className="avatar-icon">{defaultIcon}</span>
        )}
      </div>

      {/* Info */}
      <div className="contact-info">
        <div className="contact-header">
          <span className="contact-name">{name}</span>
          <span className="contact-type">{contact_type_display}</span>
        </div>
        <div className="contact-details">
          {document_formatted && (
            <div className="contact-detail">
              <span className="detail-label">
                {person_type === 'PF' ? 'CPF' : 'CNPJ'}:
              </span>
              <span className="detail-value">{document_formatted}</span>
            </div>
          )}
          {primary_contact && (
            <div className="contact-detail">
              <span className="detail-icon">📱</span>
              <span className="detail-value">{primary_contact}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="contact-actions">
        <button className="btn-view" title="Ver detalhes">
          👁️
        </button>
      </div>
    </div>
  );
}
