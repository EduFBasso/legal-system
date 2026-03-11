import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import publicationsService from '../services/publicationsService';
import { generateAllConsultaLinks } from '../utils/consultaLinksHelper';
import './PublicationDetailsPage.css';

console.log('📦 PublicationsService importado:', publicationsService);

export default function PublicationDetailsPage() {
  const { idApi } = useParams();
  const [publication, setPublication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPublication = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📥 Carregando publicação ID:', idApi);
        const data = await publicationsService.getPublicationById(idApi);
        console.log('✅ Resposta da API:', data);
        
        // A API retorna { publication: {...}, success: true }
        const pubData = data?.publication || data;
        console.log('📊 Dados extraídos:', pubData);
        
        setPublication(pubData);
      } catch (err) {
        console.error('❌ Erro ao carregar publicação:', err);
        console.error('Detalhes do erro:', {
          message: err.message,
          status: err.status,
          response: err.response
        });
        setError(`Erro ao carregar: ${err.message || 'Publicação não encontrada'}`);
      } finally {
        setLoading(false);
      }
    };

    if (idApi) {
      loadPublication();
    } else {
      setError('ID da publicação não fornecido');
      setLoading(false);
    }
  }, [idApi]);

  const handleConsultarProcesso = (url) => {
    if (!publication?.numero_processo) {
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    navigator.clipboard.writeText(publication.numero_processo).then(() => {
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }).catch(err => {
      console.error('Erro ao copiar:', err);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });
  };

  const handleCreateCase = () => {
    const publicationId = publication?.id_api || idApi;
    if (!publicationId) return;
    window.open(`/cases/new?pub_id=${publicationId}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyProcesso = async (e) => {
    e.preventDefault();
    if (publication?.numero_processo) {
      await navigator.clipboard.writeText(publication.numero_processo);
      // Feedback visual
      const btn = e.currentTarget;
      const originalText = btn.innerHTML;
      btn.innerHTML = '✅';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('copied');
      }, 2000);
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

  const isHTML = (text) => {
    if (!text) return false;
    return /<[^>]+>/.test(text);
  };

  const sanitizeHTML = (html) => {
    if (!html) return '';
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  if (loading) {
    return (
      <div className="publication-details-page">
        <div className="details-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h2>Carregando publicação...</h2>
            <p>ID: {idApi}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !publication) {
    return (
      <div className="publication-details-page">
        <div className="details-container">
          <div className="error-state">
            <h2>⚠️ Erro ao Carregar</h2>
            <p className="error-message">{error || 'Publicação não encontrada'}</p>
            <p className="error-detail">ID da publicação: {idApi}</p>
            <button 
              className="btn btn-secondary" 
              onClick={() => window.close()}
              style={{marginTop: '1.5rem'}}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const texto = publication.texto_completo || publication.texto_resumo || 'Texto não disponível';
  const isHTMLContent = isHTML(texto);
  const consultaLinks = generateAllConsultaLinks(publication);
  const isIntegrated = publication.integration_status === 'INTEGRATED' || !!publication.case_id;

  return (
    <div className="publication-details-page">
      <div className="details-header">
        <div className="header-content">
          <button 
            className="btn-back"
            onClick={() => window.close()}
            title="Fechar"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="header-title-section">
            <h1>Detalhes da Publicação</h1>
            <div className="header-badges">
              <span className={`badge badge-${getTipoBadgeColor(publication.tipo_comunicacao)}`}>
                {publication.tipo_comunicacao}
              </span>
              <span className={`badge ${getTribunalBadgeClass(publication.tribunal)}`}>
                {publication.tribunal}
              </span>
            </div>
          </div>
          {!isIntegrated && (
            <div className="header-actions">
              <button
                className="btn-create-case-top"
                onClick={handleCreateCase}
                title="Criar novo caso para esta publicação"
              >
                ➕ Criar Caso
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="details-container">
        <div className="details-content">
          <div className="detail-section">
            <div className="detail-row">
              <span className="detail-label">Processo:</span>
              <span className="detail-value processo-number">
                {publication.numero_processo || 'N/A'}
                {publication.numero_processo && (
                  <button 
                    className="btn-copy-processo"
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

        <div className="details-footer">
          <div className="action-buttons">
            {consultaLinks.linkOficial && (
              <button 
                className="btn btn-primary"
                onClick={() => handleConsultarProcesso(consultaLinks.linkOficial)}
                title="Copia o número e abre o portal do tribunal"
              >
                🔍 {publication.tribunal || 'Consultar'} Oficial
              </button>
            )}
            
            {consultaLinks.linksAlternativos.map((system, index) => (
              <button 
                key={index}
                className="btn btn-secondary"
                onClick={() => handleConsultarProcesso(system.url)}
                title={system.description}
              >
                {system.icon} {system.shortName}
              </button>
            ))}
          </div>
          <button 
            className="btn btn-secondary"
            onClick={() => window.close()}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
