/**
 * SearchHistoryCard - Card individual para exibir uma busca do histórico
 */
import PropTypes from 'prop-types';
import './SearchHistoryCard.css';

function SearchHistoryCard({ 
  search, 
  onClick, 
  formatDate, 
  formatDateTime,
  isHighlighted = false
}) {
  const cardClassName = isHighlighted 
    ? "search-history-card highlight-process-found" 
    : "search-history-card";

  return (
    <div className={cardClassName} onClick={onClick}>
      {/* Badge de processo encontrado */}
      {isHighlighted && (
        <div className="process-found-badge">
          <span className="badge-icon">🔍</span>
          <span className="badge-text">Encontrado</span>
        </div>
      )}

      {/* Cabeçalho com data de execução */}
      <div className="card-header">
        <div className="execution-info">
          <span className="execution-icon">🕐</span>
          <span className="execution-date">{formatDateTime(search.executed_at)}</span>
        </div>
        <div className="duration-badge">
          {search.duration_seconds}s
        </div>
      </div>

      {/* Período da busca */}
      <div className="search-period">
        <span className="period-icon">📅</span>
        <span className="period-text">
          {formatDate(search.data_inicio)} até {formatDate(search.data_fim)}
        </span>
      </div>

      {/* Tribunais */}
      <div className="tribunais-section">
        <span className="tribunais-label">Tribunais:</span>
        <div className="tribunais-badges">
          {search.tribunais.map((tribunal, index) => (
            <span key={index} className={`tribunal-badge tribunal-${tribunal.toLowerCase()}`}>
              {tribunal}
            </span>
          ))}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="card-stats">
        <div className="stat-item">
          <span className="stat-value">{search.total_publicacoes}</span>
          <span className="stat-label">Publicações</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item stat-item-highlight">
          <span className="stat-value stat-value-new">{search.total_novas}</span>
          <span className="stat-label">Novas</span>
        </div>
      </div>
    </div>
  );
}

SearchHistoryCard.propTypes = {
  search: PropTypes.shape({
    id: PropTypes.number.isRequired,
    executed_at: PropTypes.string.isRequired,
    data_inicio: PropTypes.string.isRequired,
    data_fim: PropTypes.string.isRequired,
    tribunais: PropTypes.arrayOf(PropTypes.string).isRequired,
    total_publicacoes: PropTypes.number.isRequired,
    total_novas: PropTypes.number.isRequired,
    duration_seconds: PropTypes.number.isRequired
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  formatDateTime: PropTypes.func.isRequired,
  isHighlighted: PropTypes.bool
};

export default SearchHistoryCard;
