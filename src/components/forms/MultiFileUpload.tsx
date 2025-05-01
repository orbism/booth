'use client';

import React, { useState } from 'react';
import { uploadToBlob } from '@/utils/blobStorage';
import useDragAndDrop from '@/hooks/useDragAndDrop';

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

interface MultiFileUploadProps {
  onUploadsComplete: (urls: string[]) => void;
  directory?: string;
  maxSizeMB?: number;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  acceptLabel?: string;
}

const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  onUploadsComplete,
  directory = 'media',
  maxSizeMB = 100,
  maxFiles = 10,
  acceptedFileTypes,
  acceptLabel = 'Drag and drop files here, or click to browse'
}) => {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const updateUploadItemProgress = (id: string, progress: number) => {
    setUploadItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, progress } 
          : item
      )
    );
    
    // Calculate overall progress
    const newItems = uploadItems.map(item => 
      item.id === id ? { ...item, progress } : item
    );
    
    const totalProgress = newItems.reduce((sum, item) => sum + item.progress, 0);
    setOverallProgress(Math.round(totalProgress / newItems.length));
  };

  const updateUploadItemStatus = (id: string, status: UploadItem['status'], url?: string, error?: string) => {
    setUploadItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, status, url, error } 
          : item
      )
    );
  };

  const handleFilesSelected = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const filesToProcess = fileArray.slice(0, maxFiles - uploadItems.length);
    
    if (filesToProcess.length === 0) return;
    
    const newItems: UploadItem[] = filesToProcess.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      progress: 0,
      status: 'pending'
    }));
    
    setUploadItems(prev => [...prev, ...newItems]);
    
    // Start uploading each file
    newItems.forEach(item => {
      uploadFile(item.id, item.file);
    });
  };
  
  const uploadFile = async (id: string, file: File) => {
    updateUploadItemStatus(id, 'uploading');
    
    try {
      const result = await uploadToBlob(file, {
        directory,
        maxSizeBytes: maxSizeMB * 1024 * 1024,
        allowedFileTypes: acceptedFileTypes,
        onProgress: (progress) => {
          updateUploadItemProgress(id, progress);
        }
      });
      
      updateUploadItemStatus(id, 'success', result.url);
      
      // Check if all uploads are complete
      checkAllUploadsComplete();
    } catch (err) {
      console.error(`Error uploading file ${file.name}:`, err);
      updateUploadItemStatus(
        id, 
        'error', 
        undefined, 
        err instanceof Error ? err.message : 'Upload failed'
      );
    }
  };
  
  const checkAllUploadsComplete = () => {
    const allComplete = uploadItems.every(item => 
      item.status === 'success' || item.status === 'error'
    );
    
    if (allComplete) {
      const successUrls = uploadItems
        .filter(item => item.status === 'success' && item.url)
        .map(item => item.url as string);
      
      onUploadsComplete(successUrls);
    }
  };
  
  const handleDrop = (files: FileList) => {
    handleFilesSelected(files);
  };
  
  const { isDragging, dragHandlers } = useDragAndDrop({
    onFileDrop: handleDrop,
    acceptedFileTypes
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
    }
  };
  
  const handleRemoveItem = (id: string) => {
    setUploadItems(prev => prev.filter(item => item.id !== id));
    
    // Recalculate overall progress
    setTimeout(() => {
      const items = uploadItems.filter(item => item.id !== id);
      if (items.length === 0) {
        setOverallProgress(0);
      } else {
        const totalProgress = items.reduce((sum, item) => sum + item.progress, 0);
        setOverallProgress(Math.round(totalProgress / items.length));
      }
    }, 0);
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const getStatusColor = (status: UploadItem['status']): string => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'uploading': return 'text-blue-500';
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  const isUploadingAny = uploadItems.some(item => item.status === 'uploading');
  
  return (
    <div className="space-y-4">
      {/* Drag & drop area */}
      <div
        className={`
          relative border-2 rounded-lg p-6 text-center
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'} 
          ${isUploadingAny ? 'cursor-not-allowed' : 'cursor-pointer'}
          transition-colors duration-200
        `}
        onClick={() => !isUploadingAny && fileInputRef.current?.click()}
        {...dragHandlers}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes?.map(type => `.${type}`).join(',') || '*'}
          onChange={handleInputChange}
          className="sr-only"
          disabled={isUploadingAny}
        />
        
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H8m36-12h-4m-4 0v-4m-8 0H8m36 0a4 4 0 00-4-4H12a4 4 0 00-4 4m32 0v-4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        
        <div className="mt-2 text-sm text-gray-600">
          {acceptLabel}
        </div>
        
        {acceptedFileTypes && acceptedFileTypes.length > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            Accepted file types: {acceptedFileTypes.join(', ')}
          </p>
        )}
        
        <p className="mt-1 text-xs text-gray-500">
          Maximum {maxFiles} files, up to {maxSizeMB}MB each
        </p>
      </div>
      
      {/* Overall progress */}
      {uploadItems.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Overall progress</span>
            <span>{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* File list */}
      {uploadItems.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-200">
          {uploadItems.map(item => (
            <li key={item.id} className="py-3 flex items-center">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.file.name}
                  </p>
                  <p className="ml-2 text-xs text-gray-500">
                    {formatFileSize(item.file.size)}
                  </p>
                </div>
                
                <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${item.status === 'error' ? 'bg-red-500' : 'bg-blue-600'}`}
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
                
                <p className={`mt-1 text-xs ${getStatusColor(item.status)}`}>
                  {item.status === 'pending' && 'Waiting...'}
                  {item.status === 'uploading' && `Uploading... ${item.progress}%`}
                  {item.status === 'success' && 'Upload complete'}
                  {item.status === 'error' && (item.error || 'Upload failed')}
                </p>
              </div>
              
              <button
                type="button"
                className="ml-4 text-gray-400 hover:text-gray-500"
                onClick={() => handleRemoveItem(item.id)}
                disabled={item.status === 'uploading'}
              >
                <span className="sr-only">Remove</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MultiFileUpload; 