import React, { createContext, useState, useCallback } from 'react';

export const ComposerContext = createContext();

/**
 * ComposerProvider Component
 * Manages the state of the note composer (for creating/editing notes)
 */
export function ComposerProvider({ children }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("text"); // 'text' | 'checklist' | 'draw'
  const [color, setColor] = useState("default");
  const [items, setItems] = useState([]); // for checklist type
  const [images, setImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [collapsed, setCollapsed] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);

  const reset = useCallback(() => {
    setTitle("");
    setContent("");
    setType("text");
    setColor("default");
    setItems([]);
    setImages([]);
    setTags([]);
    setCollapsed(true);
    setIsDrawing(false);
  }, []);

  const addItem = useCallback((text) => {
    const newItem = {
      id: Date.now(),
      text,
      done: false,
    };
    setItems(prev => [...prev, newItem]);
    return newItem.id;
  }, []);

  const updateItem = useCallback((id, updates) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const addImage = useCallback((imageData) => {
    const newImage = {
      id: Date.now(),
      ...imageData,
    };
    setImages(prev => [...prev, newImage]);
    return newImage.id;
  }, []);

  const removeImage = useCallback((id) => {
    setImages(prev => prev.filter(img => img.id === id));
  }, []);

  const addTag = useCallback((tag) => {
    setTags(prev => [...new Set([...prev, tag])]);
  }, []);

  const removeTag = useCallback((tag) => {
    setTags(prev => prev.filter(t => t !== tag));
  }, []);

  const value = {
    title,
    setTitle,
    content,
    setContent,
    type,
    setType,
    color,
    setColor,
    items,
    setItems,
    images,
    setImages,
    tags,
    setTags,
    collapsed,
    setCollapsed,
    isDrawing,
    setIsDrawing,
    reset,
    addItem,
    updateItem,
    removeItem,
    addImage,
    removeImage,
    addTag,
    removeTag,
  };

  return (
    <ComposerContext.Provider value={value}>
      {children}
    </ComposerContext.Provider>
  );
}

/**
 * useComposer Hook
 * Convenience hook to access composer context
 */
export function useComposer() {
  const context = React.useContext(ComposerContext);
  if (!context) {
    throw new Error('useComposer must be used within ComposerProvider');
  }
  return context;
}
