// src/components/ContactCard.jsx
import './ContactCard.css';

export default function ContactCard({ contact, onView, isSelected }) {
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

  // SVG Icons
  const PhoneIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" fill="currentColor"/>
    </svg>
  );

  const WhatsAppIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="currentColor"/>
    </svg>
  );

  return (
    <div 
      className={`contact-card${isSelected ? ' selected' : ''}`}
      onClick={onView}
    >
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
              <span className="detail-text">
                {person_type === 'PF' ? 'CPF' : 'CNPJ'}: {document_formatted}
              </span>
            </div>
          )}
          {primary_contact && (
            <div className="contact-detail">
              {isPhone ? (
                <>
                  {/* Phone number label and value */}
                  <span className="detail-text">TEL: {primary_contact}</span>
                  {/* Phone call icon */}
                  <a 
                    href={telLink} 
                    className="contact-action-icon"
                    title="Ligar"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PhoneIcon />
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
                    <WhatsAppIcon />
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
          title="Gerenciar contato"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
        >
          ✏️
        </button>
      </div>
    </div>
  );
}
