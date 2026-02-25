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
    return await apiFetch(`/publications/${publicationId}/delete`, {
      method: 'DELETE'
    });
  }

  /**
   * Deleta múltiplas publicações
   * @param {Array<number>} publicationIds - Array de id_api
   * @returns {Promise<Object>} Resultado da deleção
   */
  async deleteMultiplePublications(publicationIds) {
    return await apiFetch('/publications/bulk-delete', {
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
      method: 'DELETE'
    });
  }
}

// Exportar instância singleton
export default new PublicationsService();
