/**
 * SearchHistoryFilters - Filtros e ordenação do histórico
 * Permite ordenar a lista de buscas
 */
import PropTypes from 'prop-types';
import './SearchHistoryFilters.css';

function SearchHistoryFilters({ ordering, onOrderingChange, totalCount }) {
  return (
    <div className="search-history-filters">
      <div className="filters-summary">
        <span className="total-count">
          {totalCount} {totalCount === 1 ? 'busca encontrada' : 'buscas encontradas'}
        </span>
      </div>

      <div className="filters-controls">
        <label htmlFor="ordering-select" className="ordering-label">
          Ordenar por:
        </label>
        <select
          id="ordering-select"
          className="ordering-select"
          value={ordering}
          onChange={(e) => onOrderingChange(e.target.value)}
        >
          <option value="-executed_at">Mais recentes primeiro</option>
          <option value="executed_at">Mais antigas primeiro</option>
          <option value="-total_publicacoes">Mais publicações</option>
          <option value="total_publicacoes">Menos publicações</option>
          <option value="-duration_seconds">Mais demoradas</option>
          <option value="duration_seconds">Mais rápidas</option>
        </select>
      </div>
    </div>
  );
}

SearchHistoryFilters.propTypes = {
  ordering: PropTypes.string.isRequired,
  onOrderingChange: PropTypes.func.isRequired,
  totalCount: PropTypes.number.isRequired
};

export default SearchHistoryFilters;
