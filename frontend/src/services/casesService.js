/**
 * @fileoverview Service for Cases (Processos) API
 * @module services/casesService
 * 
 * Handles all API calls related to legal cases/processes
 */

import { apiFetch } from '@/utils/apiFetch.js';
import { notifyCaseSync } from './caseSyncService';

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
    if (filters.cliente_principal) params.append('cliente_principal', filters.cliente_principal);
    if (filters.search) params.append('search', filters.search);
    if (filters.ordering) params.append('ordering', filters.ordering);
    if (filters.data_distribuicao__gte) params.append('data_distribuicao__gte', filters.data_distribuicao__gte);
    if (filters.data_distribuicao__lte) params.append('data_distribuicao__lte', filters.data_distribuicao__lte);
    
    const queryString = params.toString();
    const endpoint = `/cases/${queryString ? '?' + queryString : ''}`;
    
    return await apiFetch(endpoint);
  },

  /**
   * Get single case by ID
   * @param {number} id - Case ID
   * @param {Object} [params={}] - Optional query params (e.g. team_member_id)
   * @returns {Promise<Object>} Case detail
   */
  async getById(id, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/cases/${id}/${queryString ? `?${queryString}` : ''}`;
    return await apiFetch(endpoint);
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
    const updated = await apiFetch(`/cases/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(caseData),
    });

    notifyCaseSync({
      caseIds: [
        Number(id),
        Number(caseData?.case_principal),
      ],
      action: 'case-updated',
      source: 'casesService.update',
    });

    return updated;
  },

  /**
   * Soft delete case
   * @param {number} id - Case ID
   * @param {string} reason - Deletion reason
   * @param {boolean} deleteLinkedPublication - Whether to also delete the linked publication
   * @returns {Promise<null>}
   */
  async delete(id, reason = 'Deleted via UI', deleteLinkedPublication = false) {
    return await apiFetch(`/cases/${id}/`, {
      method: 'DELETE',
      body: JSON.stringify({ 
        deleted_reason: reason,
        delete_linked_publication: deleteLinkedPublication 
      }),
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
   * Get shared "Tipo de Ação" options (dynamic + defaults)
   * @returns {Promise<Array<{value: string, label: string}>>}
   */
  async getTipoAcaoOptions() {
    return await apiFetch('/cases/tipo-acao-options/');
  },

  /**
   * Create a new shared "Tipo de Ação" option
   * @param {string} label
   * @returns {Promise<{value: string, label: string}>}
   */
  async createTipoAcaoOption(label) {
    return await apiFetch('/cases/tipo-acao-options/', {
      method: 'POST',
      body: JSON.stringify({ label }),
    });
  },

  /**
   * Rename an existing shared "Tipo de Ação" option
   * @param {number} id
   * @param {string} label
   * @returns {Promise<{id:number, value:string, label:string, editable:boolean}>}
   */
  async updateTipoAcaoOption(id, label) {
    return await apiFetch(`/cases/tipo-acao-options/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ label }),
    });
  },

  /**
   * Get shared "Vínculo Tipo" options (defaults + persisted)
   * @returns {Promise<Array<{id?:number,value:string,label:string,editable?:boolean}>>}
   */
  async getVinculoTipoOptions() {
    return await apiFetch('/cases/vinculo-tipo-options/');
  },

  /**
   * Create a new shared "Vínculo Tipo" option
   * @param {string} label
   * @returns {Promise<{id?:number,value:string,label:string,editable?:boolean}>}
   */
  async createVinculoTipoOption(label) {
    return await apiFetch('/cases/vinculo-tipo-options/', {
      method: 'POST',
      body: JSON.stringify({ label }),
    });
  },

  /**
   * Rename an existing shared "Vínculo Tipo" option
   * @param {number} id
   * @param {string} label
   * @returns {Promise<{id:number,value:string,label:string,editable:boolean}>}
   */
  async updateVinculoTipoOption(id, label) {
    return await apiFetch(`/cases/vinculo-tipo-options/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ label }),
    });
  },

  /**
   * Get shared "Título" options (persisted + dynamic suggestions)
   * @param {string} q - Optional query to reduce results
   * @returns {Promise<Array<{id?:number,value:string,label:string,editable?:boolean}>>}
   */
  async getTituloOptions(q = '') {
    const qs = String(q || '').trim();
    const endpoint = qs ? `/cases/titulo-options/?q=${encodeURIComponent(qs)}` : '/cases/titulo-options/';
    return await apiFetch(endpoint);
  },

  /**
   * Create a new shared "Título" option
   * @param {string} label
   * @returns {Promise<{id:number, value: string, label: string, editable: boolean}>}
   */
  async createTituloOption(label) {
    return await apiFetch('/cases/titulo-options/', {
      method: 'POST',
      body: JSON.stringify({ label }),
    });
  },

  /**
   * Rename an existing shared "Título" option
   * @param {number} id
   * @param {string} label
   * @returns {Promise<{id:number, value: string, label: string, editable: boolean}>}
   */
  async updateTituloOption(id, label) {
    return await apiFetch(`/cases/titulo-options/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ label }),
    });
  },

  /**
   * Get shared "Papel no Processo" options (defaults + persisted)
   * @param {string} q - Optional query to reduce results
   * @returns {Promise<Array<{id?:number,value:string,label:string,editable?:boolean}>>}
   */
  async getPartyRoleOptions(q = '') {
    const qs = String(q || '').trim();
    const endpoint = qs ? `/cases/party-role-options/?q=${encodeURIComponent(qs)}` : '/cases/party-role-options/';
    return await apiFetch(endpoint);
  },

  /**
   * Create a new shared "Papel no Processo" option
   * @param {string} label
   * @returns {Promise<{id?:number,value:string,label:string,editable?:boolean}>}
   */
  async createPartyRoleOption(label) {
    return await apiFetch('/cases/party-role-options/', {
      method: 'POST',
      body: JSON.stringify({ label }),
    });
  },

  /**
   * Rename an existing shared "Papel no Processo" option
   * @param {number} id
   * @param {string} label
   * @returns {Promise<{id:number,value:string,label:string,editable:boolean}>}
   */
  async updatePartyRoleOption(id, label) {
    return await apiFetch(`/cases/party-role-options/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ label }),
    });
  },

  /**
   * Get shared representation type options (persisted)
   * @param {string} q - Optional query to reduce results
   * @returns {Promise<Array<{id?:number,value:string,label:string,editable?:boolean}>>}
   */
  async getRepresentationTypeOptions(q = '') {
    const qs = String(q || '').trim();
    const endpoint = qs
      ? `/cases/representation-type-options/?q=${encodeURIComponent(qs)}`
      : '/cases/representation-type-options/';
    return await apiFetch(endpoint);
  },

  /**
   * Create a new shared representation type option
   * @param {string} label
   * @returns {Promise<{id?:number,value:string,label:string,editable?:boolean}>}
   */
  async createRepresentationTypeOption(label) {
    return await apiFetch('/cases/representation-type-options/', {
      method: 'POST',
      body: JSON.stringify({ label }),
    });
  },

  /**
   * Rename an existing shared representation type option
   * @param {number} id
   * @param {string} label
   * @returns {Promise<{id:number,value:string,label:string,editable:boolean}>}
   */
  async updateRepresentationTypeOption(id, label) {
    return await apiFetch(`/cases/representation-type-options/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ label }),
    });
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
