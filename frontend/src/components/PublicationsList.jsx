import PropTypes from 'prop-types';
import PublicationCard from './PublicationCard';
import './PublicationsList.css';

/**
 * Componente para exibir a lista de publicações
 * Lida com estados de carregamento, vazio e lista de publicações
 */
export default function PublicationsList({ 
  publications, 
  loading, 
  searchParams, 
  onCardClick,
  selectionMode = false,
  selectedIds = new Set(),
  onToggleSelect = () => {},
  onDelete = () => {}
}) {
  // Estado de carregamento
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Consultando tribunais selecionados...</p>
        <p className="loading-hint">2 buscas por tribunal: OAB + Nome da Advogada</p>
      </div>
    );
  }

  // Estado vazio - sem busca realizada
  if (publications.length === 0 && !searchParams) {
    return (
      <div className="empty-state">
        <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p>Nenhuma busca realizada</p>
        <p className="empty-hint">
          Use o formulário acima para buscar publicações ou clique em "Buscar Hoje"
        </p>
      </div>
    );
  }

  // Estado vazio - busca sem resultados
  if (publications.length === 0 && searchParams) {
    return (
      <div className="empty-state">
        <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>Nenhuma publicação encontrada</p>
        <p className="empty-hint">Tente ajustar os filtros ou selecionar outro período</p>
      </div>
    );
  }

  // Estado com publicações
  return (
    <div className="publications-grid">
      {publications.map((pub) => (
        <PublicationCard
          key={pub.id_api}
          publication={pub}
          onClick={() => onCardClick(pub)}
          selectionMode={selectionMode}
          isSelected={selectedIds.has(pub.id_api)}
          onToggleSelect={() => onToggleSelect(pub.id_api)}
          onDelete={() => onDelete(pub.id_api)}
        />
      ))}
    </div>
  );
}

PublicationsList.propTypes = {
  publications: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool.isRequired,
  searchParams: PropTypes.object,
  onCardClick: PropTypes.func.isRequired,
  selectionMode: PropTypes.bool,
  selectedIds: PropTypes.instanceOf(Set),
  onToggleSelect: PropTypes.func,
  onDelete: PropTypes.func
};
