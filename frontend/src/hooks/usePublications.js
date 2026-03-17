import { useState, useEffect, useCallback } from 'react';
import publicationsService from '../services/publicationsService';
import { getAuthToken } from '../utils/apiFetch';
import { openPublicationDetailsWindow } from '../utils/publicationNavigation';

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

  // Estados de notificação
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

  const resetState = useCallback(() => {
    setPublications([]);
    setSearchParams(null);
    setLastSearch(null);
    setSelectedPublication(null);
    setIsModalOpen(false);
    setToast({ show: false, message: '', type: 'info' });
  }, []);

  /**
   * Carrega informações da última busca
   */
  const fetchLastSearch = useCallback(async () => {
    try {
      const data = await publicationsService.getLastSearchInfo();
      if (data.success && data.last_search) {
        setLastSearch(data.last_search);
      } else {
        setLastSearch(null);
      }
    } catch (error) {
      console.error('Erro ao carregar última busca:', error);
      setLastSearch(null);
    }
  }, []);

  /**
   * Limpa/invalida informações da última busca
   * Usado após deletar todas as publicações
   */
  const clearLastSearch = useCallback(() => {
    setLastSearch(null);
    setPublications([]);
    setSearchParams(null);
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
        
        // Se não há mais publicações no banco, limpar lastSearch
        if (data.total_publicacoes === 0) {
          setLastSearch(null);
          showToast('Nenhuma publicação encontrada na última busca.', 'warning');
        } else {
          // Atualizar lastSearch com dados atualizados
          await fetchLastSearch();
          showToast(
            `${data.total_publicacoes} publicação(ões) carregada(s) da última busca.`,
            'success'
          );
        }
      } else {
        showToast(data.message || 'Nenhuma busca anterior encontrada.', 'warning');
        setPublications([]);
        setLastSearch(null);
      }
    } catch (error) {
      console.error('Erro ao carregar última busca:', error);
      showToast('Erro ao carregar última busca.', 'error');
      setPublications([]);
    } finally {
      setLoading(false);
    }
  }, [showToast, fetchLastSearch]);

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
      return data;
    } catch (error) {
      console.error('Erro ao buscar publicações de hoje:', error);
      showToast('Erro ao buscar publicações de hoje.', 'error');
      setPublications([]);
      return null;
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
      return data;
    } catch (error) {
      console.error('Erro ao buscar publicações:', error);
      showToast('Erro ao buscar publicações.', 'error');
      setPublications([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchLastSearch, showToast]);

  /**
   * Abre os detalhes de uma publicação em uma nova janela
   */
  const openModal = useCallback((publication) => {
    openPublicationDetailsWindow(publication.id_api);
  }, []);

  /**
   * Fecha o modal (mantido para compatibilidade, não usado mais)
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

  useEffect(() => {
    const handleAuthChanged = () => {
      resetState();
      if (getAuthToken()) {
        fetchLastSearch();
      }
    };

    window.addEventListener('auth:changed', handleAuthChanged);
    return () => window.removeEventListener('auth:changed', handleAuthChanged);
  }, [fetchLastSearch, resetState]);

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
    clearLastSearch,
    openModal,
    closeModal,
    showToast,
    hideToast,
    fetchLastSearch
  };
}
