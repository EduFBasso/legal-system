// src/components/ContactCard.jsx
import './ContactCard.css';

export default function ContactCard({ contact, onView }) {
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

  // Helper: Extract only digits from phone number for links
  const getPhoneDigits = (phoneStr) => {
    if (!phoneStr) return '';
    return phoneStr.replace(/\D/g, ''); // Remove non-digits
  };

  // Check if primary_contact is a phone number (has digits)
  const isPhone = primary_contact && /\d/.test(primary_contact);
  const phoneDigits = isPhone ? getPhoneDigits(primary_contact) : '';
  
  // WhatsApp link with Brazilian country code (55)
  const whatsappLink = phoneDigits ? `https://wa.me/55${phoneDigits}` : null;
  const telLink = phoneDigits ? `tel:+55${phoneDigits}` : null;

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
              {isPhone ? (
                <>
                  {/* Phone number label and value */}
                  <span className="detail-label">TEL:</span>
                  <span className="detail-value">{primary_contact}</span>
                  {/* Phone call icon */}
                  <a 
                    href={telLink} 
                    className="contact-action-icon"
                    title="Ligar"
                    onClick={(e) => e.stopPropagation()}
                  >
                    📞
                  </a>
                  {/* WhatsApp icon with green background */}
                  <a 
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-action-icon whatsapp-icon"
                    title="WhatsApp"
                    onClick={(e) => e.stopPropagation()}
                  >
                    W
                  </a>
                </>
              ) : (
                /* Email - just show icon and value */
                <>
                  <span className="detail-icon">📧</span>
                  <span className="detail-value">{primary_contact}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="contact-actions">
        <button 
          className="btn-view" 
          title="Ver detalhes"
          onClick={onView}
        >
          👁️
        </button>
      </div>
    </div>
  );
}
