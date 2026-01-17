import React, { createContext, useState, useCallback } from 'react';

export const UIContext = createContext();

/**
 * UIProvider Component
 * Manages global UI state: modals, notifications, menus
 */
export function UIProvider({ children }) {
  const [activeModal, setActiveModal] = useState(null);
  const [modals, setModals] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [menus, setMenus] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openModal = useCallback((type, data = {}) => {
    setActiveModal(type);
    setModals(prev => ({ ...prev, [type]: data }));
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const toggleMenu = useCallback((name) => {
    setMenus(prev => ({
      ...prev,
      [name]: !prev[name],
    }));
  }, []);

  const closeMenu = useCallback((name) => {
    setMenus(prev => ({
      ...prev,
      [name]: false,
    }));
  }, []);

  const value = {
    activeModal,
    modals,
    notifications,
    toasts: notifications,
    menus,
    sidebarOpen,
    setSidebarOpen,
    openModal,
    closeModal,
    showNotification,
    dismissNotification,
    toggleMenu,
    closeMenu,
  };

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
  const context = React.useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
}
