/**
 * Service para gerenciar todas as operações relacionadas a publicações
 * Centraliza a comunicação com a API backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

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

    const response = await fetch(`${API_BASE_URL}/publications/search?${params}`);
    
    if (!response.ok) {
      throw new Error(`Erro na busca: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Busca publicações do dia atual
   * @returns {Promise<Object>} Publicações de hoje
   */
  async searchToday() {
    const response = await fetch(`${API_BASE_URL}/publications/today`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar publicações de hoje: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Retorna informações sobre a última busca realizada
   * @returns {Promise<Object>} Informações da última busca
   */
  async getLastSearchInfo() {
    const response = await fetch(`${API_BASE_URL}/publications/last-search`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar informações: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Carrega publicações da última busca do banco de dados
   * @returns {Promise<Object>} Publicações e informações da última busca
   */
  async retrieveLastSearch() {
    const response = await fetch(`${API_BASE_URL}/publications/retrieve-last-search`);
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar última busca: ${response.status}`);
    }

    return await response.json();
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

    const response = await fetch(`${API_BASE_URL}/publications/history?${params}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar histórico: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Busca detalhes de uma busca específica do histórico
   * @param {number} searchId - ID da busca
   * @returns {Promise<Object>} Detalhes da busca e publicações
   */
  async getSearchHistoryDetail(searchId) {
    const response = await fetch(`${API_BASE_URL}/publications/history/${searchId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Busca não encontrada');
      }
      throw new Error(`Erro ao buscar detalhes: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Deleta todo o histórico de buscas
   * ATENÇÃO: Operação irreversível!
   * @returns {Promise<Object>} Resultado da deleção
   */
  async deleteSearchHistory() {
    const response = await fetch(`${API_BASE_URL}/publications/history/delete`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao deletar histórico: ${response.status}`);
    }

    return await response.json();
  }
}

// Exportar instância singleton
export default new PublicationsService();
