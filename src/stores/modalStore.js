import { create } from 'zustand'

export const useModalStore = create((set, get) => ({
  // Modal visibility and note data
  open: false,
  activeId: null,
  activeNoteObj: null,
  isEditing: false,
  isSaving: false,
  modalHasChanges: false,

  // Note content
  mType: 'text',
  mTitle: '',
  mBody: '',
  mItems: [],
  mInput: '',
  mDrawingData: { paths: [], dimensions: null },

  // Note appearance
  mColor: 'default',
  mTransparency: null,
  mImages: [],
  imgViewOpen: false,
  mImagesViewIndex: 0,

  // Tags
  tagInput: '',
  mTagList: [],

  // Modal flags
  viewMode: 'edit',
  showModalFmt: false,
  modalMenuOpen: false,
  showModalColorPop: false,
  showModalTransPop: false,
  confirmDeleteOpen: false,

  // Collaboration state
  collaborationModalOpen: false,
  collaboratorUsername: '',
  showUserDropdown: false,
  filteredUsers: [],
  addModalCollaborators: [],
  loadingUsers: false,
  dropdownPosition: { top: 0, left: 0, width: 0 },

  // Drag and drop
  checklistDragId: null,

  showConfirmClose: false,

  // Original values for change detection
  originalValues: {
    title: '',
    body: '',
    tags: [],
    color: 'default',
    transparency: null,
    images: [],
    items: [],
    drawingData: null,
  },

  // Actions
  openNote: note => {
    const drawingData =
      note?.type === 'draw' && note?.content
        ? (() => {
            try {
              return JSON.parse(note.content)
            } catch (e) {
              return { paths: [], dimensions: null }
            }
          })()
        : { paths: [], dimensions: null }

    set({
      open: true,
      activeId: note?.id || null,
      activeNoteObj: note || null,
      isEditing: !!note,
      isSaving: false,
      modalHasChanges: false,
      mType: note?.type || 'text',
      mTitle: note?.title || '',
      mBody: note?.content || '',
      mItems: note?.items || [],
      mDrawingData: drawingData,
      mColor: note?.color || 'default',
      mTransparency: note?.transparency || null,
      mImages: note?.images || [],
      mTagList: note?.tags || [],
      viewMode: 'edit',
      originalValues: {
        title: note?.title || '',
        body: note?.content || '',
        tags: note?.tags || [],
        color: note?.color || 'default',
        transparency: note?.transparency || null,
        images: note?.images || [],
        items: note?.items || [],
        drawingData: drawingData,
      },
    })
  },

  closeNote: () => {
    set({
      open: false,
      activeId: null,
      activeNoteObj: null,
      isEditing: false,
      isSaving: false,
      modalHasChanges: false,
      mType: 'text',
      mTitle: '',
      mBody: '',
      mItems: [],
      mInput: '',
      mDrawingData: { paths: [], dimensions: null },
      mColor: 'default',
      mTransparency: null,
      mImages: [],
      imgViewOpen: false,
      mImagesViewIndex: 0,
      tagInput: '',
      mTagList: [],
      viewMode: 'edit',
      showModalFmt: false,
      modalMenuOpen: false,
      showModalColorPop: false,
      showModalTransPop: false,
      confirmDeleteOpen: false,
      collaborationModalOpen: false,
      collaboratorUsername: '',
      showUserDropdown: false,
      filteredUsers: [],
      addModalCollaborators: [],
    })
  },

  setMTitle: title => set({ mTitle: title }),
  setMBody: body => set({ mBody: body }),
  setMType: type => set({ mType: type }),
  setMItems: items => set({ mItems: items }),
  setMInput: input => set({ mInput: input }),
  setMDrawingData: data => set({ mDrawingData: data }),
  setMColor: color => set({ mColor: color }),
  setMTransparency: transparency => set({ mTransparency: transparency }),
  setMImages: images => set({ mImages: images }),
  setTagInput: input => set({ tagInput: input }),
  setMTagList: tagList => set({ mTagList: tagList }),
  setViewMode: mode => set({ viewMode: mode, showModalFmt: false }),
  setShowModalFmt: show => set({ showModalFmt: show }),
  setModalMenuOpen: open => set({ modalMenuOpen: open }),
  setShowModalColorPop: show => set({ showModalColorPop: show }),
  setShowModalTransPop: show => set({ showModalTransPop: show }),
  setConfirmDeleteOpen: open => set({ confirmDeleteOpen: open }),
  setCollaborationModalOpen: open => set({ collaborationModalOpen: open }),
  setCollaboratorUsername: username => set({ collaboratorUsername: username }),
  setShowUserDropdown: show => set({ showUserDropdown: show }),
  setFilteredUsers: users => set({ filteredUsers: users }),
  setAddModalCollaborators: collaborators => set({ addModalCollaborators: collaborators }),
  setLoadingUsers: loading => set({ loadingUsers: loading }),
  setDropdownPosition: position => set({ dropdownPosition: position }),
  setChecklistDragId: id => set({ checklistDragId: id }),
  setSaving: isSaving => set({ isSaving }),
  setShowConfirmClose: show => set({ showConfirmClose: show }),
  setMImagesViewIndex: index => set({ mImagesViewIndex: index }),
  setImgViewOpen: open => set({ imgViewOpen: open }),

  setModalHasChanges: hasChanges => set({ modalHasChanges: hasChanges }),

  resetModal: () => {
    const { originalValues } = get()
    set({
      mTitle: originalValues.title,
      mBody: originalValues.body,
      mItems: originalValues.items,
      mDrawingData: originalValues.drawingData,
      mColor: originalValues.color,
      mTransparency: originalValues.transparency,
      mImages: originalValues.images,
      mTagList: originalValues.tags,
      modalHasChanges: false,
    })
  },
}))
