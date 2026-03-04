/**
 * CasesFilters - Controles principais da página de processos
 * Busca inteligente e ordenação
 */
import PropTypes from 'prop-types';
import './CasesFilters.css';

function CasesFilters({
  searchQuery,
  onSearchChange,
  isAscending,
  onOrderingToggle,
  totalCount,
  filteredCount
}) {
  return (
    <div className="cases-filters">
      {/* Campo de busca inteligente */}
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por número, cliente ou juiz..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            className="clear-search-btn"
            onClick={() => onSearchChange('')}
            title="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      {/* Controles à direita */}
      <div className="controls-right">
        {/* Informação de resultados */}
        <div className="results-info">
          {searchQuery ? (
            <span>
              {filteredCount} de {totalCount} {totalCount === 1 ? 'processo' : 'processos'}
            </span>
          ) : (
            <span>
              {totalCount} {totalCount === 1 ? 'processo' : 'processos'}
            </span>
          )}
        </div>

        {/* Toggle de ordenação */}
        <button
          className="ordering-toggle"
          onClick={onOrderingToggle}
          title={isAscending ? 'Crescente (mais antigos primeiro)' : 'Decrescente (mais recentes primeiro)'}
        >
          <span className="ordering-icon">{isAscending ? '↑' : '↓'}</span>
          <span className="ordering-label">Data</span>
        </button>
      </div>
    </div>
  );
}

CasesFilters.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  isAscending: PropTypes.bool.isRequired,
  onOrderingToggle: PropTypes.func.isRequired,
  totalCount: PropTypes.number.isRequired,
  filteredCount: PropTypes.number.isRequired
};

export default CasesFilters;
