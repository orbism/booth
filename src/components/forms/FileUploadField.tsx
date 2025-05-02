// src/components/forms/FileUploadField.tsx
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { FiUpload, FiTrash, FiFile, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface FileUploadFieldProps {
  id: string;
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  accept?: string;
  directory?: string;
  helperText?: string;
  required?: boolean;
  maxSizeInMB?: number;
  showPreview?: boolean;
  previewWidth?: number;
  previewHeight?: number;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  id,
  label,
  value,
  onChange,
  accept = 'image/*',
  directory = 'media',
  helperText,
  required = false,
  maxSizeInMB = 10,
  showPreview = true,
  previewWidth = 150,
  previewHeight = 150
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if the value is an image
  const isImage = value?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  
  // Handle file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      toast.error(`File size exceeds ${maxSizeInMB}MB limit`);
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(10); // Start progress
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('directory', directory);
      
      // Simulate progress (this is fake progress since fetch doesn't support progress events)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const nextProgress = prev + Math.floor(Math.random() * 15);
          return nextProgress > 90 ? 90 : nextProgress;
        });
      }, 300);
      
      // Upload file
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      setUploadProgress(100);
      const data = await response.json();
      
      // Return the file URL to the parent component
      onChange(data.url);
      toast.success('File uploaded successfully');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      
      // Reset input after upload (allows uploading the same file again)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle file removal
  const handleRemove = async () => {
    if (!value) return;
    
    try {
      // Only call the API if it's a file we uploaded (has our domain or starts with /)
      if (value.startsWith('/') || value.includes(window.location.hostname)) {
        const response = await fetch(`/api/uploads?path=${encodeURIComponent(value)}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          console.warn('File deletion warning:', response.statusText);
          // Continue anyway - we'll still remove it from the form
        }
      }
      
      // Clear the value
      onChange(null);
      toast.success('File removed');
      
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to remove file');
    }
  };
  
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="mt-1 flex items-center">
        {/* Current file preview */}
        {value && showPreview && isImage && (
          <div className="relative mr-4">
            <Image
              src={value}
              alt="File preview"
              width={previewWidth}
              height={previewHeight}
              className="object-cover rounded-md"
            />
          </div>
        )}
        
        {/* Current file info without preview */}
        {value && (!showPreview || !isImage) && (
          <div className="flex items-center mr-4 bg-gray-100 p-2 rounded-md">
            <FiFile className="text-blue-500 mr-2" size={20} />
            <span className="text-sm text-gray-700 truncate max-w-[200px]">
              {value.split('/').pop()}
            </span>
          </div>
        )}
        
        {/* Upload button */}
        <div className="flex-1">
          {!isUploading && (
            <>
              <input
                id={id}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiUpload className="mr-2" />
                  {value ? 'Replace' : 'Upload'}
                </button>
                
                {value && (
                  <button
                    type="button"
                    className="flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={handleRemove}
                  >
                    <FiTrash className="mr-2" />
                    Remove
                  </button>
                )}
              </div>
            </>
          )}
          
          {/* Upload progress */}
          {isUploading && (
            <div className="w-full">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Helper text */}
      {helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
      
      {/* Technical value for form submission */}
      <input
        type="hidden"
        name={id}
        value={value || ''}
      />
    </div>
  );
};

export default FileUploadField;