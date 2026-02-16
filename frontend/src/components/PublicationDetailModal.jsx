import { useEffect } from 'react';
import './PublicationDetailModal.css';

export default function PublicationDetailModal({ publication, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getTipoBadgeColor = (tipo) => {
    const colors = {
      'Intimação': 'blue',
      'Citação': 'green',
      'Edital': 'orange',
      'Sentença': 'purple',
    };
    return colors[tipo] || 'gray';
  };

  // Detecta se o texto contém HTML
  const isHTML = (text) => {
    if (!text) return false;
    return /<[^>]+>/.test(text);
  };

  // Limpa e sanitiza HTML básico (remove scripts)
  const sanitizeHTML = (html) => {
    if (!html) return '';
    // Remove scripts por segurança
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  const texto = publication.texto_completo || publication.texto_resumo || 'Texto não disponível';
  const isHTMLContent = isHTML(texto);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content publication-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">Detalhes da Publicação</h2>
            <div className="modal-badges">
              <span className={`badge badge-${getTipoBadgeColor(publication.tipo_comunicacao)}`}>
                {publication.tipo_comunicacao}
              </span>
              <span className="badge badge-gray">{publication.tribunal}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <div className="detail-row">
              <span className="detail-label">Processo:</span>
              <span className="detail-value processo-number">
                {publication.numero_processo || 'N/A'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Data de Disponibilização:</span>
              <span className="detail-value">{formatDate(publication.data_disponibilizacao)}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Órgão:</span>
              <span className="detail-value">{publication.orgao}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Meio:</span>
              <span className="detail-value">{publication.meio === 'D' ? 'Digital' : 'Físico'}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Texto Completo</h3>
            {isHTMLContent ? (
              <div 
                className="texto-completo html-content"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(texto) }}
              />
            ) : (
              <div className="texto-completo">
                {texto}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
