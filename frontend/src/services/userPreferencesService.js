import { apiFetch } from '@/utils/apiFetch.js';

export async function getUserPreferences() {
  return await apiFetch('/auth/preferences/');
}

export async function updateUserPreferences(preferences) {
  return await apiFetch('/auth/preferences/', {
    method: 'PATCH',
    body: JSON.stringify(preferences),
  });
}

export default {
  getUserPreferences,
  updateUserPreferences,
};