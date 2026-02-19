/**
 * Página de Histórico de Publicações
 * Exibe lista de todas as buscas realizadas com filtros e paginação
 */
import { useState, useMemo, useEffect, useRef } from 'react';
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
    searchByQuery,
    formatDate,
    formatDateTime
  } = useSearchHistory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [useBackendSearch, setUseBackendSearch] = useState(false);
  const [isProcessSearch, setIsProcessSearch] = useState(false);
  const debounceTimerRef = useRef(null);

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
   * Também filtra buscas com 0 publicações
   * 
   * Se useBackendSearch=true, os resultados já vêm filtrados do backend
   * Para busca local, filtra por data, tribunal e ID
   */
  const filteredSearches = useMemo(() => {
    // Primeiro filtrar apenas buscas com publicações
    const searchesWithResults = searches.filter(s => s.total_publicacoes > 0);

    // Se busca está sendo feita no backend, retornar resultados diretos
    if (useBackendSearch) {
      return searchesWithResults;
    }

    // Busca local (data, tribunal, ID)
    if (!searchQuery.trim()) {
      return searchesWithResults;
    }

    const query = searchQuery.toLowerCase();

    return searchesWithResults.filter(search => {
      // Buscar por data (formato DD/MM/YYYY)
      const dataInicio = formatDate(search.data_inicio).toLowerCase();
      const dataFim = formatDate(search.data_fim).toLowerCase();
      const executedAt = formatDateTime(search.executed_at).toLowerCase();

      // Busca simples: query aparece nas datas
      if (dataInicio.includes(query) || dataFim.includes(query) || executedAt.includes(query)) {
        return true;
      }

      // Busca inteligente por data: só detecta como data se:
      // 1. Contém "/" (ex: "11/", "11/02", "11/02/2026")
      // 2. OU tem no máximo 2 dígitos (ex: "11", "1")
      // Números longos sem "/" (ex: "00006236920268260320") NÃO são considerados datas
      const hasSlash = query.includes('/');
      const isShortNumber = query.match(/^\d{1,2}$/) !== null;
      const looksLikeDate = hasSlash || isShortNumber;

      if (looksLikeDate) {
        // Tentar construir possíveis datas com o que foi digitado
        const inicio = new Date(search.data_inicio);
        const fim = new Date(search.data_fim);
        
        // Extrair dia, mês e ano do query
        const parts = query.split('/');
        const diaQuery = parts[0] ? parseInt(parts[0]) : null;
        const mesQuery = parts[1] ? parseInt(parts[1]) : null;
        const anoQuery = parts[2] ? parseInt(parts[2]) : null;

        if (diaQuery) {
          // Criar data de teste baseada no período da busca
          // Usar o ano e mês do início para testar
          const anoTeste = anoQuery || inicio.getFullYear();
          const mesTeste = mesQuery || (inicio.getMonth() + 1);
          
          // Tentar criar a data com os valores fornecidos
          const dataTeste = new Date(anoTeste, mesTeste - 1, diaQuery);
          
          // Verificar se a data de teste está dentro do período [inicio, fim]
          if (dataTeste >= inicio && dataTeste <= fim) {
            return true;
          }

          // Também testar com o mês do fim (caso o período cruze meses)
          if (fim.getMonth() !== inicio.getMonth()) {
            const mesTeste2 = mesQuery || (fim.getMonth() + 1);
            const dataTeste2 = new Date(anoTeste, mesTeste2 - 1, diaQuery);
            if (dataTeste2 >= inicio && dataTeste2 <= fim) {
              return true;
            }
          }
        }
      }

      // Buscar por tribunal
      if (search.tribunais.some(t => t.toLowerCase().includes(query))) {
        return true;
      }

      // Buscar por número no ID (se digitarem números)
      if (search.id.toString().includes(query)) {
        return true;
      }

      // TODO: Busca por número de processo nas publicações
      // Requer carregar publicações ou buscar no backend
      // Por enquanto, só busca nos dados do histórico (data, tribunal, ID)

      return false;
    });
  }, [searches, searchQuery, formatDate, formatDateTime, useBackendSearch]);

  /**
   * Detecta se deve usar busca no backend (números longos = possível número de processo)
   * Usa debounce para evitar requisições excessivas
   */
  useEffect(() => {
    const query = searchQuery.trim();
    
    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Se query vazia, resetar
    if (!query) {
      setUseBackendSearch(false);
      setIsProcessSearch(false);
      return;
    }

    // Detectar se é número longo sem "/" (possível número de processo)
    // Números com 6+ dígitos sem "/" aciona busca no backend
    const hasSlash = query.includes('/');
    const isLongNumber = /^\d{6,}$/.test(query);
    const shouldUseBackend = !hasSlash && isLongNumber;

    setIsProcessSearch(shouldUseBackend);

    if (shouldUseBackend) {
      // Buscar no backend após 500ms de debounce
      debounceTimerRef.current = setTimeout(() => {
        setUseBackendSearch(true);
        searchByQuery(query);
      }, 500);
    } else {
      setUseBackendSearch(false);
    }

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, searchByQuery]);

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
                highlightProcessSearch={isProcessSearch}
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
          highlightProcessNumber={isProcessSearch ? searchQuery : null}
        />
      )}
    </div>
  );
}

export default SearchHistoryPage;
