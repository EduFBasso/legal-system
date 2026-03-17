import { generateAllConsultaLinks, openConsultaWithCopy } from '../utils/consultaLinksHelper';
import { getPublicationActionState } from '../utils/publicationActionState';
import { openCaseDetailWindow } from '../utils/publicationNavigation';
import './PublicationCard.css';

// Chave de desenvolvimento: exibir botão excluir publicação
// Para habilitar, adicionar VITE_DEV_SHOW_DELETE_PUBLICATION=true no .env.local
const DEV_SHOW_DELETE_PUBLICATION = import.meta.env.VITE_DEV_SHOW_DELETE_PUBLICATION === 'true';

export default function PublicationCard({ 
  publication, 
  onClick, 
  highlighted = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelect = () => {},
  onDelete = () => {},
  showActionButtons = false,
  onIntegrate = () => {},
  onCreateCase = () => {},
  caseSuggestion = null
}) {
  const getTipoBadgeColor = (tipo) => {
    const colors = {
      'Intimação': 'red',
      'Citação': 'green',
      'Edital': 'orange',
      'Sentença': 'purple',
    };
    return colors[tipo] || 'gray';
  };

  const getTribunalBadgeClass = (tribunal) => {
    const tribunalMap = {
      'TJSP': 'badge-tribunal-tjsp',
      'TRF3': 'badge-tribunal-trf3',
      'TRT2': 'badge-tribunal-trt2',
      'TRT15': 'badge-tribunal-trt15',
    };
    return tribunalMap[tribunal] || 'badge-gray';
  };

  const getStatusBadgeInfo = (status) => {
    const statusMap = {
      'INTEGRATED': { 
        label: 'VINCULADA', 
        backgroundColor: 'var(--color-normal-light)',
        color: 'var(--color-normal)' 
      },
      'PENDING': { 
        label: 'NÃO VINCULADA', 
        backgroundColor: 'var(--color-urgente-light)',
        color: 'var(--color-urgente)' 
      },
      'IGNORED': { 
        label: 'IGNORADA', 
        backgroundColor: 'var(--color-total-light)',
        color: 'var(--color-total)' 
      },
    };
    return statusMap[status] || { 
      label: status, 
      backgroundColor: 'var(--color-total-light)',
      color: 'var(--color-total)' 
    };
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
      // Guardar referência do button antes da operação assincronada
      const btn = e.currentTarget;
      navigator.clipboard.writeText(publication.numero_processo).then(() => {
        // Verificar se o elemento ainda existe no DOM
        if (!btn || !document.contains(btn)) return;
        
        // Feedback visual temporário
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copiado!';
        btn.classList.add('copied');
        setTimeout(() => {
          if (btn && document.contains(btn)) {
            btn.innerHTML = originalText;
            btn.classList.remove('copied');
          }
        }, 2000);
      }).catch(err => {
        console.error('Erro ao copiar:', err);
      });
    }
  };

  const handleConsultarProcesso = (e, url) => {
    e.stopPropagation();
    openConsultaWithCopy(url, publication.numero_processo, e.currentTarget);
  };

  // Obter todos os links de consulta disponíveis
  const consultaLinks = generateAllConsultaLinks(publication);
  
  const cardClassName = highlighted 
    ? "publication-card highlighted-publication" 
    : "publication-card";

  const handleCardClick = (e) => {
    if (selectionMode) {
      e.stopPropagation();
      onToggleSelect();
    } else {
      onClick();
    }
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onToggleSelect();
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete();
  };

  const actionState = getPublicationActionState(publication, caseSuggestion);

  return (
    <div className={cardClassName} onClick={handleCardClick}>      {selectionMode && (
        <div className="selection-checkbox-overlay">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxClick}
            className="publication-checkbox"
          />
        </div>
      )}      {highlighted && (
        <div className="highlighted-badge">
          <span className="badge-icon">✨</span>
          <span className="badge-text">Encontrado</span>
        </div>
      )}
      <div className="publication-header">
        <div className="publication-badges">
          <span className={`badge badge-${getTipoBadgeColor(publication.tipo_comunicacao)}`}>
            {publication.tipo_comunicacao}
          </span>
          <span className={`badge ${getTribunalBadgeClass(publication.tribunal)}`}>{publication.tribunal}</span>
          <span 
            className="badge badge-status"
            style={{ 
              backgroundColor: getStatusBadgeInfo(publication.integration_status).backgroundColor,
              color: getStatusBadgeInfo(publication.integration_status).color
            }}
          >
            {getStatusBadgeInfo(publication.integration_status).label}
          </span>
        </div>
        <div className="publication-header-right">
          {!selectionMode && DEV_SHOW_DELETE_PUBLICATION && (
            <button
              className="btn-delete-publication"
              onClick={handleDeleteClick}
              title="Apagar esta publicação"
            >
              🗑️
            </button>
          )}
        </div>
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

      {/* Action Buttons Section (Integrar, Criar caso, etc.) */}
      {showActionButtons && (
        <div className="publication-actions">
          <button
            className={actionState.className}
            onClick={(e) => {
              e.stopPropagation();
              if (actionState.key === 'integrated') {
                if (publication.case_id) {
                  openCaseDetailWindow(publication.case_id);
                }
                return;
              }

              if (actionState.key === 'suggested') {
                onIntegrate();
                return;
              }

              onCreateCase();
            }}
            title={actionState.title}
          >
            {actionState.label}
          </button>
        </div>
      )}

      <div className="publication-footer">
        <button className="btn-view-details">
          Ver detalhes
          <svg className="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Link oficial (ESAJ ou principal) */}
        {consultaLinks.linkOficial && (
          <button 
            className="btn-official-link"
            onClick={(e) => handleConsultarProcesso(e, consultaLinks.linkOficial)}
            title="Copia o número e abre o portal do tribunal"
          >
            🔍 Consultar ({publication.tribunal})
          </button>
        )}
        
        {/* Links alternativos (eProc, TRF3, TRT15, etc.) */}
        {consultaLinks.linksAlternativos.map((system, index) => (
          <button 
            key={index}
            className="btn-alternative-link"
            onClick={(e) => handleConsultarProcesso(e, system.url)}
            title={system.description}
          >
            {system.icon} {system.shortName}
          </button>
        ))}
      </div>
    </div>
  );
}
