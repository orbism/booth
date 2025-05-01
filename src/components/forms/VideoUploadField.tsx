'use client';

import React, { useState, useRef } from 'react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { uploadToBlob } from '@/utils/blobStorage';

interface VideoUploadFieldProps {
  id: string;
  name: string;
  label: string;
  helpText?: string;
  placeholder?: string;
  onUploadComplete?: (url: string) => void;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  maxSizeMB?: number;
  maxDurationSeconds?: number;
}

const VideoUploadField: React.FC<VideoUploadFieldProps> = ({
  id,
  name,
  label,
  helpText,
  placeholder = 'Upload video or enter URL',
  onUploadComplete,
  register,
  setValue,
  watch,
  maxSizeMB = 100,
  maxDurationSeconds = 60 * 5 // 5 minutes default
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const currentValue = watch(name);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Only video files are allowed');
      return;
    }
    
    // Check video duration before uploading
    try {
      const duration = await getVideoDuration(file);
      
      if (duration > maxDurationSeconds) {
        setError(`Video duration exceeds the maximum limit of ${maxDurationSeconds / 60} minutes`);
        return;
      }
      
      setVideoDuration(duration);
    } catch (err) {
      console.error('Error checking video duration:', err);
      // Continue with upload even if we can't check duration
    }
    
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);
      
      const result = await uploadToBlob(file, {
        directory: 'videos',
        maxSizeBytes: maxSizeMB * 1024 * 1024,
        allowedFileTypes: ['mp4', 'webm', 'mov'],
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
      setError(err instanceof Error ? err.message : 'Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Helper function to get video duration
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      
      video.onerror = () => {
        reject('Error loading video metadata');
      };
      
      video.src = URL.createObjectURL(file);
    });
  };
  
  // Handle video loaded (for the preview)
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };
  
  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
            accept="video/*"
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
          <video 
            ref={videoRef}
            src={currentValue} 
            controls
            onLoadedMetadata={handleVideoLoaded}
            className="w-full max-h-48 rounded border border-gray-200" 
          />
          {videoDuration && (
            <p className="text-xs text-gray-500 mt-1">
              Duration: {formatDuration(videoDuration)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoUploadField; 