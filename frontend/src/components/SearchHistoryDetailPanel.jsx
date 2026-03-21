/**
 * SearchHistoryDetailPanel - Painel inline para exibir detalhes de uma busca
 * Mostra informações completas e lista de publicações (sem modal de página)
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import PublicationCard from './PublicationCard';
import PublicationDetailModal from './PublicationDetailModal';
import { usePublicationNotificationRead } from '../hooks/usePublicationNotificationRead';
import './SearchHistoryDetailPanel.css';
import './SearchHistoryDetailModal.css';

function SearchHistoryDetailPanel({
  search,
  publications,
  loading,
  onClose,
  formatDate,
  formatDateTime,
  highlightProcessNumber = null,
}) {
  const markPublicationNotificationAsRead = usePublicationNotificationRead();
  const [selectedPublication, setSelectedPublication] = useState(null);

  const handlePublicationClick = (publication) => {
    markPublicationNotificationAsRead(publication.id_api);
    setSelectedPublication(publication);
  };

  const handleClosePublicationDetail = () => {
    setSelectedPublication(null);
  };

  const getMatchingPublications = () => {
    if (!highlightProcessNumber || !publications || publications.length === 0) return [];

    const query = highlightProcessNumber.toLowerCase();
    const isNumberSearch = /^\d+$/.test(highlightProcessNumber);

    if (isNumberSearch) {
      const searchDigits = highlightProcessNumber.replace(/[^\d]/g, '');
      return publications
        .filter((pub) => {
          if (!pub.numero_processo) return false;
          const pubDigits = pub.numero_processo.replace(/[^\d]/g, '');
          return pubDigits.includes(searchDigits);
        })
        .map((pub) => pub.id_api);
    }

    return publications
      .filter((pub) => {
        const textoCompleto = (pub.texto_completo || '').toLowerCase();
        const textoResumo = (pub.texto_resumo || '').toLowerCase();
        const orgao = (pub.orgao || '').toLowerCase();

        return (
          textoCompleto.includes(query)
          || textoResumo.includes(query)
          || orgao.includes(query)
        );
      })
      .map((pub) => pub.id_api);
  };

  const matchingPublicationIds = getMatchingPublications();

  if (!search && !loading) return null;

  return (
    <section className="modal-content search-history-modal search-history-detail-panel">
      <div className="modal-header">
        <h2>Detalhes da Busca</h2>
        <button className="modal-close-btn" onClick={onClose} aria-label="Fechar detalhes">
          ✕
        </button>
      </div>

      {loading ? (
        <div className="modal-loading">
          <div className="spinner"></div>
          <p>Carregando detalhes...</p>
        </div>
      ) : (
        <>
          <div className="search-info-section">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-icon">🕐</span>
                <div className="info-content">
                  <span className="info-label">Executada em</span>
                  <span className="info-value">{formatDateTime(search.executed_at)}</span>
                </div>
              </div>

              <div className="info-item">
                <span className="info-icon">📅</span>
                <div className="info-content">
                  <span className="info-label">Período consultado</span>
                  <span className="info-value">
                    {formatDate(search.data_inicio)} até {formatDate(search.data_fim)}
                  </span>
                </div>
              </div>

              <div className="info-item">
                <span className="info-icon">⚖️</span>
                <div className="info-content">
                  <span className="info-label">Tribunais</span>
                  <div className="tribunais-list">
                    {search.tribunais.map((tribunal, index) => (
                      <span
                        key={index}
                        className={`tribunal-badge tribunal-${tribunal.toLowerCase()}`}
                      >
                        {tribunal}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="info-item">
                <span className="info-icon">⏱️</span>
                <div className="info-content">
                  <span className="info-label">Duração</span>
                  <span className="info-value">{search.duration_seconds} segundos</span>
                </div>
              </div>
            </div>

            <div className="search-stats">
              <div className="search-stat">
                <span className="stat-number">{search.total_publicacoes}</span>
                <span className="stat-text">Publicações encontradas</span>
              </div>
              <div className="search-stat search-stat-highlight">
                <span className="stat-number">{search.total_novas}</span>
                <span className="stat-text">Novas nesta busca</span>
              </div>
            </div>
          </div>

          <div className="publications-section">
            <h3 className="section-title">Publicações ({publications.length})</h3>

            {publications.length === 0 ? (
              <div className="empty-publications">
                <span className="empty-icon">📭</span>
                <p>Nenhuma publicação encontrada nesta busca</p>
              </div>
            ) : (
              <div className="publications-list">
                {publications.map((pub) => {
                  const isHighlighted = matchingPublicationIds.includes(pub.id_api);
                  return (
                    <PublicationCard
                      key={pub.id_api}
                      publication={pub}
                      highlighted={isHighlighted}
                      onClick={() => handlePublicationClick(pub)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {selectedPublication && (
        <PublicationDetailModal
          publication={selectedPublication}
          onClose={handleClosePublicationDetail}
        />
      )}
    </section>
  );
}

SearchHistoryDetailPanel.propTypes = {
  search: PropTypes.shape({
    id: PropTypes.number.isRequired,
    executed_at: PropTypes.string.isRequired,
    data_inicio: PropTypes.string.isRequired,
    data_fim: PropTypes.string.isRequired,
    tribunais: PropTypes.arrayOf(PropTypes.string).isRequired,
    total_publicacoes: PropTypes.number.isRequired,
    total_novas: PropTypes.number.isRequired,
    duration_seconds: PropTypes.number.isRequired,
    search_params: PropTypes.object,
  }),
  publications: PropTypes.arrayOf(
    PropTypes.shape({
      id_api: PropTypes.number.isRequired,
      numero_processo: PropTypes.string,
      tribunal: PropTypes.string,
      tipo_comunicacao: PropTypes.string,
      data_disponibilizacao: PropTypes.string,
      orgao: PropTypes.string,
      meio: PropTypes.string,
      texto_resumo: PropTypes.string,
      texto_completo: PropTypes.string,
    })
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  formatDateTime: PropTypes.func.isRequired,
  highlightProcessNumber: PropTypes.string,
};

export default SearchHistoryDetailPanel;
