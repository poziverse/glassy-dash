// src/main.jsx
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './components/ErrorFallback';
import LoadingSpinner from './components/LoadingSpinner';
import { QueryProvider } from './providers/QueryProvider';
import { RootProvider } from './contexts';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingSpinner />}>
        <QueryProvider>
          <RootProvider>
            <App />
          </RootProvider>
        </QueryProvider>
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
);
