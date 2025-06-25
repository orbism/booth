'use client';

import React, { useEffect } from 'react';
import BoothClientWrapper from './ClientComponent';
import { getBoothSettings, invalidateSettingsCache } from '@/lib/client-settings';
import { ensureBoolean } from '@/lib/settings-service';

export default function ClientWrapperInit() {
  // State to hold parsed settings
  const [clientProps, setClientProps] = React.useState<{
    urlPath: string;
    userId: string;
    eventUrlId: string;
    initialSettings: any;
  } | null>(null);
  
  // Effect to run once on component mount
  useEffect(() => {
    // Find the container element
    const container = document.getElementById('client-wrapper-container');
    if (!container) {
      console.error('[ClientWrapperInit] Could not find client wrapper container');
      return;
    }
    
    try {
      // Get data attributes from container
      const urlPath = container.getAttribute('data-url-path') || '';
      const userId = container.getAttribute('data-user-id') || '';
      const eventUrlId = container.getAttribute('data-event-url-id') || '';
      const settingsJson = container.getAttribute('data-settings') || '{}';
      const pageRenderTime = container.getAttribute('data-page-render-time') || '';
      const pageRenderTimestamp = container.getAttribute('data-page-render-timestamp') || Date.now().toString();
      
      // Parse settings JSON
      const settings = JSON.parse(settingsJson);
      
      // Process all boolean fields with enhanced logging
      const booleanFields = [
        'customJourneyEnabled', 'splashPageEnabled', 'printerEnabled', 
        'filtersEnabled', 'aiImageCorrection', 'showBoothBossLogo',
        'blobVercelEnabled', 'isDefault'
      ];
      
      for (const field of booleanFields) {
        if (field in settings) {
          const originalValue = settings[field];
          settings[field] = ensureBoolean(originalValue);
          
          console.log(`[ClientWrapperInit] ${field}: ${originalValue} (${typeof originalValue}) → ${settings[field]} (boolean)`);
          
          // Add extra logging for commonly problematic fields
          if (field === 'customJourneyEnabled' || field === 'printerEnabled') {
            console.log(`[ClientWrapperInit] ${field} value is now ${settings[field]} (type: ${typeof settings[field]})`);
          }
        }
      }
      
      // Add client initialization timestamp
      settings.clientInitTimestamp = Date.now();
      settings.fetchTimestamp = settings.fetchTimestamp || Number(pageRenderTimestamp);
      settings.cacheVersion = settings.cacheVersion || Date.now();
      
      console.log('[ClientWrapperInit] Initializing with settings:', {
        urlPath,
        userId,
        eventUrlId,
        settingsTimestamp: settings.fetchTimestamp,
        cacheVersion: settings.cacheVersion,
        pageRenderTime,
        captureMode: settings.captureMode,
        customJourneyEnabled: settings.customJourneyEnabled
      });
      
      // Check localStorage cache using cache key detection
      const localStorageKey = `boothSettings-${urlPath}`;
      const cachedSettingsStr = localStorage.getItem(localStorageKey);
      
      if (cachedSettingsStr) {
        try {
          const cachedSettings = JSON.parse(cachedSettingsStr);
          
          // Ensure the cached boolean values are correctly typed
          for (const field of booleanFields) {
            if (field in cachedSettings) {
              cachedSettings[field] = ensureBoolean(cachedSettings[field]);
            }
          }
          
          // Check cache version to determine freshness
          const serverVersion = settings.cacheVersion || Date.now();
          const cacheVersion = cachedSettings.cacheVersion || 0;
          
          // Compare boolean values specifically for important settings
          const customJourneyEnabledMismatch = 
            settings.customJourneyEnabled !== cachedSettings.customJourneyEnabled;
            
          const captureMismatch = 
            settings.captureMode !== cachedSettings.captureMode;
          
          // If server data is newer or there's a value conflict, invalidate cache
          if (serverVersion > cacheVersion || customJourneyEnabledMismatch || captureMismatch) {
            console.log('[ClientWrapperInit] Cache invalidation needed:', {
              serverVersion,
              cacheVersion,
              customJourneyEnabledMismatch,
              captureMismatch,
              serverValue: settings.customJourneyEnabled,
              cacheValue: cachedSettings.customJourneyEnabled
            });
            
            // Clear localStorage cache
            localStorage.removeItem(localStorageKey);
            
            // Also invalidate server-side cache
            invalidateSettingsCache('booth-settings').catch(err => {
              console.error('[ClientWrapperInit] Error invalidating settings cache:', err);
            });
          } else {
            console.log('[ClientWrapperInit] Using cached settings (no conflicts detected)');
          }
        } catch (e) {
          console.error('[ClientWrapperInit] Error parsing cached settings, clearing cache:', e);
          localStorage.removeItem(localStorageKey);
        }
      } else {
        console.log('[ClientWrapperInit] No cached settings found');
      }
      
      // Create cache busting signal for all child components
      window.__BOOTH_CACHE_INVALIDATION__ = {
        timestamp: settings.fetchTimestamp,
        cacheVersion: settings.cacheVersion,
        urlPath
      };
      
      // Set client props
      setClientProps({
        urlPath,
        userId,
        eventUrlId,
        initialSettings: settings
      });
      
      // Add listener for cache invalidation events
      const handleCacheInvalidation = (event: CustomEvent) => {
        const { urlPath: invalidatedUrl } = event.detail;
        
        // Only process events relevant to this URL
        if (invalidatedUrl === urlPath) {
          console.log(`[ClientWrapperInit] Received cache invalidation event for ${urlPath}`);
          
          // Force refresh from the server
          getBoothSettings(urlPath)
            .then(freshSettings => {
              if (freshSettings) {
                console.log('[ClientWrapperInit] Applying fresh settings after cache invalidation:', {
                  captureMode: freshSettings.captureMode,
                  customJourneyEnabled: freshSettings.customJourneyEnabled
                });
                
                // Update client props with fresh settings
                setClientProps({
                  urlPath,
                  userId,
                  eventUrlId,
                  initialSettings: freshSettings
                });
                
                // Update window cache invalidation signal
                window.__BOOTH_CACHE_INVALIDATION__ = {
                  timestamp: Date.now(),
                  cacheVersion: freshSettings.cacheVersion || Date.now(),
                  urlPath
                };
              }
            })
            .catch(err => {
              console.error('[ClientWrapperInit] Error refreshing settings after invalidation:', err);
            });
        }
      };
      
      // Add the event listener
      window.addEventListener('booth-cache-invalidated', handleCacheInvalidation as EventListener);
      
      // Return cleanup function
      return () => {
        window.removeEventListener('booth-cache-invalidated', handleCacheInvalidation as EventListener);
      };
      
    } catch (error) {
      console.error('[ClientWrapperInit] Error initializing client wrapper:', error);
    }
  }, []);
  
  // Return null if props not ready
  if (!clientProps) {
    return null;
  }
  
  // Render the client wrapper with props
  return <BoothClientWrapper {...clientProps} />;
}

// Add type definition for global cache invalidation
declare global {
  interface Window {
    __BOOTH_CACHE_INVALIDATION__?: {
      timestamp: number;
      cacheVersion: number;
      urlPath: string;
    };
  }
} 