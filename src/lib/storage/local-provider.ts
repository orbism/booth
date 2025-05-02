/**
 * Local File System Storage Provider
 * 
 * Implements the storage interface for local file system storage.
 */

import path from 'path';
import { promises as fs } from 'fs';
import { stat, existsSync } from 'fs';
import { StorageOptions, StorageResult } from './index';
import { getStorageSettings } from './settings';

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw new Error(`Failed to create directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get the absolute path to the public directory
 */
function getPublicDir(): string {
  return path.join(process.cwd(), 'public');
}

/**
 * Convert a file to a Buffer
 */
async function fileToBuffer(file: File | Buffer | Uint8Array | string): Promise<Buffer> {
  if (Buffer.isBuffer(file)) {
    return file;
  }
  
  if (file instanceof Uint8Array) {
    return Buffer.from(file);
  }
  
  if (typeof file === 'string') {
    // If it's a path to a file
    if (existsSync(file)) {
      return fs.readFile(file);
    }
    // Otherwise treat it as file content
    return Buffer.from(file);
  }
  
  // If it's a File object (browser)
  return Buffer.from(await file.arrayBuffer());
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  
  // Basic MIME type mapping
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Upload a file to local storage
 */
export async function uploadFile(
  file: File | Buffer | Uint8Array | string,
  filename: string,
  options: StorageOptions = {}
): Promise<StorageResult> {
  // Get settings
  const settings = await getStorageSettings();
  const localPath = settings.localUploadPath || 'uploads';
  
  // Determine directory path
  const directory = options.directory || 'media';
  const fullDir = path.join(getPublicDir(), localPath, directory);
  
  // Ensure directory exists
  await ensureDir(fullDir);
  
  // Convert file to Buffer
  const buffer = await fileToBuffer(file);
  
  // Write file to disk
  const filePath = path.join(fullDir, filename);
  await fs.writeFile(filePath, buffer);
  
  // Get file stats
  const stats = await fs.stat(filePath);
  
  // Calculate URL path (relative to public directory)
  const urlPath = `/${path.join(localPath, directory, filename).replace(/\\/g, '/')}`;
  
  return {
    url: urlPath,
    pathname: urlPath,
    size: stats.size,
    contentType: options.metadata?.contentType || getMimeType(filename),
    uploadedAt: new Date(),
    provider: 'local'
  };
}

/**
 * Check if a file exists in local storage
 */
export async function fileExists(urlOrPath: string): Promise<boolean> {
  try {
    // Handle relative URLs
    let filePath = urlOrPath;
    
    // If it starts with a slash, it's a URL path
    if (urlOrPath.startsWith('/')) {
      filePath = path.join(getPublicDir(), urlOrPath);
    }
    
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Delete a file from local storage
 */
export async function deleteFile(urlOrPath: string): Promise<boolean> {
  try {
    // Handle relative URLs
    let filePath = urlOrPath;
    
    // If it starts with a slash, it's a URL path
    if (urlOrPath.startsWith('/')) {
      filePath = path.join(getPublicDir(), urlOrPath);
    }
    
    // Check if file exists
    if (await fileExists(filePath)) {
      await fs.unlink(filePath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Local storage delete error:', error);
    return false;
  }
}

/**
 * Get file metadata from local storage
 */
export async function getFileInfo(urlOrPath: string): Promise<StorageResult | null> {
  try {
    // Handle relative URLs
    let filePath = urlOrPath;
    
    // If it starts with a slash, it's a URL path
    if (urlOrPath.startsWith('/')) {
      filePath = path.join(getPublicDir(), urlOrPath);
    }
    
    // Get file stats
    const stats = await fs.stat(filePath);
    
    // Get public URL
    const publicUrl = urlOrPath.startsWith('/') 
      ? urlOrPath 
      : `/${path.relative(getPublicDir(), filePath).replace(/\\/g, '/')}`;
    
    return {
      url: publicUrl,
      pathname: publicUrl,
      size: stats.size,
      contentType: getMimeType(filePath),
      uploadedAt: stats.mtime,
      provider: 'local'
    };
  } catch (error) {
    return null;
  }
}

/**
 * List files in a local directory
 */
export async function listFiles(prefix = ''): Promise<StorageResult[]> {
  try {
    const settings = await getStorageSettings();
    const localPath = settings.localUploadPath || 'uploads';
    
    // Determine directory path
    const dirPath = path.join(getPublicDir(), localPath, prefix);
    
    // Ensure directory exists
    if (!await fileExists(dirPath)) {
      return [];
    }
    
    // Read directory contents
    const files = await fs.readdir(dirPath);
    const results: StorageResult[] = [];
    
    // Process each file
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      
      // Skip directories
      if (stats.isDirectory()) {
        continue;
      }
      
      // Get public URL
      const publicUrl = `/${path.join(localPath, prefix, file).replace(/\\/g, '/')}`;
      
      results.push({
        url: publicUrl,
        pathname: publicUrl,
        size: stats.size,
        contentType: getMimeType(file),
        uploadedAt: stats.mtime,
        provider: 'local'
      });
    }
    
    return results;
  } catch (error) {
    console.error('Local storage list error:', error);
    return [];
  }
}

export const localProvider = {
  uploadFile,
  fileExists,
  deleteFile,
  getFileInfo,
  listFiles
};

export default localProvider; 