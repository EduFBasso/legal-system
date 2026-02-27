/**
 * Service para gerenciar todas as operações relacionadas a publicações
 * Centraliza a comunicação com a API backend
 */

import { apiFetch } from '@/utils/apiFetch.js';

class PublicationsService {
  /**
   * Busca publicações com filtros personalizados
   * @param {Object} params - Parâmetros de busca
   * @param {string} params.dataInicio - Data inicial (YYYY-MM-DD)
   * @param {string} params.dataFim - Data final (YYYY-MM-DD)
   * @param {Array<string>} params.tribunais - Lista de tribunais
   * @param {number} params.retroactiveDays - Dias retroativos para notificações
   * @returns {Promise<Object>} Resultado da busca
   */
  async search({ dataInicio, dataFim, tribunais, retroactiveDays = 7 }) {
    const params = new URLSearchParams({
      data_inicio: dataInicio,
      data_fim: dataFim,
      retroactive_days: retroactiveDays
    });

    tribunais.forEach(tribunal => {
      params.append('tribunais', tribunal);
    });

    return await apiFetch(`/publications/search?${params}`);
  }

  /**
   * Busca publicações do dia atual
   * @returns {Promise<Object>} Publicações de hoje
   */
  async searchToday() {
    return await apiFetch(`/publications/today`);
  }

  /**
   * Retorna informações sobre a última busca realizada
   * @returns {Promise<Object>} Informações da última busca
   */
  async getLastSearchInfo() {
    return await apiFetch(`/publications/last-search`);
  }

  /**
   * Carrega publicações da última busca do banco de dados
   * @returns {Promise<Object>} Publicações e informações da última busca
   */
  async retrieveLastSearch() {
    return await apiFetch(`/publications/retrieve-last-search`);
  }

  /**
   * Formata data para o padrão brasileiro
   * @param {string} dateString - Data no formato ISO
   * @returns {string} Data formatada (DD/MM/YYYY)
   */
  formatDateBR(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  }

  /**
   * Formata data para o padrão do input HTML (YYYY-MM-DD)
   * @param {Date|string} date - Data a ser formatada
   * @returns {string} Data no formato YYYY-MM-DD
   */
  formatDateISO(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Valida se uma data está no formato correto
   * @param {string} dateString - Data a validar
   * @returns {boolean} True se válida
   */
  isValidDate(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Calcula período padrão para busca (últimos N dias)
   * @param {number} days - Número de dias
   * @returns {Object} { dataInicio, dataFim }
   */
  getDefaultPeriod(days = 7) {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - days);

    return {
      dataInicio: this.formatDateISO(inicio),
      dataFim: this.formatDateISO(hoje)
    };
  }

  /**
   * Busca histórico de buscas com paginação
   * @param {Object} params - Parâmetros de busca
   * @param {number} params.limit - Número de itens por página (padrão: 20)
   * @param {number} params.offset - Offset para paginação (padrão: 0)
   * @param {string} params.ordering - Campo para ordenação (padrão: -executed_at)
   * @returns {Promise<Object>} Lista de buscas do histórico
   */
  async getSearchHistory({ limit = 20, offset = 0, ordering = '-executed_at', q = '' } = {}) {
    const params = new URLSearchParams({
      limit,
      offset,
      ordering
    });

    // Adicionar query se fornecida
    if (q) {
      params.append('q', q);
    }

    return await apiFetch(`/publications/history?${params}`);
  }

  /**
   * Busca detalhes de uma busca específica do histórico
   * @param {number} searchId - ID da busca
   * @returns {Promise<Object>} Detalhes da busca e publicações
   */
  async getSearchHistoryDetail(searchId) {
    return await apiFetch(`/publications/history/${searchId}`);
  }

  /**
   * Deleta todo o histórico de buscas
   * ATENÇÃO: Operação irreversível!
   * @returns {Promise<Object>} Resultado da deleção
   */
  async deleteSearchHistory() {
    return await apiFetch(`/publications/history/delete`, {
      method: 'DELETE'
    });
  }

  /**
   * Deleta uma publicação específica
   * @param {number} idApi - ID da publicação na API
   * @returns {Promise<Object>} Resultado da deleção
   */
  async deletePublication(idApi) {
    return await apiFetch(`/publications/${idApi}/delete`, {
      method: 'DELETE'
    });
  }

  /**
   * Lista publicações pendentes de integração
   * @param {Object} params - filtros
   * @returns {Promise<Object>} Resultado
   */
  async getPendingPublications({
    limit = 20,
    offset = 0,
    tribunal = null,
    ordering = '-data_disponibilizacao'
  } = {}) {
    const params = new URLSearchParams({
      limit,
      offset,
      ordering
    });

    if (tribunal) {
      params.append('tribunal', tribunal);
    }

    return await apiFetch(`/publications/pending?${params}`);
  }

  /**
   * Retorna contagem de pendentes
   * @returns {Promise<Object>} Resultado
   */
  async getPendingCount() {
    return await apiFetch('/publications/pending/count');
  }

  /**
   * Busca uma publicação específica por id_api
   * @param {number|string} idApi - ID da publicação na API
   * @returns {Promise<Object>} Resultado com publication
   */
  async getPublicationById(idApi) {
    return await apiFetch(`/publications/${idApi}`);
  }

  /**
   * Busca publicações vinculadas a um caso específico
   * @param {number|string} caseId - ID do caso
   * @param {Object} options - Opções de paginação e ordenação
   * @returns {Promise<Object>} Resultado com lista de publicações
   */
  async getPublicationsByCase(caseId, { ordering = '-data_disponibilizacao', limit = 50, offset = 0 } = {}) {
    const params = new URLSearchParams({
      ordering,
      limit: String(limit),
      offset: String(offset)
    });
    
    const data = await apiFetch(`/publications/by-case/${caseId}?${params}`);
    return data.results || [];
  }

  /**
   * Integra publicação com um caso
   * @param {number} idApi - ID da publicação na API
   * @param {Object} payload - dados de integração
   * @returns {Promise<Object>} Resultado
   */
  async integratePublication(idApi, { caseId, createMovement = false, notes = '' }) {
    return await apiFetch(`/publications/${idApi}/integrate`, {
      method: 'POST',
      body: JSON.stringify({
        case_id: caseId,
        create_movement: createMovement,
        notes
      })
    });
  }

  /**
   * Integra publicacoes da ultima busca
   * @param {Object} payload - parametros de integracao
   * @param {boolean} payload.autoIntegration - setting de integração automática
   * @returns {Promise<Object>} Resultado
   */
  async batchIntegratePublications({ searchId = null, autoLink = true, createMovement = false, autoIntegration = false } = {}) {
    return await apiFetch('/publications/batch-integrate', {
      method: 'POST',
      body: JSON.stringify({
        search_id: searchId,
        auto_link: autoLink,
        create_movement: createMovement,
        auto_integration: autoIntegration
      })
    });
  }

  /**
   * Deleta múltiplas publicações
   * @param {Array<number>} publicationIds - Array de id_api
   * @returns {Promise<Object>} Resultado da deleção
   */
  async deleteMultiplePublications(publicationIds) {
    return await apiFetch('/publications/delete-multiple', {
      method: 'POST',
      body: JSON.stringify({ publication_ids: publicationIds })
    });
  }

  /**
   * Deleta TODAS as publicações
   * ATENÇÃO: Operação irreversível!
   * @returns {Promise<Object>} Resultado da deleção
   */
  async deleteAllPublications() {
    return await apiFetch('/publications/delete-all', {
      method: 'POST'
    });
  }
}

// Exportar instância singleton
export default new PublicationsService();
