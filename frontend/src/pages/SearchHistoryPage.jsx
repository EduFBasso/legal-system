/**
 * Página de Histórico de Buscas de Publicações
 * Exibe lista de todas as buscas realizadas com filtros e paginação
 */
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchHistory } from '../hooks/useSearchHistory';
import publicationsService from '../services/publicationsService';
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
    loadHistory,
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
  const [isSearchingBackend, setIsSearchingBackend] = useState(false);
  const [isBackendQuery, setIsBackendQuery] = useState(false); // Indica se query atual é tipo backend (nome/processo)
  const [backendMatchIds, setBackendMatchIds] = useState(new Set()); // IDs dos cartões encontrados no backend
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
   * Detecta se a busca deve ser feita no backend ou localmente
   * - Data (DD/MM ou números curtos): local
   * - Tribunal (TJSP, TRF, etc): local
   * - Texto/nome (>= 3 caracteres): backend
   * - Número longo (>= 6 dígitos): backend
   */
  const shouldUseBackend = useCallback((query) => {
    if (!query || query.length < 3) return false;
    
    // Busca por data: contém "/" ou são apenas 1-2 dígitos
    if (query.includes('/') || /^\d{1,2}$/.test(query)) {
      return false;
    }
    
    // Busca por tribunal: siglas conhecidas
    const tribunalKeywords = ['tjsp', 'trf', 'trt', 'tst', 'stj', 'stf'];
    const queryLower = query.toLowerCase();
    if (tribunalKeywords.some(t => queryLower.includes(t))) {
      return false;
    }
    
    // Qualquer outra coisa com 3+ caracteres: buscar no backend
    return true;
  }, []);

  /**
   * Normaliza string removendo acentos para busca
   */
  const normalizeString = (str) => {
    if (!str) return '';
    return str.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  /**
   * Busca no backend e guarda apenas os IDs encontrados (não altera searches)
   */
  const searchBackendOnly = useCallback(async (query) => {
    setIsSearchingBackend(true);
    try {
      const result = await publicationsService.getSearchHistory({
        limit: 1000, // Pegar todos os resultados possíveis
        offset: 0,
        q: query
      });

      if (result.success && result.results.length > 0) {
        // Guardar apenas os IDs encontrados
        const foundIds = new Set(result.results.map(s => s.id));
        setBackendMatchIds(foundIds);
      } else {
        // Nenhum resultado: limpar IDs
        setBackendMatchIds(new Set());
      }
    } catch (err) {
      console.error('Erro ao buscar no backend:', err);
      setBackendMatchIds(new Set());
    } finally {
      setIsSearchingBackend(false);
    }
  }, []);
  /**
   * Filtro em tempo real - busca por data, tribunal e ID
   * Também filtra buscas com 0 publicações
   * Busca local com normalização de acentos
   */
  const filteredSearches = useMemo(() => {
    // Primeiro filtrar apenas buscas com publicações
    const searchesWithResults = searches.filter(s => s.total_publicacoes > 0);

    // Se query vazia, SEMPRE retornar tudo
    if (!searchQuery.trim()) {
      return searchesWithResults;
    }

    // Se é query de backend (nome/processo): SEMPRE mostrar tudo
    // O destaque visual (borda azul) indica o que foi encontrado
    // Isso evita piscar quando backend não encontra resultados
    if (isBackendQuery || isSearchingBackend || backendMatchIds.size > 0) {
      return searchesWithResults;
    }

    const query = normalizeString(searchQuery);

    // Se texto muito curto (1-2 caracteres), retornar tudo
    // Evita que cartão desapareça enquanto usuário digita
    if (query.length < 3) {
      return searchesWithResults;
    }

    // Busca local: filtrar por data, tribunal, ID
    return searchesWithResults.filter(search => {
      // Buscar por data (formato DD/MM/YYYY)
      const dataInicio = normalizeString(formatDate(search.data_inicio));
      const dataFim = normalizeString(formatDate(search.data_fim));
      const executedAt = normalizeString(formatDateTime(search.executed_at));

      // Busca simples: query aparece nas datas
      if (dataInicio.includes(query) || dataFim.includes(query) || executedAt.includes(query)) {
        return true;
      }

      // Buscar por tribunal
      if (search.tribunais && search.tribunais.some(t => normalizeString(t).includes(query))) {
        return true;
      }

      // Buscar por número no ID (se digitarem números)
      if (search.id && search.id.toString().includes(query)) {
        return true;
      }

      return false;
    });
  }, [searches, searchQuery, formatDate, formatDateTime, isBackendQuery, isSearchingBackend, backendMatchIds]);

  /**
   * Usa debounce para buscar no backend quando necessário
   */
  useEffect(() => {
    const query = searchQuery.trim();
    
    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Se query vazia, resetar
    if (!query) {
      setIsBackendQuery(false);
      if (backendMatchIds.size > 0) {
        setBackendMatchIds(new Set());
      }
      return;
    }

    // Detectar se deve usar backend
    const useBackend = shouldUseBackend(query);
    setIsBackendQuery(useBackend);

    if (useBackend) {
      // Buscar no backend após 500ms de debounce
      debounceTimerRef.current = setTimeout(() => {
        searchBackendOnly(query);
      }, 500);
    } else {
      // Busca local: limpar IDs do backend
      if (backendMatchIds.size > 0) {
        setBackendMatchIds(new Set());
      }
    }

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, shouldUseBackend, backendMatchIds.size, searchBackendOnly]);

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
        <h1>Histórico de Buscas</h1>
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
                backendMatchIds={backendMatchIds}
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
          highlightProcessNumber={isBackendQuery ? searchQuery : null}
        />
      )}
    </div>
  );
}

export default SearchHistoryPage;
