import api from '../lib/axios.ts';

export interface Invitation {
  id: string;
  projectId: string;
  projectName: string;
  invitedByName: string;
  invitedByEmail: string;
  createdAt: string;
  expiresAt: string;
}

export interface PendingProjectInvitation {
  id: string;
  inviteeName: string;
  inviteeEmail: string;
  expiresAt: string;
}

export const getMyInvitations = () =>
  api.get('/api/invitations').then((r) => r.data.data.invitations as Invitation[]);

export const acceptInvitation = (id: string) =>
  api.post(`/api/invitations/${id}/accept`);

export const declineInvitation = (id: string) =>
  api.post(`/api/invitations/${id}/decline`);

export const getProjectInvitations = (projectId: string) =>
  api
    .get(`/api/projects/${projectId}/invitations`)
    .then((r) => r.data.data.invitations as PendingProjectInvitation[]);
