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
 */
export function RootProvider({ children }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <UIProvider>
          <ComposerProvider>
            <ModalProvider>
              {children}
            </ModalProvider>
          </ComposerProvider>
        </UIProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
