/**
 * SearchHistoryList - Lista de buscas do histórico
 * Renderiza SearchHistoryCard para cada busca
 */
import PropTypes from 'prop-types';
import SearchHistoryCard from './SearchHistoryCard';
import './SearchHistoryList.css';

function SearchHistoryList({ 
  searches, 
  onSearchClick, 
  formatDate, 
  formatDateTime,
  backendMatchIds = new Set()
}) {
  return (
    <div className="search-history-list">
      {searches.map(search => (
        <SearchHistoryCard
          key={search.id}
          search={search}
          onClick={() => onSearchClick(search)}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          isHighlighted={backendMatchIds.has(search.id)}
        />
      ))}
    </div>
  );
}

SearchHistoryList.propTypes = {
  searches: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      executed_at: PropTypes.string.isRequired,
      data_inicio: PropTypes.string.isRequired,
      data_fim: PropTypes.string.isRequired,
      tribunais: PropTypes.arrayOf(PropTypes.string).isRequired,
      total_publicacoes: PropTypes.number.isRequired,
      total_novas: PropTypes.number.isRequired,
      duration_seconds: PropTypes.number.isRequired
    })
  ).isRequired,
  onSearchClick: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  formatDateTime: PropTypes.func.isRequired,
  backendMatchIds: PropTypes.instanceOf(Set)
};

export default SearchHistoryList;
