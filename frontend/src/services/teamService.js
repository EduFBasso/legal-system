import { apiFetch } from '@/utils/apiFetch.js';

export async function getTeamMembers({ includeInactive = false, role = null } = {}) {
  const params = new URLSearchParams();
  if (includeInactive) params.set('include_inactive', 'true');
  if (role) params.set('role', role);
  const qs = params.toString();
  const endpoint = qs ? `/auth/team/?${qs}` : '/auth/team/';
  const data = await apiFetch(endpoint);
  return Array.isArray(data?.results) ? data.results : [];
}

export async function createTeamMember(memberData) {
  return await apiFetch('/auth/team/', {
    method: 'POST',
    body: JSON.stringify(memberData),
  });
}

export async function updateTeamMember(id, memberData) {
  return await apiFetch(`/auth/team/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(memberData),
  });
}

export async function deactivateTeamMember(id) {
  return await apiFetch(`/auth/team/${id}/deactivate/`, { method: 'POST' });
}

export async function reactivateTeamMember(id) {
  return await apiFetch(`/auth/team/${id}/reactivate/`, { method: 'POST' });
}
