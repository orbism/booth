'use client';

import React, { useState, useRef } from 'react';
import useDragAndDrop from '@/hooks/useDragAndDrop';
import { uploadToBlob } from '@/utils/blobStorage';

interface DragDropUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: Error) => void;
  directory?: string;
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
  acceptLabel?: string;
  className?: string;
}

const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onUploadComplete,
  onUploadError,
  directory = 'media',
  maxSizeMB = 100,
  acceptedFileTypes,
  acceptLabel = 'Drag and drop files here, or click to browse',
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileDrop = async (files: FileList) => {
    if (files.length === 0) return;
    await handleFileUpload(files[0]);
  };
  
  const { isDragging, dragHandlers } = useDragAndDrop({
    onFileDrop: handleFileDrop,
    acceptedFileTypes
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };
  
  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const result = await uploadToBlob(file, {
        directory,
        maxSizeBytes: maxSizeMB * 1024 * 1024,
        allowedFileTypes: acceptedFileTypes,
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });
      
      onUploadComplete(result.url);
    } catch (err) {
      console.error('Upload error:', err);
      if (onUploadError && err instanceof Error) {
        onUploadError(err);
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const formatAcceptString = () => {
    if (!acceptedFileTypes || acceptedFileTypes.length === 0) return '*';
    return acceptedFileTypes.map(type => `.${type}`).join(',');
  };
  
  return (
    <div
      className={`
        relative border-2 rounded-lg p-6 
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'} 
        ${isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}
        transition-colors duration-200
        ${className}
      `}
      onClick={isUploading ? undefined : handleClick}
      {...dragHandlers}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={formatAcceptString()}
        onChange={handleFileChange}
        className="sr-only"
        disabled={isUploading}
      />
      
      <div className="text-center">
        {isUploading ? (
          <div className="space-y-3">
            <div className="text-gray-500">Uploading file... {uploadProgress}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default DragDropUpload; 