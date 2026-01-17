/**
 * Contexts Index
 * Central export point for all React Context providers and hooks
 */

export { AuthContext, AuthProvider, useAuth } from './AuthContext';
export { NotesContext, NotesProvider, useNotes } from './NotesContext';
export { SettingsContext, SettingsProvider, useSettings } from './SettingsContext';
export { UIContext, UIProvider, useUI } from './UIContext';
export { ComposerContext, ComposerProvider, useComposer } from './ComposerContext';
export { ModalContext, ModalProvider, useModal } from './ModalContext';

/**
 * RootProvider Component
 * Wraps all context providers in the correct order
 * Usage: <RootProvider> <App /> </RootProvider>
 * 
 * Order matters:
 * 1. AuthProvider - Must be first (needed by NotesProvider)
 * 2. SettingsProvider - No dependencies
 * 3. UIProvider - No dependencies
 * 4. ComposerProvider - No dependencies
 * 5. ModalProvider - No dependencies
 * 
 * NotesProvider is inside AuthProvider to access auth context
 */
export function RootProvider({ children }) {
  return (
    <AuthProvider>
      <NotesProvider>
        <SettingsProvider>
          <UIProvider>
            <ComposerProvider>
              <ModalProvider>
                {children}
              </ModalProvider>
            </ComposerProvider>
          </UIProvider>
        </SettingsProvider>
      </NotesProvider>
    </AuthProvider>
  );
}
