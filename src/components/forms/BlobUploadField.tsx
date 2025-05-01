'use client';

import React, { useState } from 'react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { uploadToBlob } from '@/utils/blobStorage';

interface BlobUploadFieldProps {
  id: string;
  name: string;
  label: string;
  accept?: string;
  helpText?: string;
  placeholder?: string;
  onUploadComplete?: (url: string) => void;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  directory?: string;
  maxSizeMB?: number;
}

const BlobUploadField: React.FC<BlobUploadFieldProps> = ({
  id,
  name,
  label,
  accept = 'image/*',
  helpText,
  placeholder = 'Upload or enter URL',
  onUploadComplete,
  register,
  setValue,
  watch,
  directory = 'media',
  maxSizeMB = 100
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const currentValue = watch(name);
  
  // Convert accept string to allowed file types array
  const getAllowedFileTypes = (): string[] | undefined => {
    if (accept === '*' || accept === 'image/*' || accept === 'video/*') {
      return undefined; // No specific restriction
    }
    
    // Extract file extensions from accept string (e.g., ".jpg, .png" -> ["jpg", "png"])
    return accept.split(',')
      .map(type => type.trim())
      .map(type => type.startsWith('.') ? type.substring(1) : type)
      .filter(Boolean);
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);
      
      const result = await uploadToBlob(file, {
        directory,
        maxSizeBytes: maxSizeMB * 1024 * 1024,
        allowedFileTypes: getAllowedFileTypes(),
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });
      
      // Update the form with the blob URL
      setValue(name, result.url);
      
      if (onUploadComplete) {
        onUploadComplete(result.url);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex">
        <input
          type="text"
          id={id}
          {...register(name)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <label className={`
          px-3 py-2 
          ${isUploading ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} 
          border border-gray-300 border-l-0 rounded-r-md cursor-pointer`}
        >
          {isUploading ? `${uploadProgress}%` : 'Browse'}
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="sr-only bg-gray-50"
            disabled={isUploading}
          />
        </label>
      </div>
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      
      {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
      
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
      
      {currentValue && (
        <div className="mt-2">
          {accept.includes('image') && (
            <img 
              src={currentValue} 
              alt="Preview" 
              className="h-12 object-contain rounded border border-gray-200"
            />
          )}
          {!accept.includes('image') && currentValue && (
            <div className="text-xs text-gray-500 truncate">
              {currentValue}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BlobUploadField; 