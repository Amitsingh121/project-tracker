import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as tasksApi from '../../api/tasks.js';

export const useTasks = (projectId) =>
  useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.getTasks(projectId),
    enabled: !!projectId,
  });

export const useCreateTask = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => tasksApi.createTask(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateTask = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }) => tasksApi.updateTask(taskId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });
};

export const useDeleteTask = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tasksApi.deleteTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
