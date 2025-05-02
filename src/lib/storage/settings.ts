/**
 * Storage settings module
 * 
 * Provides functions to retrieve storage-related settings from environment variables
 * and config files rather than the database.
 */

/**
 * Storage provider type
 */
export type StorageProvider = 'auto' | 'local' | 'vercel';

/**
 * Storage settings interface
 */
export interface StorageSettings {
  storageProvider: StorageProvider;
  blobVercelEnabled: boolean;
  localUploadPath: string;
  storageBaseUrl?: string;
}

/**
 * Default storage settings
 */
const defaultStorageSettings: StorageSettings = {
  storageProvider: 'auto',
  blobVercelEnabled: process.env.ENABLE_VERCEL_BLOB !== 'false',
  localUploadPath: process.env.LOCAL_UPLOAD_PATH || 'uploads',
  storageBaseUrl: process.env.STORAGE_BASE_URL || undefined,
};

/**
 * Get storage settings from environment variables
 */
export async function getStorageSettings(): Promise<StorageSettings> {
  return {
    // If STORAGE_PROVIDER is not set, use 'auto'
    storageProvider: (process.env.STORAGE_PROVIDER as StorageProvider) || defaultStorageSettings.storageProvider,
    blobVercelEnabled: process.env.ENABLE_VERCEL_BLOB !== 'false',
    localUploadPath: process.env.LOCAL_UPLOAD_PATH || defaultStorageSettings.localUploadPath,
    storageBaseUrl: process.env.STORAGE_BASE_URL || defaultStorageSettings.storageBaseUrl,
  };
}

/**
 * Determine the current storage provider based on settings and environment
 */
export function determineCurrentProvider(settings: StorageSettings): 'local' | 'vercel' {
  // Check if we're in a Vercel environment
  const isVercelEnvironment = Boolean(
    process.env.NEXT_PUBLIC_VERCEL_ENV || 
    process.env.VERCEL || 
    process.env.VERCEL_URL
  );
  
  // If explicitly set to a provider, use that
  if (settings.storageProvider === 'local') return 'local';
  if (settings.storageProvider === 'vercel') return 'vercel';
  
  // For auto setting, check environment
  if (isVercelEnvironment && settings.blobVercelEnabled) {
    return 'vercel';
  }
  
  // Default to local
  return 'local';
}

// Create a named constant for the default export
const storageSettings = {
  getStorageSettings,
  determineCurrentProvider,
};

export default storageSettings; 