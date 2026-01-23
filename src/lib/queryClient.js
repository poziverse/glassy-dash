import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient Configuration
 * Optimized settings for Glass Keep's data fetching needs
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep cached data for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Don't refetch on window focus (prevents unnecessary requests)
      refetchOnWindowFocus: false,
      // Retry failed requests up to 2 times
      retry: 2,
      // Retry delay with exponential backoff (1s, 2s, 4s, max 30s)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      // Refetch on reconnect if user was offline
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});