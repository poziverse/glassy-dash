import React, { createContext, useState, useCallback } from 'react';

export const ModalContext = createContext();

/**
 * ModalProvider Component
 * Manages the state of the modal for editing notes
 */
export function ModalProvider({ children }) {
  const [activeId, setActiveId] = useState(null);
  const [note, setNote] = useState(null);
  const [originalNote, setOriginalNote] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const openNote = useCallback((noteData) => {
    setActiveId(noteData.id);
    setNote({ ...noteData });
    setOriginalNote({ ...noteData });
    setIsDirty(false);
  }, []);

  const closeNote = useCallback(() => {
    setActiveId(null);
    setNote(null);
    setOriginalNote(null);
    setIsDirty(false);
    setIsSaving(false);
  }, []);

  const resetChanges = useCallback(() => {
    if (originalNote) {
      setNote({ ...originalNote });
      setIsDirty(false);
    }
  }, [originalNote]);

  const updateNote = useCallback((updates) => {
    setNote(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      // Check if changed from original
      const changed = JSON.stringify(updated) !== JSON.stringify(originalNote);
      setIsDirty(changed);
      return updated;
    });
  }, [originalNote]);

  const value = {
    activeId,
    setActiveId,
    note,
    setNote,
    originalNote,
    setOriginalNote,
    isDirty,
    setIsDirty,
    isSaving,
    setIsSaving,
    openNote,
    closeNote,
    resetChanges,
    updateNote,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

/**
 * useModal Hook
 * Convenience hook to access modal context
 */
export function useModal() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}
