import api from '../lib/axios.js';

export const addMember = (projectId, data) =>
  api.post(`/api/projects/${projectId}/members`, data).then((r) => r.data.data.member);

export const changeMemberRole = (projectId, userId, data) =>
  api.patch(`/api/projects/${projectId}/members/${userId}`, data).then((r) => r.data.data.member);

export const removeMember = (projectId, userId) =>
  api.delete(`/api/projects/${projectId}/members/${userId}`);
