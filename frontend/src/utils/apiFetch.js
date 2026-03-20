/**
 * @fileoverview Centralized API fetch wrapper with error handling
 * @module utils/apiFetch
 * 
 * This module provides a unified fetch wrapper for all API calls across the application.
 * Eliminates code duplication and allows for easy addition of common features like:
 * - Authorization tokens
 * - Error logging
 * - Request/response interceptors
 * - Retry logic (future)
 */

function resolveApiBaseUrl() {
  const configuredUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const protocol = window.location.protocol || 'http:';
    return `${protocol}//${window.location.hostname}:8000/api`;
  }

  return 'http://127.0.0.1:8000/api';
}

const API_BASE_URL = resolveApiBaseUrl();
const AUTH_STORAGE_KEY = 'legal_system_auth';

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAuthToken() {
  return getStoredAuth()?.access || null;
}

/**
 * Generic API fetch wrapper with error handling
 * 
 * @param {string} endpoint - API endpoint (e.g., '/cases/', '/payments/')
 * @param {Object} options - Fetch options
 * @param {string} options.method - HTTP method (GET, POST, PATCH, DELETE, etc) - default: GET
 * @param {Object} options.headers - Custom headers
 * @param {string} options.body - Request body (will be sent as JSON)
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} With formatted error message
 * 
 * @example
 * // GET request
 * const cases = await apiFetch('/cases/?status=ATIVO');
 * 
 * @example
 * // POST request
 * const newCase = await apiFetch('/cases/', {
 *   method: 'POST',
 *   body: JSON.stringify({ numero_processo: '1234567-89.2021.8.26.0100', ... })
 * });
 * 
 * @example
 * // PATCH request
 * const updated = await apiFetch('/cases/123/', {
 *   method: 'PATCH',
 *   body: JSON.stringify({ status: 'ATIVO' })
 * });
 * 
 * @example
 * // DELETE request
 * await apiFetch('/cases/123/', { method: 'DELETE' });
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle HTTP errors (4xx, 5xx)
    if (!response.ok) {
      // Try to parse error response
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);

      // 401: sessão/token inválido ou expirado
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));

        const apiError = new Error('Sessão expirada. Faça login novamente.');
        apiError.status = response.status;
        apiError.code = errorData?.code || 'token_not_valid';
        throw apiError;
      }

      const formatErrorValue = (value) => {
        if (Array.isArray(value)) {
          return value.map(formatErrorValue).join(', ');
        }

        if (value && typeof value === 'object') {
          if (typeof value.message === 'string') {
            return value.message;
          }

          if (typeof value.detail === 'string') {
            return value.detail;
          }

          return Object.entries(value)
            .map(([k, v]) => `${k}: ${formatErrorValue(v)}`)
            .join('; ');
        }

        return String(value ?? '');
      };

      const serverMessage =
        (typeof errorData?.error === 'string' && errorData.error.trim())
        || (typeof errorData?.message === 'string' && errorData.message.trim())
        || (typeof errorData?.detail === 'string' && errorData.detail.trim())
        || (typeof errorData === 'string' && errorData.trim())
        || '';

      if (serverMessage) {
        const apiError = new Error(serverMessage);
        apiError.status = response.status;
        throw apiError;
      }
      
      // Format validation errors from Django
      if (errorData && typeof errorData === 'object') {
        const errors = Object.entries(errorData)
          .map(([field, messages]) => {
            const msg = formatErrorValue(messages);
            return `${field}: ${msg}`;
          })
          .join('\n');
        const apiError = new Error(errors || `API Error: ${response.status}`);
        apiError.status = response.status;
        throw apiError;
      }
      
      const detail = errorData.detail || `API Error: ${response.status}`;

      const apiError = new Error(detail);
      apiError.status = response.status;
      throw apiError;
    }

    // 204 No Content (DELETE) returns null
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
 * Get the API base URL
 * Useful for logging or debugging
 * 
 * @returns {string} API_BASE_URL
 */
export function getApiBaseUrl() {
  return API_BASE_URL;
}

export default apiFetch;
