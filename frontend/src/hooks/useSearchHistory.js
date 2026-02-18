/**
 * Hook customizado para gerenciar o histórico de buscas de publicações
 * Encapsula lógica de negócio e gerenciamento de estado
 */
import { useState, useCallback, useEffect } from 'react';
import publicationsService from '../services/publicationsService';

/**
 * Hook para gerenciar histórico de buscas
 * @returns {Object} Estado e funções do histórico
 */
export function useSearchHistory() {
  // Estado
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    limit: 20,
    offset: 0,
    hasNext: false,
    hasPrevious: false
  });
  const [ordering, setOrdering] = useState('-executed_at');
  
  // Estado para detalhes de uma busca específica
  const [selectedSearch, setSelectedSearch] = useState(null);
  const [selectedPublications, setSelectedPublications] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Estado para limpeza do histórico
  const [isClearing, setIsClearing] = useState(false);

  /**
   * Carrega lista de buscas do histórico
   */
  const loadHistory = useCallback(async (customOffset = null) => {
    setLoading(true);
    setError(null);

    try {
      const offset = customOffset !== null ? customOffset : pagination.offset;
      const result = await publicationsService.getSearchHistory({
        limit: pagination.limit,
        offset,
        ordering
      });

      if (result.success) {
        setSearches(result.results);
        setPagination({
          count: result.count,
          limit: pagination.limit,
          offset,
          hasNext: !!result.next,
          hasPrevious: !!result.previous
        });
      } else {
        throw new Error(result.error || 'Erro ao carregar histórico');
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setError(err.message);
      setSearches([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, pagination.offset, ordering]);

  /**
   * Carrega detalhes de uma busca específica
   */
  const loadSearchDetail = useCallback(async (searchId) => {
    setDetailLoading(true);
    setError(null);

    try {
      const result = await publicationsService.getSearchHistoryDetail(searchId);

      if (result.success) {
        setSelectedSearch(result.search);
        setSelectedPublications(result.publicacoes || []);
      } else {
        throw new Error(result.error || 'Erro ao carregar detalhes');
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      setError(err.message);
      setSelectedSearch(null);
      setSelectedPublications([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  /**
   * Navega para próxima página
   */
  const nextPage = useCallback(() => {
    if (pagination.hasNext) {
      const newOffset = pagination.offset + pagination.limit;
      loadHistory(newOffset);
    }
  }, [pagination, loadHistory]);

  /**
   * Navega para página anterior
   */
  const previousPage = useCallback(() => {
    if (pagination.hasPrevious) {
      const newOffset = Math.max(0, pagination.offset - pagination.limit);
      loadHistory(newOffset);
    }
  }, [pagination, loadHistory]);

  /**
   * Muda ordenação
   */
  const changeOrdering = useCallback((newOrdering) => {
    setOrdering(newOrdering);
    setPagination(prev => ({ ...prev, offset: 0 }));
  }, []);

  /**
   * Limpa busca selecionada
   */
  const clearSelectedSearch = useCallback(() => {
    setSelectedSearch(null);
    setSelectedPublications([]);
  }, []);

  /**
   * Formata data para exibição
   */
  const formatDate = useCallback((dateString) => {
    return publicationsService.formatDateBR(dateString);
  }, []);

  /**
   * Formata data/hora para exibição
   */
  const formatDateTime = useCallback((dateTimeString) => {
    if (!dateTimeString) return '';
    
    const date = new Date(dateTimeString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  /**
   * Deleta todo o histórico de buscas
   * ATENÇÃO: Operação irreversível!
   */
  const clearHistory = useCallback(async () => {
    setIsClearing(true);
    setError(null);

    try {
      const result = await publicationsService.deleteSearchHistory();

      if (result.success) {
        // Recarregar histórico (que agora estará vazio)
        setSearches([]);
        setPagination({
          count: 0,
          limit: 20,
          offset: 0,
          hasNext: false,
          hasPrevious: false
        });
        return result;
      } else {
        throw new Error(result.error || 'Erro ao limpar histórico');
      }
    } catch (err) {
      console.error('Erro ao limpar histórico:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsClearing(false);
    }
  }, []);

  /**
   * Busca no backend por número de processo ou outros campos
   */
  const searchByQuery = useCallback(async (query) => {
    if (!query.trim()) {
      // Se query vazio, recarregar histórico normal
      await loadHistory(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await publicationsService.getSearchHistory({
        limit: pagination.limit,
        offset: 0,
        ordering,
        q: query  // Envia query para backend
      });

      if (result.success) {
        setSearches(result.results);
        setPagination({
          count: result.count,
          limit: pagination.limit,
          offset: 0,
          hasNext: !!result.next,
          hasPrevious: !!result.previous
        });
      } else {
        throw new Error(result.error || 'Erro ao buscar');
      }
    } catch (err) {
      console.error('Erro ao buscar:', err);
      setError(err.message);
      setSearches([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, ordering, loadHistory]);

  // Carregar histórico ao montar o componente ou quando ordenação mudar
  useEffect(() => {
    const offset = 0;
    setLoading(true);
    setError(null);

    publicationsService.getSearchHistory({
      limit: pagination.limit,
      offset,
      ordering
    })
    .then(result => {
      if (result.success) {
        setSearches(result.results);
        setPagination({
          count: result.count,
          limit: pagination.limit,
          offset,
          hasNext: !!result.next,
          hasPrevious: !!result.previous
        });
      } else {
        throw new Error(result.error || 'Erro ao carregar histórico');
      }
    })
    .catch(err => {
      console.error('Erro ao carregar histórico:', err);
      setError(err.message);
      setSearches([]);
    })
    .finally(() => {
      setLoading(false);
    });
  }, [ordering, pagination.limit]);

  return {
    // Estado
    searches,
    loading,
    error,
    pagination,
    ordering,
    selectedSearch,
    selectedPublications,
    detailLoading,
    isClearing,

    // Ações
    loadHistory,
    loadSearchDetail,
    nextPage,
    previousPage,
    changeOrdering,
    clearSelectedSearch,
    clearHistory,
    searchByQuery,

    // Utilitários
    formatDate,
    formatDateTime
  };
}
