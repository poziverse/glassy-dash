import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  // Initial state
  activeModal: null,
  modals: {},
  notifications: [],
  toasts: [], // Alias for notifications
  menus: {},
  sidebarOpen: false,
  settingsPanelOpen: false,
  genericConfirmOpen: false,
  genericConfirmConfig: {},

  // Actions
  openModal: (type, data = {}) => {
    set({
      activeModal: type,
      modals: { ...get().modals, [type]: data }
    });
  },

  closeModal: () => {
    set({ activeModal: null });
  },

  showNotification: (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const notification = { id, message, type };
    set(state => ({ 
      notifications: [...state.notifications, notification],
      toasts: [...state.toasts, notification]
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().dismissNotification(id);
      }, duration);
    }

    return id;
  },

  showToast: (message, type = 'info', duration = 3000) => {
    return get().showNotification(message, type, duration);
  },

  dismissNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
      toasts: state.toasts.filter(n => n.id !== id)
    }));
  },

  toggleMenu: (name) => {
    set(state => ({
      menus: { ...state.menus, [name]: !state.menus[name] }
    }));
  },

  closeMenu: (name) => {
    set(state => ({
      menus: { ...state.menus, [name]: false }
    }));
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSidebar: () => {
    set(state => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSettingsPanelOpen: (open) => set({ settingsPanelOpen: open }),

  toggleSettingsPanel: () => {
    set(state => ({ settingsPanelOpen: !state.settingsPanelOpen }));
  },

  showGenericConfirm: (config) => {
    set({ 
      genericConfirmConfig: config,
      genericConfirmOpen: true
    });
  },

  setGenericConfirmOpen: (open) => set({ genericConfirmOpen: open }),

  setGenericConfirmConfig: (config) => set({ genericConfirmConfig: config })
}));