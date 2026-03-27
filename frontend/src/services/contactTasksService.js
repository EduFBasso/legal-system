import { apiFetch } from '@/utils/apiFetch.js';

export const getAllTasks = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return await apiFetch(`/contact-tasks/${queryString ? `?${queryString}` : ''}`);
};

export const getTasksCount = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return await apiFetch(`/contact-tasks/count/${queryString ? `?${queryString}` : ''}`);
};

export const createTask = async (taskData) => {
  return await apiFetch('/contact-tasks/', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
};

export const patchTask = async (taskId, patchData) => {
  return await apiFetch(`/contact-tasks/${taskId}/`, {
    method: 'PATCH',
    body: JSON.stringify(patchData),
  });
};

export const deleteTask = async (taskId) => {
  return await apiFetch(`/contact-tasks/${taskId}/`, {
    method: 'DELETE',
  });
};

export default {
  getAllTasks,
  getTasksCount,
  createTask,
  patchTask,
  deleteTask,
};
