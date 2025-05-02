/**
 * Media Storage Interface
 * 
 * This module provides a unified storage interface for media files
 * with switchable providers for different environments.
 */

// Import providers - comment out one if you're facing circular dependency issues
import { localProvider } from './local-provider';
import { vercelProvider } from './vercel-provider';
import { getStorageSettings, determineCurrentProvider } from './settings';

/**
 * Storage access control
 */
export type StorageAccess = 'public' | 'private';

/**
 * Storage options for uploads
 */
export interface StorageOptions {
  directory?: string;
  access?: StorageAccess;
  addRandomSuffix?: boolean;
  metadata?: Record<string, string>;
}

/**
 * Storage operation result
 */
export interface StorageResult {
  url: string;
  pathname: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
  provider: 'local' | 'vercel';
}

/**
 * Storage provider interface
 */
export interface StorageProvider {
  uploadFile: (
    file: File | Buffer | Uint8Array | string,
    filename: string,
    options?: StorageOptions
  ) => Promise<StorageResult>;
  fileExists: (urlOrPath: string) => Promise<boolean>;
  deleteFile: (urlOrPath: string) => Promise<boolean>;
  getFileInfo: (urlOrPath: string) => Promise<StorageResult | null>;
  listFiles: (prefix?: string) => Promise<StorageResult[]>;
}

// Create fallback provider for when modules aren't available or there's a circular dependency
const fallbackProvider: StorageProvider = {
  uploadFile: async (file, filename, options = {}) => {
    console.warn('Using fallback storage provider. This should only happen during development.');
    return {
      url: `/fallback/${filename}`,
      pathname: `/fallback/${filename}`,
      size: typeof file === 'string' ? file.length : (file instanceof File ? file.size : 0),
      contentType: 'application/octet-stream',
      uploadedAt: new Date(),
      provider: 'local'
    };
  },
  fileExists: async () => false,
  deleteFile: async () => false,
  getFileInfo: async () => null,
  listFiles: async () => []
};

/**
 * Get the appropriate storage provider based on settings and environment
 */
export async function getStorageProvider(): Promise<StorageProvider> {
  try {
    const settings = await getStorageSettings();
    const providerType = determineCurrentProvider(settings);
    
    // Return the appropriate provider
    if (providerType === 'vercel') {
      // Use vercel provider or fallback if not available
      return vercelProvider || fallbackProvider;
    } else {
      // Use local provider or fallback if not available
      return localProvider || fallbackProvider;
    }
  } catch (error) {
    console.error('Error selecting storage provider:', error);
    // Return fallback provider in case of error
    return fallbackProvider;
  }
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
  file: File | Buffer | Uint8Array | string,
  filename: string,
  options?: StorageOptions
): Promise<StorageResult> {
  const provider = await getStorageProvider();
  return provider.uploadFile(file, filename, options);
}

/**
 * Check if a file exists in storage
 */
export async function fileExists(urlOrPath: string): Promise<boolean> {
  const provider = await getStorageProvider();
  return provider.fileExists(urlOrPath);
}

/**
 * Delete a file from storage
 */
export async function deleteFile(urlOrPath: string): Promise<boolean> {
  const provider = await getStorageProvider();
  return provider.deleteFile(urlOrPath);
}

/**
 * Get file metadata from storage
 */
export async function getFileInfo(urlOrPath: string): Promise<StorageResult | null> {
  const provider = await getStorageProvider();
  return provider.getFileInfo(urlOrPath);
}

/**
 * List files in storage
 */
export async function listFiles(prefix?: string): Promise<StorageResult[]> {
  const provider = await getStorageProvider();
  return provider.listFiles(prefix);
}

/**
 * Generate a unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  // Extract file extension
  const parts = originalName.split('.');
  const extension = parts.length > 1 ? parts.pop() : '';
  const basename = parts.join('.');
  
  // Generate timestamp and random string
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  return `${timestamp}-${randomString}-${basename}${extension ? `.${extension}` : ''}`;
}

// Export combined interface
export const storage = {
  uploadFile,
  fileExists,
  deleteFile,
  getFileInfo,
  listFiles,
  getStorageProvider,
  generateUniqueFilename
};

export default storage; 