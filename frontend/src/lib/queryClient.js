import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 min - keeps things snappy without hammering the API
      retry: 1,
    },
  },
});
