import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { AudioPlaybackProvider } from '../src/contexts/AudioPlaybackContext';
import { NotesProvider } from '../src/contexts/NotesContext';

// Create a QueryClient instance for tests
const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Custom render function that wraps components with required providers
 */
export function renderWithProviders(ui) {
  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={testQueryClient}>
        <NotesProvider>
          <AudioPlaybackProvider>
            {children}
          </AudioPlaybackProvider>
        </NotesProvider>
      </QueryClientProvider>
    );
  }
  return {
    ...render(ui, { wrapper: Wrapper }),
    // Add additional utilities if needed
  };
}

/**
 * Re-export everything from React Testing Library
 */
export * from '@testing-library/react';

/**
 * Override render method
 */
export { renderWithProviders as render };
