// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { QueryProvider } from './providers/QueryProvider';
import { RootProvider } from './contexts';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryProvider>
      <ErrorBoundary>
        <RootProvider>
          <App />
        </RootProvider>
      </ErrorBoundary>
    </QueryProvider>
  </StrictMode>
);