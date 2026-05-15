import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../api/invitations.ts';

export const useMyInvitations = () =>
  useQuery({ queryKey: ['invitations'], queryFn: api.getMyInvitations });

export const useProjectInvitations = (projectId: string) =>
  useQuery({
    queryKey: ['invitations', 'project', projectId],
    queryFn: () => api.getProjectInvitations(projectId),
  });

export const useAcceptInvitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.acceptInvitation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useDeclineInvitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.declineInvitation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations'] }),
  });
};
