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
   * Calcula estatísticas do histórico
   */
  const getStats = useCallback(() => {
    if (searches.length === 0) {
      return {
        totalSearches: 0,
        totalPublications: 0,
        totalNewPublications: 0,
        averageDuration: 0
      };
    }

    const totalPublications = searches.reduce((sum, s) => sum + s.total_publicacoes, 0);
    const totalNewPublications = searches.reduce((sum, s) => sum + s.total_novas, 0);
    const averageDuration = searches.reduce((sum, s) => sum + s.duration_seconds, 0) / searches.length;

    return {
      totalSearches: pagination.count,
      totalPublications,
      totalNewPublications,
      averageDuration: averageDuration.toFixed(2)
    };
  }, [searches, pagination.count]);

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

    // Ações
    loadHistory,
    loadSearchDetail,
    nextPage,
    previousPage,
    changeOrdering,
    clearSelectedSearch,

    // Utilitários
    formatDate,
    formatDateTime,
    getStats
  };
}
