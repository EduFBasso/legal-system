// src/services/api.js
// API Service for backend communication

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Generic fetch wrapper with error handling
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
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // DELETE returns 204 No Content (no body)
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
}

/**
 * Contacts API
 */
export const contactsAPI = {
  /**
   * Get all contacts (no pagination)
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/contacts/?${queryString}` : '/contacts/';
    return apiFetch(endpoint);
  },

  /**
   * Get single contact by ID
   */
  getById: async (id) => {
    return apiFetch(`/contacts/${id}/`);
  },

  /**
   * Create new contact
   */
  create: async (data) => {
    return apiFetch('/contacts/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update existing contact
   */
  update: async (id, data) => {
    return apiFetch(`/contacts/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete contact
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

    const url = `${API_BASE_URL}/contacts/${id}/upload-photo/`;
    const response = await fetch(url, {
      method: 'POST',
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
   * Filter by contact type
   */
  filterByType: async (contactType) => {
    return contactsAPI.getAll({ contact_type: contactType });
  },
};

export default contactsAPI;
