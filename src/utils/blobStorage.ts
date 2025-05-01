'use client';

import { upload } from '@vercel/blob/client';

export interface UploadOptions {
  /**
   * Directory path prefix for organizing uploads
   */
  directory?: string;
  
  /**
   * Callback to track upload progress
   */
  onProgress?: (progress: number) => void;
  
  /**
   * Maximum file size in bytes
   * Default: 100MB
   */
  maxSizeBytes?: number;
  
  /**
   * Allowed file types/extensions as an array
   * Example: ['jpg', 'png', 'pdf']
   */
  allowedFileTypes?: string[];
}

/**
 * Upload a file to Vercel Blob storage directly from the client
 */
export async function uploadToBlob(
  file: File, 
  options: UploadOptions = {}
): Promise<{ url: string; pathname: string }> {
  const { 
    directory = 'media',
    onProgress,
    maxSizeBytes = 100 * 1024 * 1024, // 100MB default
    allowedFileTypes
  } = options;
  
  // Validate file size
  if (file.size > maxSizeBytes) {
    throw new Error(`File size exceeds the maximum limit of ${Math.round(maxSizeBytes / (1024 * 1024))}MB`);
  }
  
  // Validate file type if allowedFileTypes is provided
  if (allowedFileTypes && allowedFileTypes.length > 0) {
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedFileTypes.includes(fileExtension)) {
      throw new Error(`File type not allowed. Allowed types: ${allowedFileTypes.join(', ')}`);
    }
  }
  
  // Generate a unique pathname for the file
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = file.name.split('.').pop() || '';
  const fileName = `${timestamp}-${randomString}.${fileExtension}`;
  const pathname = `${directory}/${fileName}`;
  
  // Upload to Vercel Blob
  const blob = await upload(pathname, file, {
    access: 'public',
    handleUploadUrl: '/api/blob/client-upload',
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const progress = progressEvent.loaded / progressEvent.total;
        onProgress(Math.round(progress * 100));
      }
    },
  });
  
  return {
    url: blob.url,
    pathname: blob.pathname
  };
}

/**
 * Check if a blob exists by its URL
 */
export async function checkBlobExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/blob/status?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    return data.exists === true;
  } catch (error) {
    console.error('Error checking blob status:', error);
    return false;
  }
} 