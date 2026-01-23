/**
 * Contexts Index
 * Central export point for all React Context providers and hooks
 * 
 * Note: Components can now use Zustand stores directly from ../stores/
 * For backward compatibility during migration, useNotesCompat() is available
 */

import { AuthProvider } from './AuthContext';
import { NotesProvider } from './NotesContext';
import { SettingsProvider } from './SettingsContext';
import { UIProvider } from './UIContext';
import { ComposerProvider } from './ComposerContext';
import { ModalProvider } from './ModalContext';
import ErrorBoundary from '../components/ErrorBoundary';

// Context exports (for backward compatibility)
export * from './AuthContext';
export * from './NotesContext';
export * from './SettingsContext';
export * from './UIContext';
export * from './ComposerContext';
export * from './ModalContext';

// Zustand stores (recommended for new code)
export { useAuthStore } from '../stores/authStore';
export { useNotesStore } from '../stores/notesStore';
export { useSettingsStore } from '../stores/settingsStore';
export { useUIStore } from '../stores/uiStore';

// Compatibility hooks (for gradual migration)
export { useNotesCompat } from '../hooks/useNotesCompat';

/**
 * RootProvider Component
 * 
 * DEPRECATED: No longer needed with Zustand stores
 * App.jsx now uses stores directly instead of context providers
 * 
 * This component is kept for backward compatibility during migration
 * Components should migrate to use Zustand stores directly:
 * - useAuthStore() for auth state
 * - useNotesStore() for notes state  
 * - useSettingsStore() for settings state
 * - useUIStore() for UI state
 * 
 * Or use compatibility hooks:
 * - useAuth() from AuthContext (will be removed in future)
 * - useNotesCompat() from useNotesCompat hook (temporary during migration)
 */
export function RootProvider({ children }) {
  return (
    <ErrorBoundary name="AppRoot">
      <ErrorBoundary name="AuthProvider">
        <AuthProvider>
          <ErrorBoundary name="NotesProvider">
            <NotesProvider>
              <ErrorBoundary name="SettingsProvider">
                <SettingsProvider>
                  <ErrorBoundary name="UIProvider">
                    <UIProvider>
                      <ErrorBoundary name="ComposerProvider">
                        <ComposerProvider>
                          <ErrorBoundary name="ModalProvider">
                            <ModalProvider>
                              {children}
                            </ModalProvider>
                          </ErrorBoundary>
                        </ComposerProvider>
                      </ErrorBoundary>
                    </UIProvider>
                  </ErrorBoundary>
                </SettingsProvider>
              </ErrorBoundary>
            </NotesProvider>
          </ErrorBoundary>
        </AuthProvider>
      </ErrorBoundary>
    </ErrorBoundary>
  );
}