/**
 * Página de Histórico de Publicações
 * Exibe lista de todas as buscas realizadas com filtros e paginação
 */
import { useState, useMemo } from 'react';
import { useSearchHistory } from '../hooks/useSearchHistory';
import SearchHistoryList from '../components/SearchHistoryList';
import SearchHistoryControls from '../components/SearchHistoryControls';
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
    isClearing,
    loadSearchDetail,
    nextPage,
    previousPage,
    changeOrdering,
    clearSelectedSearch,
    clearHistory,
    formatDate,
    formatDateTime
  } = useSearchHistory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Verificar se ordenação é crescente
  const isAscending = ordering === 'executed_at';

  /**
   * Toggle de ordenação crescente/decrescente
   */
  const handleOrderingToggle = () => {
    const newOrdering = isAscending ? '-executed_at' : 'executed_at';
    changeOrdering(newOrdering);
  };

  /**
   * Filtro em tempo real - busca por data, processo ou nomes
   */
  const filteredSearches = useMemo(() => {
    if (!searchQuery.trim()) {
      return searches;
    }

    const query = searchQuery.toLowerCase();

    return searches.filter(search => {
      // Buscar por data (formato DD/MM/YYYY)
      const dataInicio = formatDate(search.data_inicio).toLowerCase();
      const dataFim = formatDate(search.data_fim).toLowerCase();
      const executedAt = formatDateTime(search.executed_at).toLowerCase();

      if (dataInicio.includes(query) || dataFim.includes(query) || executedAt.includes(query)) {
        return true;
      }

      // Buscar por tribunal
      if (search.tribunais.some(t => t.toLowerCase().includes(query))) {
        return true;
      }

      // Buscar por número no ID (se digitarem números)
      if (search.id.toString().includes(query)) {
        return true;
      }

      return false;
    });
  }, [searches, searchQuery, formatDate, formatDateTime]);

  /**
   * Manipula mudança na busca
   */
  const handleSearchChange = (value) => {
    setSearchQuery(value);
  };

  /**
   * Manipula limpeza do histórico
   */
  const handleClearHistory = async () => {
    try {
      await clearHistory();
      // Sucesso - o hook já atualiza o estado
    } catch (err) {
      // Erro já tratado no hook
      console.error('Erro ao limpar histórico:', err);
    }
  };

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

  return (
    <div className="search-history-page">
      {/* Cabeçalho */}
      <header className="search-history-header">
        <h1>Histórico de Publicações</h1>
        <p className="subtitle">
          Consulte suas buscas anteriores e visualize as publicações encontradas
        </p>
      </header>

      {/* Controles: Busca, Ordenação e Limpeza */}
      <SearchHistoryControls
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        isAscending={isAscending}
        onOrderingToggle={handleOrderingToggle}
        onClearHistory={handleClearHistory}
        totalCount={pagination.count}
        filteredCount={filteredSearches.length}
        isClearing={isClearing}
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
          {filteredSearches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h2>{searchQuery ? 'Nenhum resultado encontrado' : 'Nenhuma busca encontrada'}</h2>
              <p>
                {searchQuery
                  ? 'Tente buscar com outros termos ou limpe o filtro.'
                  : 'Você ainda não realizou nenhuma busca de publicações. Acesse a página de Publicações para fazer sua primeira pesquisa.'}
              </p>
            </div>
          ) : (
            <>
              <SearchHistoryList
                searches={filteredSearches}
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
