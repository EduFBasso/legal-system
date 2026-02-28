import { apiFetch } from '@/utils/apiFetch.js';

export const getTasksByCase = async (caseId) => {
  return await apiFetch(`/case-tasks/?case_id=${caseId}`);
};

export const createTask = async (taskData) => {
  return await apiFetch('/case-tasks/', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
};

export const updateTask = async (id, taskData) => {
  return await apiFetch(`/case-tasks/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  });
};

export const patchTask = async (id, partialData) => {
  return await apiFetch(`/case-tasks/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(partialData),
  });
};

export const deleteTask = async (id) => {
  return await apiFetch(`/case-tasks/${id}/`, {
    method: 'DELETE',
  });
};

export default {
  getTasksByCase,
  createTask,
  updateTask,
  patchTask,
  deleteTask,
};
