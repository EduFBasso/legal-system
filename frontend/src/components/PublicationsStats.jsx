import PropTypes from 'prop-types';
import './PublicationsStats.css';

/**
 * Componente para exibir estatísticas da última busca
 * Mostra período, tribunais, resultados e horário de execução
 */
export default function PublicationsStats({ lastSearch, onLoadSearch }) {
  if (!lastSearch) {
    return null;
  }

  const formatDate = (dateString) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className="last-search-panel"
      onClick={onLoadSearch}
      title="Clique para carregar esta busca do histórico local"
    >
      <div className="last-search-header">
        <span className="last-search-icon">🕒</span>
        <h3 className="last-search-title">Última Busca</h3>
      </div>
      
      <div className="last-search-content">
        <div className="last-search-row">
          <div className="last-search-item">
            <span className="last-search-label">📅 Período:</span>
            <span className="last-search-value">
              {formatDate(lastSearch.data_inicio)} até {formatDate(lastSearch.data_fim)}
            </span>
          </div>
          <div className="last-search-item">
            <span className="last-search-label">⚖️ Tribunais:</span>
            <span className="last-search-value">
              {lastSearch.tribunais.join(', ')}
            </span>
          </div>
        </div>
        
        <div className="last-search-row">
          <div className="last-search-item">
            <span className="last-search-label">📊 Resultados:</span>
            <span className="last-search-value">
              {lastSearch.total_publicacoes} {lastSearch.total_publicacoes === 1 ? 'publicação' : 'publicações'}
              {lastSearch.total_novas > 0 && (
                <span className="last-search-badge">+{lastSearch.total_novas} novas</span>
              )}
            </span>
          </div>
          <div className="last-search-item">
            <span className="last-search-label">⏱️ Executada:</span>
            <span className="last-search-value">
              {formatDateTime(lastSearch.executed_at)}
              {lastSearch.duration_seconds && (
                <span className="last-search-duration"> ({lastSearch.duration_seconds}s)</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

PublicationsStats.propTypes = {
  lastSearch: PropTypes.shape({
    data_inicio: PropTypes.string.isRequired,
    data_fim: PropTypes.string.isRequired,
    tribunais: PropTypes.arrayOf(PropTypes.string).isRequired,
    total_publicacoes: PropTypes.number.isRequired,
    total_novas: PropTypes.number,
    executed_at: PropTypes.string.isRequired,
    duration_seconds: PropTypes.number
  }),
  onLoadSearch: PropTypes.func.isRequired
};
