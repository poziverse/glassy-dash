import React from 'react'
import { useModal } from '../contexts/ModalContext'
import { useModalStore } from '../stores/modalStore'
import Modal from './Modal'

/**
 * ModalWrapper - Adapter Pattern for Gradual Migration
 *
 * This component bridges the Context API and Zustand stores,
 * allowing for incremental migration of Modal.jsx features.
 *
 * Initially, all state comes from Context API.
 * Gradually, features are migrated one at a time:
 * 1. Read state from both sources
 * 2. Zustand takes precedence for migrated features
 * 3. Context API provides defaults for unmigrated features
 * 4. Test each feature independently
 */

const ModalWrapper = () => {
  // Read from Context API (old system)
  const contextState = useModal()

  // Read from Zustand (new system)
  // Currently undefined - will be populated as features migrate
  const zustandOpen = useModalStore(state => state.open)
  const zustandActiveId = useModalStore(state => state.activeId)
  const zustandActiveNoteObj = useModalStore(state => state.activeNoteObj)
  const zustandIsEditing = useModalStore(state => state.isEditing)
  const zustandIsSaving = useModalStore(state => state.isSaving)
  const zustandModalHasChanges = useModalStore(state => state.modalHasChanges)
  const zustandMType = useModalStore(state => state.mType)
  const zustandMTitle = useModalStore(state => state.mTitle)
  const zustandMBody = useModalStore(state => state.mBody)
  const zustandMItems = useModalStore(state => state.mItems)
  const zustandMInput = useModalStore(state => state.mInput)
  const zustandMDrawingData = useModalStore(state => state.mDrawingData)
  const zustandMColor = useModalStore(state => state.mColor)
  const zustandMTransparency = useModalStore(state => state.mTransparency)
  const zustandMImages = useModalStore(state => state.mImages)
  const zustandImgViewOpen = useModalStore(state => state.imgViewOpen)
  const zustandMImagesViewIndex = useModalStore(state => state.mImagesViewIndex)
  const zustandTagInput = useModalStore(state => state.tagInput)
  const zustandMTagList = useModalStore(state => state.mTagList)
  const zustandViewMode = useModalStore(state => state.viewMode)
  const zustandShowModalFmt = useModalStore(state => state.showModalFmt)
  const zustandModalMenuOpen = useModalStore(state => state.modalMenuOpen)
  const zustandShowModalColorPop = useModalStore(state => state.showModalColorPop)
  const zustandShowModalTransPop = useModalStore(state => state.showModalTransPop)
  const zustandConfirmDeleteOpen = useModalStore(state => state.confirmDeleteOpen)
  const zustandCollaborationModalOpen = useModalStore(state => state.collaborationModalOpen)
  const zustandCollaboratorUsername = useModalStore(state => state.collaboratorUsername)
  const zustandShowUserDropdown = useModalStore(state => state.showUserDropdown)
  const zustandFilteredUsers = useModalStore(state => state.filteredUsers)
  const zustandAddModalCollaborators = useModalStore(state => state.addModalCollaborators)
  const zustandLoadingUsers = useModalStore(state => state.loadingUsers)
  const zustandDropdownPosition = useModalStore(state => state.dropdownPosition)
  const zustandChecklistDragId = useModalStore(state => state.checklistDragId)
  const zustandShowConfirmClose = useModalStore(state => state.showConfirmClose)

  // Get Zustand actions
  const zustandOpenNote = useModalStore(state => state.openNote)
  const zustandCloseNote = useModalStore(state => state.closeNote)
  const zustandSetMTitle = useModalStore(state => state.setMTitle)
  const zustandSetMBody = useModalStore(state => state.setMBody)
  const zustandSetMType = useModalStore(state => state.setMType)
  const zustandSetMItems = useModalStore(state => state.setMItems)
  const zustandSetMInput = useModalStore(state => state.setMInput)
  const zustandSetMDrawingData = useModalStore(state => state.setMDrawingData)
  const zustandSetMColor = useModalStore(state => state.setMColor)
  const zustandSetMTransparency = useModalStore(state => state.setMTransparency)
  const zustandSetMImages = useModalStore(state => state.setMImages)
  const zustandSetTagInput = useModalStore(state => state.setTagInput)
  const zustandSetMTagList = useModalStore(state => state.setMTagList)
  const zustandSetViewMode = useModalStore(state => state.setViewMode)
  const zustandSetShowModalFmt = useModalStore(state => state.setShowModalFmt)
  const zustandSetModalMenuOpen = useModalStore(state => state.setModalMenuOpen)
  const zustandSetShowModalColorPop = useModalStore(state => state.setShowModalColorPop)
  const zustandSetShowModalTransPop = useModalStore(state => state.setShowModalTransPop)
  const zustandSetConfirmDeleteOpen = useModalStore(state => state.setConfirmDeleteOpen)
  const zustandSetCollaborationModalOpen = useModalStore(state => state.setCollaborationModalOpen)
  const zustandSetCollaboratorUsername = useModalStore(state => state.setCollaboratorUsername)
  const zustandSetShowUserDropdown = useModalStore(state => state.setShowUserDropdown)
  const zustandSetFilteredUsers = useModalStore(state => state.setFilteredUsers)
  const zustandSetAddModalCollaborators = useModalStore(state => state.setAddModalCollaborators)
  const zustandSetLoadingUsers = useModalStore(state => state.setLoadingUsers)
  const zustandSetDropdownPosition = useModalStore(state => state.setDropdownPosition)
  const zustandSetChecklistDragId = useModalStore(state => state.setChecklistDragId)
  const zustandSetSaving = useModalStore(state => state.setSaving)
  const zustandSetShowConfirmClose = useModalStore(state => state.setShowConfirmClose)
  const zustandResetModal = useModalStore(state => state.resetModal)

  // Merge state - Context API is primary source for now
  // As features migrate, Zustand takes precedence for migrated features
  const mergedProps = {
    ...contextState,
    // Phase 2: Migrate simple features
    open: zustandOpen !== undefined ? zustandOpen : contextState.open,
    activeId: zustandActiveId !== undefined ? zustandActiveId : contextState.activeId,
    activeNoteObj:
      zustandActiveNoteObj !== undefined ? zustandActiveNoteObj : contextState.activeNoteObj,
    isEditing: zustandIsEditing !== undefined ? zustandIsEditing : contextState.isEditing,
    mType: zustandMType !== undefined ? zustandMType : contextState.mType,
    mTitle: zustandMTitle !== undefined ? zustandMTitle : contextState.mTitle,
    mBody: zustandMBody !== undefined ? zustandMBody : contextState.mBody,
    mColor: zustandMColor !== undefined ? zustandMColor : contextState.mColor,
    mTransparency:
      zustandMTransparency !== undefined ? zustandMTransparency : contextState.mTransparency,
    viewMode: zustandViewMode !== undefined ? zustandViewMode : contextState.viewMode,
    isSaving: zustandIsSaving !== undefined ? zustandIsSaving : contextState.isSaving,
    modalHasChanges:
      zustandModalHasChanges !== undefined ? zustandModalHasChanges : contextState.modalHasChanges,
    // Phase 2: Pass Zustand actions
    openNote: zustandOpenNote,
    closeNote: zustandCloseNote,
    setMTitle: zustandSetMTitle,
    setMBody: zustandSetMBody,
    setMType: zustandSetMType,
    setMColor: zustandSetMColor,
    setMTransparency: zustandSetMTransparency,
    setViewMode: zustandSetViewMode,
    setSaving: zustandSetSaving,
  }

  // Ensure nothing is open if mergedProps.open is false
  if (!mergedProps.open) return null

  // Pass merged state and actions to Modal
  // mergedProps already includes contextState and overrides it with Zustand values
  return <Modal {...mergedProps} />
}

export default ModalWrapper
