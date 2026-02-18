/**
 * SearchHistoryStats - Estatísticas do histórico de buscas
 * Exibe métricas agregadas sobre as buscas realizadas
 */
import PropTypes from 'prop-types';
import './SearchHistoryStats.css';

function SearchHistoryStats({ stats }) {
  return (
    <div className="search-history-stats">
      <div className="stat-card">
        <div className="stat-icon">🔍</div>
        <div className="stat-content">
          <div className="stat-value">{stats.totalSearches}</div>
          <div className="stat-label">Buscas Realizadas</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">📄</div>
        <div className="stat-content">
          <div className="stat-value">{stats.totalPublications}</div>
          <div className="stat-label">Total de Publicações</div>
        </div>
      </div>

      <div className="stat-card stat-card-highlight">
        <div className="stat-icon">✨</div>
        <div className="stat-content">
          <div className="stat-value">{stats.totalNewPublications}</div>
          <div className="stat-label">Publicações Novas</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">⏱️</div>
        <div className="stat-content">
          <div className="stat-value">{stats.averageDuration}s</div>
          <div className="stat-label">Tempo Médio</div>
        </div>
      </div>
    </div>
  );
}

SearchHistoryStats.propTypes = {
  stats: PropTypes.shape({
    totalSearches: PropTypes.number.isRequired,
    totalPublications: PropTypes.number.isRequired,
    totalNewPublications: PropTypes.number.isRequired,
    averageDuration: PropTypes.string.isRequired
  }).isRequired
};

export default SearchHistoryStats;
