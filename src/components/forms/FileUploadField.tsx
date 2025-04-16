// src/components/forms/FileUploadField.tsx
import React, { useState } from 'react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

interface FileUploadFieldProps {
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
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  id,
  name,
  label,
  accept = 'image/*',
  helpText,
  placeholder = 'Upload or enter URL',
  onUploadComplete,
  register,
  setValue,
  watch
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const currentValue = watch(name);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      setError(null);
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Send to upload endpoint
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      setValue(name, data.url);
      
      if (onUploadComplete) {
        onUploadComplete(data.url);
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
          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <label className={`
          px-3 py-2 
          ${isUploading ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} 
          border border-gray-300 border-l-0 rounded-r-md cursor-pointer`}
        >
          {isUploading ? 'Uploading...' : 'Browse'}
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="sr-only"
            disabled={isUploading}
          />
        </label>
      </div>
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      
      {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
      
      {currentValue && currentValue.startsWith('/') && (
        <div className="mt-2">
          <img 
            src={currentValue} 
            alt="Preview" 
            className="h-12 object-contain rounded border border-gray-200"
          />
        </div>
      )}
    </div>
  );
};

export default FileUploadField;