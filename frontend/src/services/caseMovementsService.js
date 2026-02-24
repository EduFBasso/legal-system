/**
 * Service for Case Movements API
 */
import api from './api';

const BASE_URL = '/case-movements';

/**
 * Get all movements for a specific case
 */
export const getMovementsByCase = async (caseId) => {
  const response = await api.get(`${BASE_URL}/?case_id=${caseId}`);
  return response.data;
};

/**
 * Get a single movement by ID
 */
export const getMovementById = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}/`);
  return response.data;
};

/**
 * Create a new movement
 */
export const createMovement = async (movementData) => {
  const response = await api.post(`${BASE_URL}/`, movementData);
  return response.data;
};

/**
 * Update a movement
 */
export const updateMovement = async (id, movementData) => {
  const response = await api.put(`${BASE_URL}/${id}/`, movementData);
  return response.data;
};

/**
 * Partially update a movement
 */
export const patchMovement = async (id, partialData) => {
  const response = await api.patch(`${BASE_URL}/${id}/`, partialData);
  return response.data;
};

/**
 * Delete a movement
 */
export const deleteMovement = async (id) => {
  const response = await api.delete(`${BASE_URL}/${id}/`);
  return response.data;
};

export default {
  getMovementsByCase,
  getMovementById,
  createMovement,
  updateMovement,
  patchMovement,
  deleteMovement,
};
