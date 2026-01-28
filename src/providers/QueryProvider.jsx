import { QueryClientProvider } from '@tanstack/react-query'

import { queryClient } from '../lib/queryClient'

/**
 * QueryProvider
 * Wraps the application with TanStack Query context
 * Includes dev tools for debugging cache and queries
 */
export function QueryProvider({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
