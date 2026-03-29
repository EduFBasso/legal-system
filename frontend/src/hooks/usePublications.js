import { useState, useEffect, useCallback } from 'react';
import publicationsService from '../services/publicationsService';
import { getAuthToken } from '../utils/apiFetch';
import { openPublicationDetailsWindow } from '../utils/publicationNavigation';
import { subscribePublicationSync } from '../services/publicationSync';

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

  const getExcludedPublicationsSuffix = useCallback((data) => {
    const totalDiscarded = Number(data?.total_publicacoes_descartadas ?? 0);
    if (!Number.isFinite(totalDiscarded) || totalDiscarded <= 0) return '';

    const discardedByOab = Number(data?.descartadas_por_oab ?? 0);
    const discardedByKeyword = Number(data?.descartadas_por_palavra_chave ?? 0);

    const parts = [];
    if (Number.isFinite(discardedByOab) && discardedByOab > 0) parts.push(`${discardedByOab} por OAB`);
    if (Number.isFinite(discardedByKeyword) && discardedByKeyword > 0) parts.push(`${discardedByKeyword} por frase`);

    const breakdown = parts.length ? ` (${parts.join(', ')})` : '';
    return ` ⚠️ ${totalDiscarded} descartada(s) por regras de exclusão${breakdown}.`;
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
        } else {
          // Atualizar lastSearch com dados atualizados
          await fetchLastSearch();
        }
      } else {
        setPublications([]);
        setLastSearch(null);
      }
    } catch (error) {
      console.error('Erro ao carregar última busca:', error);
      const message = error?.message || 'Erro ao carregar última busca.';
      const type = error?.status === 400 ? 'warning' : 'error';
      showToast(message, type);
      setPublications([]);
      setSearchParams(null);
      setLastSearch(null);
    } finally {
      setLoading(false);
    }
  }, [showToast, fetchLastSearch]);

  // Sync cross-tab: se publicações forem alteradas em outra aba/janela
  // (integração, deleção, deleção via exclusão de case), atualiza o estado global.
  useEffect(() => {
    const unsubscribe = subscribePublicationSync((event) => {
      if (!event?.type) return;

      const shouldReload =
        event.type === 'PUBLICATION_INTEGRATED' ||
        event.type === 'PUBLICATIONS_UPDATED' ||
        event.type === 'PUBLICATION_DELETED';

      if (!shouldReload) return;

      loadLastSearch();
    });

    return unsubscribe;
  }, [loadLastSearch]);

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

        const excludedSuffix = getExcludedPublicationsSuffix(data);
        
        if (data.total_publicacoes === 0) {
          showToast(`Nenhuma publicação encontrada para hoje.${excludedSuffix}`, 'warning');
        } else {
          showToast(
            `${data.total_publicacoes} publicação(ões) encontrada(s) para hoje.${excludedSuffix}`,
            'success'
          );
        }

        // Observabilidade: se houve falhas em algum tribunal, avisar sem quebrar o fluxo
        if (Array.isArray(data.erros) && data.erros.length > 0) {
          const first = data.erros.slice(0, 2).map((e) => `${e.tribunal} (${e.tipo_busca})`).join(', ');
          const more = data.erros.length > 2 ? ` +${data.erros.length - 2}` : '';
          showToast(`⚠️ Alguns tribunais falharam na consulta: ${first}${more}`, 'warning');
        }
      }
      return data;
    } catch (error) {
      console.error('Erro ao buscar publicações de hoje:', error);
      const message = error?.message || 'Erro ao buscar publicações de hoje.';
      const type = error?.status === 400 ? 'warning' : 'error';
      showToast(message, type);
      setPublications([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchLastSearch, showToast, getExcludedPublicationsSuffix]);

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

        const excludedSuffix = getExcludedPublicationsSuffix(data);
        
        if (data.total_publicacoes === 0) {
          showToast(`Nenhuma publicação encontrada.${excludedSuffix}`, 'warning');
        } else {
          showToast(
            `${data.total_publicacoes} publicação(ões) encontrada(s).${excludedSuffix}`,
            'success'
          );
        }

        // Observabilidade: se houve falhas em algum tribunal, avisar sem quebrar o fluxo
        if (Array.isArray(data.erros) && data.erros.length > 0) {
          const first = data.erros.slice(0, 2).map((e) => `${e.tribunal} (${e.tipo_busca})`).join(', ');
          const more = data.erros.length > 2 ? ` +${data.erros.length - 2}` : '';
          showToast(`⚠️ Alguns tribunais falharam na consulta: ${first}${more}`, 'warning');
        }
      }
      return data;
    } catch (error) {
      console.error('Erro ao buscar publicações:', error);
      const message = error?.message || 'Erro ao buscar publicações.';
      const type = error?.status === 400 ? 'warning' : 'error';
      showToast(message, type);
      setPublications([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchLastSearch, showToast, getExcludedPublicationsSuffix]);

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
