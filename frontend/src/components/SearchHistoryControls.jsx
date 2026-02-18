/**
 * SearchHistoryControls - Controles principais da página de histórico
 * Busca inteligente, ordenação e limpeza do histórico
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import './SearchHistoryControls.css';

function SearchHistoryControls({
  searchQuery,
  onSearchChange,
  isAscending,
  onOrderingToggle,
  onClearHistory,
  totalCount,
  filteredCount,
  isClearing
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  /**
   * Manipula clique no botão de limpar
   */
  const handleClearClick = () => {
    setShowConfirm(true);
  };

  /**
   * Confirma a limpeza do histórico
   */
  const handleConfirmClear = async () => {
    await onClearHistory();
    setShowConfirm(false);
  };

  /**
   * Cancela a confirmação
   */
  const handleCancelClear = () => {
    setShowConfirm(false);
  };

  return (
    <div className="search-history-controls">
      {/* Campo de busca inteligente */}
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por data, processo ou nomes..."
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
              {filteredCount} de {totalCount} {totalCount === 1 ? 'busca' : 'buscas'}
            </span>
          ) : (
            <span>
              {totalCount} {totalCount === 1 ? 'busca' : 'buscas'}
            </span>
          )}
        </div>

        {/* Toggle de ordenação */}
        <button
          className="ordering-toggle"
          onClick={onOrderingToggle}
          title={isAscending ? 'Crescente (mais antigas primeiro)' : 'Decrescente (mais recentes primeiro)'}
        >
          <span className="ordering-icon">{isAscending ? '↑' : '↓'}</span>
          <span className="ordering-label">Data</span>
        </button>

        {/* Botão de limpar histórico */}
        <button
          className="clear-history-btn"
          onClick={handleClearClick}
          disabled={totalCount === 0 || isClearing}
          title="Limpar todo o histórico"
        >
          <span className="clear-icon">🗑️</span>
          <span className="clear-label">Limpar Histórico</span>
        </button>
      </div>

      {/* Modal de confirmação */}
      {showConfirm && (
        <div className="confirm-overlay" onClick={handleCancelClear}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3>Confirmar Limpeza</h3>
            <p>
              Você está prestes a deletar <strong>TODO o histórico de buscas</strong> ({totalCount}{' '}
              {totalCount === 1 ? 'busca' : 'buscas'}).
            </p>
            <p className="confirm-warning">
              ⚠️ Esta ação é <strong>irreversível</strong> e as informações serão perdidas permanentemente.
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn-cancel" onClick={handleCancelClear}>
                Cancelar
              </button>
              <button
                className="confirm-btn-delete"
                onClick={handleConfirmClear}
                disabled={isClearing}
              >
                {isClearing ? 'Limpando...' : 'Sim, Limpar Tudo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

SearchHistoryControls.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  isAscending: PropTypes.bool.isRequired,
  onOrderingToggle: PropTypes.func.isRequired,
  onClearHistory: PropTypes.func.isRequired,
  totalCount: PropTypes.number.isRequired,
  filteredCount: PropTypes.number.isRequired,
  isClearing: PropTypes.bool.isRequired
};

export default SearchHistoryControls;
