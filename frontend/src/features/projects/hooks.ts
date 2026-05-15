import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as projectsApi from '../../api/projects.ts';
import * as membersApi from '../../api/members.ts';

export const useMyProjects = () =>
  useQuery({ queryKey: ['projects'], queryFn: projectsApi.getProjects });

export const useProject = (id: string | undefined) =>
  useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.getProject(id!),
    enabled: !!id,
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
};

export const useUpdateProject = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      projectsApi.updateProject(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects', id] });
    },
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
};

export const useAddMember = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string }) => membersApi.addMember(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations', 'project', projectId] }),
  });
};

export const useChangeMemberRole = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      membersApi.changeMemberRole(projectId, userId, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  });
};

export const useRemoveMember = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => membersApi.removeMember(projectId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  });
};
