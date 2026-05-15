import api from '../lib/axios.ts';

export const getProjects = () =>
  api.get('/api/projects').then((r) => r.data.data.projects);

export const createProject = (data: { name: string; description?: string }) =>
  api.post('/api/projects', data).then((r) => r.data.data.project);

export const getProject = (id: string) =>
  api.get(`/api/projects/${id}`).then((r) => r.data.data.project);

export const updateProject = (id: string, data: { name?: string; description?: string }) =>
  api.patch(`/api/projects/${id}`, data).then((r) => r.data.data.project);

export const deleteProject = (id: string) => api.delete(`/api/projects/${id}`);
