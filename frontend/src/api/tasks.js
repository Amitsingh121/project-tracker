import api from '../lib/axios.js';

export const getTasks = (projectId, params) =>
  api.get(`/api/projects/${projectId}/tasks`, { params }).then((r) => r.data.data.tasks);

export const createTask = (projectId, data) =>
  api.post(`/api/projects/${projectId}/tasks`, data).then((r) => r.data.data.task);

export const updateTask = (taskId, data) =>
  api.patch(`/api/tasks/${taskId}`, data).then((r) => r.data.data.task);

export const deleteTask = (taskId) => api.delete(`/api/tasks/${taskId}`);
