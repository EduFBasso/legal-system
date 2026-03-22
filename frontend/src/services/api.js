import { apiFetch, getApiBaseUrl, getAuthToken } from '../utils/apiFetch';

// src/services/api.js
/**
 * @fileoverview API client para comunicação com backend Django
 * @module services/api
 * 
 * Cliente HTTP centralizado para todas as chamadas à API REST.
 * Trata automaticamente:
 * - Content-Type: application/json
 * - Error handling
 * - Response 204 No Content (DELETE)
 * 
 * @example
 * import { contactsAPI } from './api';
 * 
 * const contacts = await contactsAPI.getAll({ contact_type: 'CLIENT' });
 * const contact = await contactsAPI.getById(1);
 * const newContact = await contactsAPI.create({ name: 'João Silva', ... });
 */

/**
 * API de Contatos - CRUD completo
 * @namespace contactsAPI
 */
export const contactsAPI = {
  /**
   * Busca todos os contatos com filtros opcionais
   * @param {Object} [params={}] - Parâmetros de filtro
   * @param {string} [params.person_type] - Filtrar por pessoa (PF, PJ)
   * @param {string} [params.search] - Busca textual
   * @returns {Promise<Array>} Lista de contatos
   * @example
   * const pessoasFisicas = await contactsAPI.getAll({ person_type: 'PF' });
   * const all = await contactsAPI.getAll();
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/contacts/?${queryString}` : '/contacts/';
    return apiFetch(endpoint);
  },

  /**
   * Busca um contato específico por ID
   * @param {number} id - ID do contato
   * @param {Object} [params={}] - Query params opcionais (ex: team_member_id)
   * @returns {Promise<Object>} Dados completos do contato
   * @throws {Error} Se contato não encontrado (404)
   * @example
   * const contact = await contactsAPI.getById(1);
   * console.log(contact.name, contact.email);
   */
  getById: async (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/contacts/${id}/?${queryString}` : `/contacts/${id}/`;
    return apiFetch(endpoint);
  },

  /**
   * Cria um novo contato
   * @param {Object} data - Dados do contato
   * @param {string} data.name - Nome (obrigatório)
   * @param {string} [data.person_type='PF'] - PF ou PJ
   * @param {string} [data.document_number] - CPF ou CNPJ (apenas números)
   * @param {string} [data.email] - Email
   * @param {string} [data.phone] - Telefone (apenas números)
   * @param {string} [data.mobile] - Celular (apenas números)
   * @param {string} [data.street] - Logradouro
   * @param {string} [data.number] - Número
   * @param {string} [data.complement] - Complemento
   * @param {string} [data.neighborhood] - Bairro
   * @param {string} [data.city] - Cidade
   * @param {string} [data.state] - Estado (UF)
   * @param {string} [data.zip_code] - CEP (apenas números)
   * @param {string} [data.notes] - Observações
   * @returns {Promise<Object>} Contato criado com ID
   * @example
   * const newContact = await contactsAPI.create({
   *   name: 'João Silva',
   *   person_type: 'PF',
   *   document_number: '12345678901',
   *   email: 'joao@example.com'
   * });
   */
  create: async (data) => {
    return apiFetch('/contacts/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Atualiza um contato existente
   * @param {number} id - ID do contato
   * @param {Object} data - Dados a atualizar (mesmos campos de create)
   * @returns {Promise<Object>} Contato atualizado
   * @throws {Error} Se contato não encontrado (404)
   * @example
   * const updated = await contactsAPI.update(1, {
   *   name: 'João Silva Santos',
   *   email: 'joao.novo@example.com'
   * });
   */
  update: async (id, data) => {
    return apiFetch(`/contacts/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Exclui um contato
   * @param {number} id - ID do contato
   * @returns {Promise<null>} null (204 No Content)
   * @throws {Error} Se contato não encontrado (404)
   * @example
   * await contactsAPI.delete(1);
   * // Contato excluído permanentemente
   */
  delete: async (id) => {
    return apiFetch(`/contacts/${id}/`, {
      method: 'DELETE',
    });
  },

  /**
   * Upload contact photo
   */
  uploadPhoto: async (id, photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);

    const token = getAuthToken();
    const url = `${getApiBaseUrl()}/contacts/${id}/upload-photo/`;
    const response = await fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Photo Upload Error: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Remove contact photo
   */
  removePhoto: async (id) => {
    return apiFetch(`/contacts/${id}/remove-photo/`, {
      method: 'DELETE',
    });
  },

  /**
   * Get statistics
   */
  getStatistics: async () => {
    return apiFetch('/contacts/statistics/');
  },

  /**
   * Search contacts
   */
  search: async (searchTerm) => {
    return contactsAPI.getAll({ search: searchTerm });
  },

  /**
   * Filter by person type (PF or PJ)
   */
  filterByPersonType: async (personType) => {
    return contactsAPI.getAll({ person_type: personType });
  },
};

export default contactsAPI;
