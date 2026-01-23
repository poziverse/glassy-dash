import { create } from 'zustand'

export const useComposerStore = create((set, get) => ({
  // Initial state
  isOpen: false,
  composerType: 'text',
  composerColor: 'default',
  composerTitle: '',
  composerContent: '',
  composerTags: '',
  composerItems: [],
  composerImages: [],
  composerDrawingData: { paths: [], dimensions: null },
  composerPinned: false,
  composerHasChanges: false,
  isComposing: false,
  collapsed: true,
  clInput: '',
  showFormatting: false,
  showColorPicker: false,

  // Actions
  openComposer: () => {
    set({
      isOpen: true,
      composerType: 'text',
      composerColor: 'default',
      composerTitle: '',
      composerContent: '',
      composerTags: '',
      composerItems: [],
      composerImages: [],
      composerDrawingData: { paths: [], dimensions: null },
      composerPinned: false,
      composerHasChanges: false,
      isComposing: false,
      collapsed: false,
    })
  },

  closeComposer: () => {
    set({
      isOpen: false,
      composerType: 'text',
      composerColor: 'default',
      composerTitle: '',
      composerContent: '',
      composerTags: '',
      composerItems: [],
      composerImages: [],
      composerDrawingData: { paths: [], dimensions: null },
      composerPinned: false,
      composerHasChanges: false,
      isComposing: false,
      collapsed: true,
    })
  },

  setComposerType: type => set({ composerType: type, composerHasChanges: true }),
  setComposerColor: color => set({ composerColor: color, composerHasChanges: true }),
  setComposerTitle: title => set({ composerTitle: title, composerHasChanges: true }),
  setComposerContent: content => set({ composerContent: content, composerHasChanges: true }),
  setComposerTags: tags => set({ composerTags: tags, composerHasChanges: true }),
  setComposerImages: images => set({ composerImages: images, composerHasChanges: true }),
  setComposerDrawingData: data => set({ composerDrawingData: data, composerHasChanges: true }),
  setCollapsed: collapsed => set({ collapsed }),
  setClInput: clInput => set({ clInput }),
  setShowFormatting: show => set({ showFormatting: show }),
  setShowColorPicker: show => set({ showColorPicker: show }),

  addComposerItem: item =>
    set(state => ({
      composerItems: [...state.composerItems, item],
      composerHasChanges: true,
    })),

  updateComposerItem: (itemId, updates) =>
    set(state => ({
      composerItems: state.composerItems.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
      composerHasChanges: true,
    })),

  deleteComposerItem: itemId =>
    set(state => ({
      composerItems: state.composerItems.filter(item => item.id !== itemId),
      composerHasChanges: true,
    })),

  setComposerPinned: pinned => set({ composerPinned: pinned, composerHasChanges: true }),

  setComposing: isComposing => set({ isComposing }),

  resetComposer: () => {
    set({
      composerType: 'text',
      composerColor: 'default',
      composerTitle: '',
      composerContent: '',
      composerTags: '',
      composerItems: [],
      composerImages: [],
      composerDrawingData: { paths: [], dimensions: null },
      composerPinned: false,
      composerHasChanges: false,
      isComposing: false,
      collapsed: true,
      clInput: '',
      showFormatting: false,
      showColorPicker: false,
    })
  },
}))
