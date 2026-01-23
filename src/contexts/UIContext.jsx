import React, { createContext, useMemo, useContext } from 'react';
import { useUIStore } from '../stores/uiStore';

export const UIContext = createContext();

/**
 * UIProvider Component
 * Bridge between Zustand useUIStore and legacy Context consumers
 */
export function UIProvider({ children }) {
  const store = useUIStore();

  const value = useMemo(() => ({
    activeModal: store.activeModal,
    modals: store.modals,
    notifications: store.notifications,
    toasts: store.toasts,
    menus: store.menus,
    sidebarOpen: store.sidebarOpen,
    setSidebarOpen: store.setSidebarOpen,
    settingsPanelOpen: store.settingsPanelOpen,
    setSettingsPanelOpen: store.setSettingsPanelOpen,
    genericConfirmOpen: store.genericConfirmOpen,
    setGenericConfirmOpen: store.setGenericConfirmOpen,
    genericConfirmConfig: store.genericConfirmConfig,
    setGenericConfirmConfig: store.setGenericConfirmConfig,
    openModal: store.openModal,
    closeModal: store.closeModal,
    showNotification: store.showNotification,
    showToast: store.showToast,
    dismissNotification: store.dismissNotification,
    toggleMenu: store.toggleMenu,
    closeMenu: store.closeMenu,
    showGenericConfirm: store.showGenericConfirm,
  }), [store]);

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

/**
 * useUI Hook
 * Convenience hook to access UI context
 */
export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
}