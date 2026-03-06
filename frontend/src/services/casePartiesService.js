/**
 * Service for Case Parties (vínculos entre processos e contatos)
 */

import { apiFetch } from '@/utils/apiFetch.js';

/**
 * Get all parties for a specific case
 * @param {number} caseId - Case ID
 * @returns {Promise<Array>} Array of case parties
 */
export async function getPartiesByCase(caseId) {
  return await apiFetch(`/case-parties/?case=${caseId}`);
}

/**
 * Create a new case party (vínculo)
 * @param {Object} data - Party data
 * @param {number} data.case - Case ID
 * @param {number} data.contact - Contact ID
 * @param {string} data.role - Role (AUTOR, REU, TESTEMUNHA, etc)
 * @param {boolean} data.is_client - Is client?
 * @param {string} data.observacoes - Notes
 * @returns {Promise<Object>} Created party
 */
export async function createParty(data) {
  return await apiFetch('/case-parties/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update a case party (partial update)
 * @param {number} id - Party ID
 * @param {Object} data - Updated data
 * @returns {Promise<Object>} Updated party
 */
export async function updateParty(id, data) {
  return await apiFetch(`/case-parties/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a case party (remove vínculo, não deleta Contact)
 * @param {number} id - Party ID
 * @returns {Promise<void>}
 */
export async function deleteParty(id) {
  return await apiFetch(`/case-parties/${id}/`, {
    method: 'DELETE',
  });
}

export default {
  getPartiesByCase,
  createParty,
  updateParty,
  deleteParty,
};
