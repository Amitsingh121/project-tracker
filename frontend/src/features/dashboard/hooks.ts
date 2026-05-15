import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../../api/dashboard.ts';

export const useDashboard = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: getDashboard, staleTime: 30000 });
