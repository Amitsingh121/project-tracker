import api from '../lib/axios.js';

export const getProjects = () => api.get('/api/projects').then((r) => r.data.data.projects);

export const createProject = (data) =>
  api.post('/api/projects', data).then((r) => r.data.data.project);

export const getProject = (id) =>
  api.get(`/api/projects/${id}`).then((r) => r.data.data.project);

export const updateProject = (id, data) =>
  api.patch(`/api/projects/${id}`, data).then((r) => r.data.data.project);

export const deleteProject = (id) => api.delete(`/api/projects/${id}`);
