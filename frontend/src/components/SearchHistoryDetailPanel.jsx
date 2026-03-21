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
  publications,
  loading,
  onClose,
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

  if (!publications && !loading) return null;

  return (
    <section className="modal-content search-history-modal search-history-detail-panel">
      <div className="modal-header">
        <h2>Publicações</h2>
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
  highlightProcessNumber: PropTypes.string,
};

export default SearchHistoryDetailPanel;
