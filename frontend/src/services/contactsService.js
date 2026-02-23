/**
 * @fileoverview Service for Contacts API
 * @module services/contactsService
 * 
 * Handles all API calls related to contacts (clients, parties, etc.)
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Generic API fetch wrapper with error handling
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
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Get all contacts with optional filtering
 * @param {Object} params - Query parameters (search, person_type, etc.)
 * @returns {Promise<Array>} Array of contacts
 */
export async function getAllContacts(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `/contacts/?${queryString}` : '/contacts/';
  return await apiFetch(endpoint);
}

/**
 * Get a single contact by ID
 * @param {number} id - Contact ID
 * @returns {Promise<Object>} Contact data
 */
export async function getContactById(id) {
  return await apiFetch(`/contacts/${id}/`);
}

/**
 * Search contacts by name or document
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching contacts
 */
export async function searchContacts(query) {
  return await apiFetch(`/contacts/?search=${encodeURIComponent(query)}`);
}

export default {
  getAllContacts,
  getContactById,
  searchContacts,
};
