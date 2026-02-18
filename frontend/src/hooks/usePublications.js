import { useState, useEffect, useCallback } from 'react';
import publicationsService from '../services/publicationsService';

/**
 * Custom hook para gerenciar estado e operações de publicações
 * Encapsula toda a lógica de negócio e chamadas à API
 */
export function usePublications() {
  // Estados principais
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState(null);
  const [lastSearch, setLastSearch] = useState(null);

  // Estados de modal
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados de toast/notificação
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'info'
  });

  /**
   * Exibe uma mensagem toast
   */
  const showToast = useCallback((message, type = 'info') => {
    setToast({
      show: true,
      message,
      type
    });
  }, []);

  /**
   * Oculta o toast
   */
  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  /**
   * Carrega informações da última busca
   */
  const fetchLastSearch = useCallback(async () => {
    try {
      const data = await publicationsService.getLastSearchInfo();
      if (data.success && data.last_search) {
        setLastSearch(data.last_search);
      }
    } catch (error) {
      console.error('Erro ao carregar última busca:', error);
    }
  }, []);

  /**
   * Carrega publicações da última busca do banco
   */
  const loadLastSearch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await publicationsService.retrieveLastSearch();
      
      if (data.success) {
        setPublications(data.publicacoes || []);
        setSearchParams(data.search_info);
        
        if (data.total_publicacoes === 0) {
          showToast('Nenhuma publicação encontrada na última busca.', 'warning');
        } else {
          showToast(
            `${data.total_publicacoes} publicação(ões) carregada(s) da última busca.`,
            'success'
          );
        }
      } else {
        showToast(data.message || 'Nenhuma busca anterior encontrada.', 'warning');
        setPublications([]);
      }
    } catch (error) {
      console.error('Erro ao carregar última busca:', error);
      showToast('Erro ao carregar última busca.', 'error');
      setPublications([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  /**
   * Busca publicações do dia atual
   */
  const searchToday = useCallback(async () => {
    setLoading(true);
    try {
      const data = await publicationsService.searchToday();
      
      if (data.success) {
        setPublications(data.publicacoes || []);
        setSearchParams({
          data_inicio: publicationsService.formatDateISO(new Date()),
          data_fim: publicationsService.formatDateISO(new Date()),
          tribunais: data.tribunais || []
        });
        
        // Atualizar lastSearch
        await fetchLastSearch();
        
        // Disparar evento para atualizar sidebar
        window.dispatchEvent(new Event('publicationsSearchCompleted'));
        
        if (data.total_publicacoes === 0) {
          showToast('Nenhuma publicação encontrada para hoje.', 'warning');
        } else {
          showToast(
            `${data.total_publicacoes} publicação(ões) encontrada(s) para hoje.`,
            'success'
          );
        }
      }
    } catch (error) {
      console.error('Erro ao buscar publicações de hoje:', error);
      showToast('Erro ao buscar publicações de hoje.', 'error');
      setPublications([]);
    } finally {
      setLoading(false);
    }
  }, [fetchLastSearch, showToast]);

  /**
   * Busca publicações com parâmetros personalizados
   */
  const search = useCallback(async (params) => {
    setLoading(true);
    try {
      const data = await publicationsService.search(params);
      
      if (data.success) {
        setPublications(data.publicacoes || []);
        setSearchParams({
          data_inicio: params.dataInicio,
          data_fim: params.dataFim,
          tribunais: params.tribunais
        });
        
        // Atualizar lastSearch
        await fetchLastSearch();
        
        // Disparar evento para atualizar sidebar
        window.dispatchEvent(new Event('publicationsSearchCompleted'));
        
        if (data.total_publicacoes === 0) {
          showToast('Nenhuma publicação encontrada.', 'warning');
        } else {
          showToast(
            `${data.total_publicacoes} publicação(ões) encontrada(s).`,
            'success'
          );
        }
      }
    } catch (error) {
      console.error('Erro ao buscar publicações:', error);
      showToast('Erro ao buscar publicações.', 'error');
      setPublications([]);
    } finally {
      setLoading(false);
    }
  }, [fetchLastSearch, showToast]);

  /**
   * Abre o modal com detalhes de uma publicação
   */
  const openModal = useCallback((publication) => {
    setSelectedPublication(publication);
    setIsModalOpen(true);
  }, []);

  /**
   * Fecha o modal
   */
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPublication(null);
  }, []);

  /**
   * Carrega última busca na inicialização
   */
  useEffect(() => {
    fetchLastSearch();
  }, [fetchLastSearch]);

  return {
    // Estado
    publications,
    loading,
    searchParams,
    lastSearch,
    selectedPublication,
    isModalOpen,
    toast,
    
    // Ações
    search,
    searchToday,
    loadLastSearch,
    openModal,
    closeModal,
    showToast,
    hideToast,
    fetchLastSearch
  };
}
