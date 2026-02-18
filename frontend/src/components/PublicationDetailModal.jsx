import { useEffect } from 'react';
import { generateAllConsultaLinks } from '../utils/consultaLinksHelper';
import './PublicationDetailModal.css';

export default function PublicationDetailModal({ publication, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleConsultarProcesso = (e, url) => {
    e.preventDefault();
    // Copiar automaticamente o número do processo
    if (publication.numero_processo) {
      navigator.clipboard.writeText(publication.numero_processo).then(() => {
        // Mostrar feedback visual no botão
        const btn = e.currentTarget;
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '✅ Copiado! Abrindo...';
        
        // Abrir link
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        
        // Restaurar texto original
        setTimeout(() => {
          btn.innerHTML = originalHTML;
        }, 2000);
      }).catch(err => {
        console.error('Erro ao copiar:', err);
        // Mesmo com erro, abre o link
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      });
    } else if (url) {
      // Se não tem número, só abre o link
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyProcesso = (e) => {
    e.preventDefault();
    if (publication.numero_processo) {
      navigator.clipboard.writeText(publication.numero_processo).then(() => {
        // Feedback visual temporário
        const btn = e.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.classList.remove('copied');
        }, 2000);
      });
    }
  };

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
  
  // Obter todos os links de consulta disponíveis
  const consultaLinks = generateAllConsultaLinks(publication);

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
                {publication.numero_processo && (
                  <button 
                    className="btn-copy-processo-modal"
                    onClick={handleCopyProcesso}
                    title="Copiar número do processo"
                  >
                    📋
                  </button>
                )}
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
          <div className="modal-actions">
            {/* Link oficial (ESAJ ou principal) */}
            {consultaLinks.linkOficial && (
              <button 
                className="btn btn-primary-link"
                onClick={(e) => handleConsultarProcesso(e, consultaLinks.linkOficial)}
                title="Copia o número e abre o portal do tribunal"
              >
                🔍 {publication.tribunal || 'Consultar'}
              </button>
            )}
            
            {/* Links alternativos (eProc, TRF3, TRT15, etc.) */}
            {consultaLinks.linksAlternativos.map((system, index) => (
              <button 
                key={index}
                className="btn btn-alternative-link"
                onClick={(e) => handleConsultarProcesso(e, system.url)}
                title={system.description}
              >
                {system.icon} {system.shortName}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
