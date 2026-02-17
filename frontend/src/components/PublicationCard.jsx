import './PublicationCard.css';

export default function PublicationCard({ publication, onClick }) {
  const getTipoBadgeColor = (tipo) => {
    const colors = {
      'Intimação': 'blue',
      'Citação': 'green',
      'Edital': 'orange',
      'Sentença': 'purple',
    };
    return colors[tipo] || 'gray';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  // Remove tags HTML e retorna texto limpo para o resumo
  const stripHTML = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getResumo = () => {
    const texto = publication.texto_resumo || publication.texto_completo || '';
    const textoLimpo = stripHTML(texto);
    return textoLimpo.substring(0, 200) + (textoLimpo.length > 200 ? '...' : '');
  };

  return (
    <div className="publication-card" onClick={onClick}>
      <div className="publication-header">
        <div className="publication-badges">
          <span className={`badge badge-${getTipoBadgeColor(publication.tipo_comunicacao)}`}>
            {publication.tipo_comunicacao}
          </span>
          <span className="badge badge-gray">{publication.tribunal}</span>
        </div>
        <span className="publication-date">{formatDate(publication.data_disponibilizacao)}</span>
      </div>

      <div className="publication-body">
        <div className="publication-processo">
          <svg className="processo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="processo-number">{publication.numero_processo || 'N/A'}</span>
        </div>

        <div className="publication-orgao">{publication.orgao}</div>

        <div className="publication-resumo">
          {getResumo()}
        </div>
      </div>

      <div className="publication-footer">
        <button className="btn-view-details">
          Ver detalhes
          <svg className="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {publication.link_oficial && (
          <a 
            href={publication.link_oficial}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-official-link"
            onClick={(e) => e.stopPropagation()}
            title="Consultar processo no portal do tribunal"
          >
            🔍 Consultar Processo
          </a>
        )}
      </div>
    </div>
  );
}
