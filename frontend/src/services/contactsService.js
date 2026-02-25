/**
 * @fileoverview Service for Contacts API
 * @module services/contactsService
 * 
 * Handles all API calls related to contacts (clients, parties, etc.)
 */

import { apiFetch } from '@/utils/apiFetch.js';

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
