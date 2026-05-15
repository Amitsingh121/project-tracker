import api from '../lib/axios.ts';

export const getTasks = (projectId: string, params?: Record<string, string>) =>
  api.get(`/api/projects/${projectId}/tasks`, { params }).then((r) => r.data.data.tasks);

export const createTask = (projectId: string, data: Record<string, unknown>) =>
  api.post(`/api/projects/${projectId}/tasks`, data).then((r) => r.data.data.task);

export const updateTask = (taskId: string, data: Record<string, unknown>) =>
  api.patch(`/api/tasks/${taskId}`, data).then((r) => r.data.data.task);

export const deleteTask = (taskId: string) => api.delete(`/api/tasks/${taskId}`);
