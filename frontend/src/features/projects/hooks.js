import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as projectsApi from '../../api/projects.js';
import * as membersApi from '../../api/members.js';

export const useMyProjects = () =>
  useQuery({ queryKey: ['projects'], queryFn: projectsApi.getProjects });

export const useProject = (id) =>
  useQuery({ queryKey: ['projects', id], queryFn: () => projectsApi.getProject(id), enabled: !!id });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
};

export const useUpdateProject = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => projectsApi.updateProject(id, data),
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

export const useAddMember = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => membersApi.addMember(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  });
};

export const useChangeMemberRole = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }) => membersApi.changeMemberRole(projectId, userId, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  });
};

export const useRemoveMember = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => membersApi.removeMember(projectId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  });
};
