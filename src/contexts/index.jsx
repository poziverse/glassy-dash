/**
 * Contexts Index
 * Central export point for all React Context providers and hooks
 */

import { AuthProvider } from './AuthContext';
import { NotesProvider } from './NotesContext';
import { SettingsProvider } from './SettingsContext';
import { UIProvider } from './UIContext';
import { ComposerProvider } from './ComposerContext';
import { ModalProvider } from './ModalContext';

export * from './AuthContext';
export * from './NotesContext';
export * from './SettingsContext';
export * from './UIContext';
export * from './ComposerContext';
export * from './ModalContext';

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
