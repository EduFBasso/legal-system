/**
 * Service for Case Movements API
 */

import { apiFetch } from '@/utils/apiFetch.js';

/**
 * Get all movements for a specific case
 */
export const getMovementsByCase = async (caseId) => {
  return await apiFetch(`/case-movements/?case_id=${caseId}`, {
    cache: 'no-store',
  });
};

/**
 * Get a single movement by ID
 */
export const getMovementById = async (id) => {
  return await apiFetch(`/case-movements/${id}/`);
};

/**
 * Create a new movement
 */
export const createMovement = async (movementData) => {
  return await apiFetch('/case-movements/', {
    method: 'POST',
    body: JSON.stringify(movementData),
  });
};

/**
 * Update a movement
 */
export const updateMovement = async (id, movementData) => {
  return await apiFetch(`/case-movements/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(movementData),
  });
};

/**
 * Partially update a movement
 */
export const patchMovement = async (id, partialData) => {
  return await apiFetch(`/case-movements/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(partialData),
  });
};

/**
 * Delete a movement
 */
export const deleteMovement = async (id) => {
  return await apiFetch(`/case-movements/${id}/`, {
    method: 'DELETE',
  });
};

export default {
  getMovementsByCase,
  getMovementById,
  createMovement,
  updateMovement,
  patchMovement,
  deleteMovement,
};
