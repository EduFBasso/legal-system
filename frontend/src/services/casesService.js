/**
 * @fileoverview Service for Cases (Processos) API
 * @module services/casesService
 * 
 * Handles all API calls related to legal cases/processes
 */

import { apiFetch } from '@/utils/apiFetch.js';

/**
 * Cases Service
 */
const casesService = {
  /**
   * Get all cases with optional filters
   * @param {Object} filters - Filter parameters
   * @param {string} filters.tribunal - Filter by tribunal (TJSP, STF, etc)
   * @param {string} filters.status - Filter by status (ATIVO, INATIVO, etc)
   * @param {string} filters.search - Search query
   * @param {string} filters.ordering - Ordering field (-data_ultima_movimentacao, etc)
   * @returns {Promise<Object>} Paginated response with cases
   */
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    
    // Handle multiple tribunals (comma-separated string)
    if (filters.tribunal) {
      const tribunals = filters.tribunal.split(',').filter(t => t.trim());
      if (tribunals.length > 1) {
        // Multiple tribunals: use __in lookup
        params.append('tribunal__in', tribunals.join(','));
      } else if (tribunals.length === 1) {
        // Single tribunal: use exact lookup
        params.append('tribunal', tribunals[0]);
      }
    }
    
    if (filters.status) params.append('status', filters.status);
    if (filters.auto_status) params.append('auto_status', filters.auto_status);
    if (filters.search) params.append('search', filters.search);
    if (filters.ordering) params.append('ordering', filters.ordering);
    if (filters.comarca) params.append('comarca__icontains', filters.comarca);
    if (filters.data_distribuicao__gte) params.append('data_distribuicao__gte', filters.data_distribuicao__gte);
    if (filters.data_distribuicao__lte) params.append('data_distribuicao__lte', filters.data_distribuicao__lte);
    
    const queryString = params.toString();
    const endpoint = `/cases/${queryString ? '?' + queryString : ''}`;
    
    return await apiFetch(endpoint);
  },

  /**
   * Get single case by ID
   * @param {number} id - Case ID
   * @returns {Promise<Object>} Case detail
   */
  async getById(id) {
    return await apiFetch(`/cases/${id}/`);
  },

  /**
   * Create new case
   * @param {Object} caseData - Case data
   * @returns {Promise<Object>} Created case
   */
  async create(caseData) {
    return await apiFetch('/cases/', {
      method: 'POST',
      body: JSON.stringify(caseData),
    });
  },

  /**
   * Update existing case
   * @param {number} id - Case ID
   * @param {Object} caseData - Updated case data
   * @returns {Promise<Object>} Updated case
   */
  async update(id, caseData) {
    return await apiFetch(`/cases/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(caseData),
    });
  },

  /**
   * Soft delete case
   * @param {number} id - Case ID
   * @param {string} reason - Deletion reason
   * @returns {Promise<null>}
   */
  async delete(id, reason = 'Deleted via UI') {
    return await apiFetch(`/cases/${id}/`, {
      method: 'DELETE',
      body: JSON.stringify({ deleted_reason: reason }),
    });
  },

  /**
   * Restore soft-deleted case
   * @param {number} id - Case ID
   * @returns {Promise<Object>} Restored case
   */
  async restore(id) {
    return await apiFetch(`/cases/${id}/restore/`, {
      method: 'POST',
    });
  },

  /**
   * Update case auto-status
   * @param {number} id - Case ID
   * @returns {Promise<Object>} Updated case
   */
  async updateStatus(id) {
    return await apiFetch(`/cases/${id}/update_status/`, {
      method: 'POST',
    });
  },

  /**
   * Get case statistics
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Statistics data
   */
  async getStats(filters = {}) {
    const params = new URLSearchParams(filters);
    const queryString = params.toString();
    const endpoint = `/cases/stats/${queryString ? '?' + queryString : ''}`;
    
    return await apiFetch(endpoint);
  },

  /**
   * Get case parties (contacts) for a specific case
   * @param {number} caseId - Case ID
   * @returns {Promise<Object>} Paginated case parties
   */
  async getParties(caseId) {
    return await apiFetch(`/case-parties/?case=${caseId}`);
  },

  /**
   * Add party to case
   * @param {Object} partyData - Party data (case, contact, role, observacoes)
   * @returns {Promise<Object>} Created case party
   */
  async addParty(partyData) {
    return await apiFetch('/case-parties/', {
      method: 'POST',
      body: JSON.stringify(partyData),
    });
  },

  /**
   * Update case party
   * @param {number} id - Case party ID
   * @param {Object} partyData - Updated party data
   * @returns {Promise<Object>} Updated case party
   */
  async updateParty(id, partyData) {
    return await apiFetch(`/case-parties/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(partyData),
    });
  },

  /**
   * Remove party from case
   * @param {number} id - Case party ID
   * @returns {Promise<null>}
   */
  async removeParty(id) {
    return await apiFetch(`/case-parties/${id}/`, {
      method: 'DELETE',
    });
  },
};

export default casesService;
