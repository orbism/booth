/**
 * Vercel Blob Storage Provider
 * 
 * Implements the storage interface for Vercel Blob storage.
 */

import { put, head, list, del, PutBlobResult, HeadBlobResult, PutCommandOptions } from '@vercel/blob';
import { StorageOptions, StorageResult } from './index';

/**
 * Process the blob result into a standardized StorageResult
 */
function processBlobResult(blob: PutBlobResult | HeadBlobResult): StorageResult {
  return {
    url: blob.url,
    pathname: blob.pathname,
    // Force type conversion since Vercel types may not match our interface perfectly
    size: ('size' in blob) ? blob.size : 0,
    contentType: ('contentType' in blob) 
      ? (blob.contentType as string) || 'application/octet-stream' 
      : 'application/octet-stream',
    // Handle timestamps, defaulting to now if not present
    uploadedAt: (blob as HeadBlobResult).uploadedAt ? new Date((blob as HeadBlobResult).uploadedAt) : new Date(),
    provider: 'vercel'
  };
}

/**
 * Upload a file to Vercel Blob storage
 */
export async function uploadFile(
  file: File | Buffer | Uint8Array | string,
  filename: string,
  options: StorageOptions = {}
): Promise<StorageResult> {
  const {
    directory = 'media',
    access = 'public',
    addRandomSuffix = false,
    metadata = {},
  } = options;
  
  // Construct path with directory prefix
  const pathname = directory ? `${directory}/${filename}` : filename;
  
  try {
    // Upload using Vercel Blob
    const putOptions: PutCommandOptions = {
      access: 'public', // Always use public access for now - Vercel Blob API only accepts 'public'
      addRandomSuffix,
      contentType: options.metadata?.contentType,
      // Metadata is not supported in Vercel Blob's type definitions, so we don't include it
    };
    
    const blob = await put(pathname, file as any, putOptions);
    
    // Return storage result
    return processBlobResult(blob);
  } catch (error) {
    console.error('Vercel Blob upload error:', error);
    throw new Error(`Failed to upload file to Vercel Blob: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if a file exists in Vercel Blob storage
 */
export async function fileExists(urlOrPath: string): Promise<boolean> {
  try {
    // Use head() to check if the file exists
    await head(urlOrPath);
    return true;
  } catch (_error) {
    // If head() fails, the file doesn't exist or is inaccessible
    return false;
  }
}

/**
 * Delete a file from Vercel Blob storage
 */
export async function deleteFile(urlOrPath: string): Promise<boolean> {
  try {
    await del(urlOrPath);
    return true;
  } catch (_error) {
    console.error('Vercel Blob delete error:', _error);
    return false;
  }
}

/**
 * Get file metadata from Vercel Blob storage
 */
export async function getFileInfo(urlOrPath: string): Promise<StorageResult | null> {
  try {
    const blob = await head(urlOrPath);
    return processBlobResult(blob);
  } catch (_error) {
    // If head() fails, the file doesn't exist or is inaccessible
    return null;
  }
}

/**
 * List files in Vercel Blob storage
 */
export async function listFiles(prefix?: string): Promise<StorageResult[]> {
  try {
    const { blobs } = await list({ prefix });
    
    return blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      // Vercel's ListBlobResultBlob doesn't have contentType, use default
      contentType: 'application/octet-stream',
      uploadedAt: new Date(blob.uploadedAt),
      provider: 'vercel' as const
    }));
  } catch (_error) {
    console.error('Vercel Blob list error:', _error);
    return [];
  }
}

export const vercelProvider = {
  uploadFile,
  fileExists,
  deleteFile,
  getFileInfo,
  listFiles
};

export default vercelProvider; 