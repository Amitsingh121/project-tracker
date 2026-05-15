import api from '../lib/axios.ts';

export const addMember = (projectId: string, data: { email: string }) =>
  api.post(`/api/projects/${projectId}/members`, data).then((r) => r.data.data.member);

export const changeMemberRole = (projectId: string, userId: string, data: { role: string }) =>
  api.patch(`/api/projects/${projectId}/members/${userId}`, data).then((r) => r.data.data.member);

export const removeMember = (projectId: string, userId: string) =>
  api.delete(`/api/projects/${projectId}/members/${userId}`);
