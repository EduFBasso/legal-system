import { useState, useEffect, useCallback } from 'react';
import publicationsService from '../services/publicationsService';

/**
 * usePublicationsForCase
 * Gerencia carregamento de publicações para um caso específico.
 * 
 * @param {number} id - ID do caso
 * @param {Object} systemSettings - Configurações do sistema
 * @param {function} showToast - Função para exibir notificações
 * @returns {Object} Estado e funções para gerenciar publicações do caso
 */
export function usePublicationsForCase(id, systemSettings, showToast, { enabled = true } = {}) {
  // Publicações
  const [publicacoes, setPublicacoes] = useState([]);
  const [loadingPublicacoes, setLoadingPublicacoes] = useState(false);

  /**
   * Carregar publicações
   */
  const loadPublicacoes = useCallback(async () => {
    if (!enabled) return;
    if (!id) return;
    
    setLoadingPublicacoes(true);
    try {
      const data = await publicationsService.getPublicationsByCase(id);
      setPublicacoes(data);
    } catch (error) {
      console.error('Error loading publications:', error);
      showToast('Erro ao carregar publicações', 'error');
    } finally {
      setLoadingPublicacoes(false);
    }
  }, [enabled, id, showToast]);

  /**
   * Auto-load publicações ao montar (baseado em setting)
   */
  useEffect(() => {
    if (!enabled) {
      setLoadingPublicacoes(false);
      return;
    }
    const shouldAutoLoad = systemSettings?.AUTO_LOAD_PUBLICATIONS_ON_CASE !== false;
    
    if (id && shouldAutoLoad) {
      loadPublicacoes();
    }
  }, [enabled, id, loadPublicacoes, systemSettings]);

  return {
    // Estado
    publicacoes,
    setPublicacoes,
    loadingPublicacoes,

    // Funções
    loadPublicacoes,
  };
}

export default usePublicationsForCase;
