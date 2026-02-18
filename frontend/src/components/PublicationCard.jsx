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

  const handleCopyProcesso = (e) => {
    e.stopPropagation();
    if (publication.numero_processo) {
      navigator.clipboard.writeText(publication.numero_processo).then(() => {
        // Feedback visual temporário
        const btn = e.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copiado!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.classList.remove('copied');
        }, 2000);
      });
    }
  };

  const handleConsultarProcesso = (e) => {
    e.stopPropagation();
    // Copiar automaticamente o número do processo
    if (publication.numero_processo) {
      navigator.clipboard.writeText(publication.numero_processo).then(() => {
        // Mostrar feedback visual no botão
        const btn = e.currentTarget;
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '✅ Número Copiado! Abrindo...';
        
        // Restaurar texto original após abrir
        setTimeout(() => {
          btn.innerHTML = originalHTML;
        }, 2000);
      }).catch(err => {
        console.error('Erro ao copiar:', err);
      });
    }
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
          {publication.numero_processo && (
            <button 
              className="btn-copy-processo"
              onClick={handleCopyProcesso}
              title="Copiar número do processo"
            >
              📋
            </button>
          )}
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
            onClick={handleConsultarProcesso}
            title="Copia o número e abre o portal do tribunal"
          >
            🔍 Consultar Processo
          </a>
        )}
      </div>
    </div>
  );
}
