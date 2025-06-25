/**
 * Client Settings Utilities
 * A set of utilities for working with settings on the client side
 */

import { SettingsInput } from '@/types/settings';
import { ensureBoolean } from './settings-service';

/**
 * Get user settings from the API
 */
export async function getUserSettings(): Promise<any> {
  try {
    // Add a cache busting parameter
    const timestamp = Date.now();
    const response = await fetch(`/api/user/settings?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    
    if (!response.ok) {
      console.error('Failed to fetch user settings:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    // Process boolean values - extra safety for client side
    if (data) {
      const booleanFields = [
        'customJourneyEnabled', 'splashPageEnabled', 'printerEnabled', 
        'filtersEnabled', 'aiImageCorrection', 'showBoothBossLogo',
        'blobVercelEnabled', 'isDefault'
      ];
      
      for (const field of booleanFields) {
        if (field in data) {
          data[field] = ensureBoolean(data[field]);
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }
}

/**
 * Update user settings via API
 */
export async function updateUserSettings(settings: SettingsInput): Promise<any> {
  try {
    // Process boolean values before sending
    const processedSettings = { ...settings };
    const booleanFields = [
      'customJourneyEnabled', 'splashPageEnabled', 'printerEnabled', 
      'filtersEnabled', 'aiImageCorrection', 'showBoothBossLogo',
      'blobVercelEnabled', 'isDefault'
    ];
    
    for (const field of booleanFields) {
      if (field in processedSettings) {
        const settingsAny = processedSettings as any;
        settingsAny[field] = ensureBoolean(settingsAny[field]);
        
        // Log for debug
        console.log(`[updateUserSettings] ${field}: ${settingsAny[field]} (${typeof settingsAny[field]})`);
      }
    }
    
    // Add cache busting parameter
    const timestamp = Date.now();
    const response = await fetch(`/api/user/settings?t=${timestamp}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      body: JSON.stringify(processedSettings),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to update user settings:', errorData);
      return { success: false, error: errorData };
    }
    
    // Invalidate cache after updating settings
    await invalidateSettingsCache();
    
    const responseData = await response.json();
    
    // Process boolean values in the response
    if (responseData) {
      for (const field of booleanFields) {
        if (field in responseData) {
          responseData[field] = ensureBoolean(responseData[field]);
        }
      }
    }
    
    return { ...responseData, success: true };
  } catch (error) {
    console.error('Error updating user settings:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get booth settings for a specific URL path
 */
export async function getBoothSettings(urlPath: string): Promise<any> {
  try {
    // Add cache busting parameter
    const timestamp = Date.now();
    const response = await fetch(
      `/api/booth/settings?urlPath=${encodeURIComponent(urlPath)}&t=${timestamp}`,
      {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch booth settings:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    // Process boolean values - extra safety for client side
    if (data) {
      const booleanFields = [
        'customJourneyEnabled', 'splashPageEnabled', 'printerEnabled', 
        'filtersEnabled', 'aiImageCorrection', 'showBoothBossLogo',
        'blobVercelEnabled', 'isDefault'
      ];
      
      for (const field of booleanFields) {
        if (field in data) {
          const originalValue = data[field];
          data[field] = ensureBoolean(data[field]);
          console.log(`[getBoothSettings] ${field}: ${originalValue} → ${data[field]} (${typeof data[field]})`);
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching booth settings:', error);
    return null;
  }
}

/**
 * Create a cache busting URL by adding or updating a timestamp query parameter
 */
export function createCacheBustingUrl(url: string): string {
  const parsedUrl = new URL(url, window.location.origin);
  parsedUrl.searchParams.set('t', Date.now().toString());
  return parsedUrl.toString();
}

/**
 * Invalidate settings cache by calling dedicated endpoint
 */
export async function invalidateSettingsCache(
  resource: string = 'all',
  urlPath?: string,
  urgent: boolean = false
): Promise<boolean> {
  try {
    const timestamp = Date.now();
    let url = `/api/cache/invalidate?resource=${encodeURIComponent(resource)}&t=${timestamp}`;
    
    // Add URL path if provided
    if (urlPath) {
      url += `&urlPath=${encodeURIComponent(urlPath)}`;
    }
    
    // Add urgent flag for immediate updates
    if (urgent) {
      url += '&urgent=true';
    }
    
    console.log(`[CACHE] Invalidating cache for resource: ${resource}${urlPath ? `, urlPath: ${urlPath}` : ''}${urgent ? ' (URGENT)' : ''}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to invalidate cache for ${resource}:`, response.statusText);
      return false;
    }
    
    const result = await response.json();
    console.log(`[CACHE] Cache invalidation result:`, result);
    
    // If this is an urgent update, also clear localStorage for immediate effect
    if (urgent && urlPath) {
      try {
        const localStorageKey = `boothSettings-${urlPath}`;
        localStorage.removeItem(localStorageKey);
        console.log(`[CACHE] URGENT: Cleared localStorage for ${localStorageKey}`);
        
        // Broadcast a cache invalidation event for other tabs
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('booth-cache-invalidated', { 
            detail: { resource, urlPath, timestamp } 
          }));
        }
      } catch (e) {
        console.error('[CACHE] Error clearing localStorage:', e);
      }
    }
    
    return result.success;
  } catch (error) {
    console.error('Error invalidating settings cache:', error);
    return false;
  }
}

/**
 * Get the latest cache version
 */
export async function getSettingsCacheVersion(resource: string = 'booth-settings'): Promise<number> {
  try {
    const response = await fetch(`/api/cache/invalidate?resource=${resource}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    
    if (!response.ok) {
      console.error('Failed to get cache version:', response.statusText);
      return Date.now();
    }
    
    const data = await response.json();
    return data.cacheVersion || Date.now();
  } catch (error) {
    console.error('Error getting cache version:', error);
    return Date.now();
  }
} 