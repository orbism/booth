import React, { useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { FiUpload, FiX, FiCheck } from 'react-icons/fi';

interface FileUploaderProps {
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSizeMB?: number;
  buttonText?: string;
  directory?: string;
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
  onUploadError,
  accept = 'image/*',
  maxSizeMB = 10,
  buttonText = 'Upload File',
  directory = 'media',
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const errorMsg = `File too large. Maximum size is ${maxSizeMB}MB`;
      toast.error(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }
    
    // Start upload
    setIsUploading(true);
    setProgress(10);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('directory', directory);
      
      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.floor(Math.random() * 15);
          return next > 90 ? 90 : next;
        });
      }, 400);
      
      // Upload the file
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      setProgress(100);
      const data = await response.json();
      
      // Notify success
      toast.success('Upload complete!');
      if (onUploadComplete) onUploadComplete(data.url);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
      }, 500); // Show 100% for a moment before resetting
      
      // Reset file input
      event.target.value = '';
    }
  };
  
  return (
    <div className={`${className}`}>
      <Toaster position="bottom-center" />
      
      <label className={`
        flex items-center justify-center 
        px-4 py-2 
        border border-gray-300 
        rounded-md shadow-sm 
        text-sm font-medium 
        ${isUploading 
          ? 'bg-gray-100 cursor-wait' 
          : 'bg-white hover:bg-gray-50 cursor-pointer'
        }
        transition-colors
        focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500
      `}>
        {isUploading ? (
          <div className="flex items-center">
            <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span>{progress}%</span>
          </div>
        ) : (
          <>
            <FiUpload className="mr-2" />
            {buttonText}
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept={accept}
              disabled={isUploading}
            />
          </>
        )}
      </label>
    </div>
  );
};

export default FileUploader; 