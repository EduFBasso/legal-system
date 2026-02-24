/**
 * Service for Case Movements API
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Generic API fetch wrapper
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

/**
 * Get all movements for a specific case
 */
export const getMovementsByCase = async (caseId) => {
  return await apiFetch(`/case-movements/?case_id=${caseId}`);
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
