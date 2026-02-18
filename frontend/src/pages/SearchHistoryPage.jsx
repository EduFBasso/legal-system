/**
 * Página de Histórico de Publicações
 * Exibe lista de todas as buscas realizadas com filtros e paginação
 */
import { useState } from 'react';
import { useSearchHistory } from '../hooks/useSearchHistory';
import SearchHistoryList from '../components/SearchHistoryList';
import SearchHistoryStats from '../components/SearchHistoryStats';
import SearchHistoryFilters from '../components/SearchHistoryFilters';
import SearchHistoryDetailModal from '../components/SearchHistoryDetailModal';
import './SearchHistoryPage.css';

function SearchHistoryPage() {
  const {
    searches,
    loading,
    error,
    pagination,
    ordering,
    selectedSearch,
    selectedPublications,
    detailLoading,
    loadSearchDetail,
    nextPage,
    previousPage,
    changeOrdering,
    clearSelectedSearch,
    formatDate,
    formatDateTime,
    getStats
  } = useSearchHistory();

  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Manipula clique em um card de busca
   */
  const handleSearchClick = async (search) => {
    await loadSearchDetail(search.id);
    setIsModalOpen(true);
  };

  /**
   * Fecha o modal de detalhes
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    clearSelectedSearch();
  };

  // Calcular estatísticas
  const stats = getStats();

  return (
    <div className="search-history-page">
      {/* Cabeçalho */}
      <header className="search-history-header">
        <h1>Histórico de Publicações</h1>
        <p className="subtitle">
          Consulte suas buscas anteriores e visualize as publicações encontradas
        </p>
      </header>

      {/* Estatísticas */}
      <SearchHistoryStats stats={stats} />

      {/* Filtros e Ordenação */}
      <SearchHistoryFilters
        ordering={ordering}
        onOrderingChange={changeOrdering}
        totalCount={pagination.count}
      />

      {/* Mensagem de erro */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando histórico...</p>
        </div>
      ) : (
        <>
          {/* Lista de buscas */}
          {searches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h2>Nenhuma busca encontrada</h2>
              <p>
                Você ainda não realizou nenhuma busca de publicações.
                <br />
                Acesse a página de Publicações para fazer sua primeira pesquisa.
              </p>
            </div>
          ) : (
            <>
              <SearchHistoryList
                searches={searches}
                onSearchClick={handleSearchClick}
                formatDate={formatDate}
                formatDateTime={formatDateTime}
              />

              {/* Paginação */}
              {pagination.count > pagination.limit && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={previousPage}
                    disabled={!pagination.hasPrevious}
                  >
                    ← Anterior
                  </button>

                  <span className="pagination-info">
                    Mostrando {pagination.offset + 1} -{' '}
                    {Math.min(pagination.offset + pagination.limit, pagination.count)} de{' '}
                    {pagination.count} buscas
                  </span>

                  <button
                    className="pagination-btn"
                    onClick={nextPage}
                    disabled={!pagination.hasNext}
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal de detalhes */}
      {isModalOpen && (
        <SearchHistoryDetailModal
          search={selectedSearch}
          publications={selectedPublications}
          loading={detailLoading}
          onClose={handleCloseModal}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
        />
      )}
    </div>
  );
}

export default SearchHistoryPage;
