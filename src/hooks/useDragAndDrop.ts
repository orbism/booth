'use client';

import { useState, useRef, DragEvent, useCallback } from 'react';

interface UseDragAndDropOptions {
  onFileDrop?: (files: FileList) => void;
  acceptedFileTypes?: string[];
}

export function useDragAndDrop({ onFileDrop, acceptedFileTypes }: UseDragAndDropOptions = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const validateFileType = (file: File): boolean => {
    if (!acceptedFileTypes || acceptedFileTypes.length === 0) {
      return true;
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    return acceptedFileTypes.includes(fileExtension);
  };

  const handleDragIn = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      // Validate file types if acceptedFileTypes is provided
      if (acceptedFileTypes && acceptedFileTypes.length > 0) {
        const allFilesValid = Array.from(e.dataTransfer.files).every(validateFileType);
        if (!allFilesValid) {
          console.warn('Some files have invalid file types');
          return;
        }
      }
      
      // Call the onFileDrop callback with the files
      if (onFileDrop) {
        onFileDrop(e.dataTransfer.files);
      }
      
      e.dataTransfer.clearData();
    }
  }, [onFileDrop, acceptedFileTypes, validateFileType]);

  return {
    isDragging,
    dragHandlers: {
      onDragEnter: handleDragIn,
      onDragLeave: handleDragOut,
      onDragOver: handleDragOver,
      onDrop: handleDrop
    }
  };
}

export default useDragAndDrop; 