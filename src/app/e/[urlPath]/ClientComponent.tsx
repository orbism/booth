'use client';

import React, { useState, useEffect } from 'react';
import { getBoothSettings, invalidateSettingsCache, createCacheBustingUrl } from '@/lib/client-settings';
import { ensureBoolean } from '@/lib/settings-service';

type ClientDebugProps = {
  urlPath: string;
  userId: string;
  eventUrlId: string;
  initialSettings: any;
};

export default function BoothClientWrapper({ urlPath, userId, eventUrlId, initialSettings }: ClientDebugProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [cachedSettings, setCachedSettings] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debugVisible, setDebugVisible] = useState(true); // Start with debug visible for debugging
  const [cacheDiagnostics, setCacheDiagnostics] = useState<string[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isServerDataPrioritized, setIsServerDataPrioritized] = useState(true);
  const [isOutOfSync, setIsOutOfSync] = useState(false);

  // Initialize on component mount
  useEffect(() => {
    addDiagnostic(`INITIAL SERVER SETTINGS: captureMode=${initialSettings.captureMode}, customJourneyEnabled=${initialSettings.customJourneyEnabled}, fetchTimestamp=${initialSettings.fetchTimestamp}`);
    
    // Check for cached settings in localStorage
    try {
      const localStorageKey = `boothSettings-${urlPath}`;
      const cachedSettingsStr = localStorage.getItem(localStorageKey);
      
      if (cachedSettingsStr) {
        const parsedSettings = JSON.parse(cachedSettingsStr);
        
        // Ensure boolean fields are properly typed
        const booleanFields = [
          'customJourneyEnabled', 'splashPageEnabled', 'printerEnabled', 
          'filtersEnabled', 'aiImageCorrection', 'showBoothBossLogo',
          'blobVercelEnabled', 'isDefault'
        ];
        
        for (const field of booleanFields) {
          if (field in parsedSettings) {
            parsedSettings[field] = ensureBoolean(parsedSettings[field]);
          }
        }
        
        setCachedSettings(parsedSettings);
        
        // If server data is prioritized, use server settings
        // Otherwise, compare timestamps and use more recent
        if (isServerDataPrioritized) {
          addDiagnostic('Using server settings (server priority mode)');
          // Ensure server settings have correct boolean values
          const processedServerSettings = { ...initialSettings };
          for (const field of booleanFields) {
            if (field in processedServerSettings) {
              processedServerSettings[field] = ensureBoolean(processedServerSettings[field]);
            }
          }
          setSettings(processedServerSettings);
        } else {
          // Use cached settings only if they're newer than server settings
          const serverTimestamp = initialSettings.cacheVersion || initialSettings.fetchTimestamp || 0;
          const cacheTimestamp = parsedSettings.cacheVersion || parsedSettings.fetchTimestamp || 0;
          
          if (cacheTimestamp > serverTimestamp) {
            addDiagnostic(`Using cached settings (newer: ${new Date(cacheTimestamp).toLocaleTimeString()} > ${new Date(serverTimestamp).toLocaleTimeString()})`);
            setSettings(parsedSettings);
          } else {
            addDiagnostic(`Using server settings (newer: ${new Date(serverTimestamp).toLocaleTimeString()} > ${new Date(cacheTimestamp).toLocaleTimeString()})`);
            // Ensure server settings have correct boolean values
            const processedServerSettings = { ...initialSettings };
            for (const field of booleanFields) {
              if (field in processedServerSettings) {
                processedServerSettings[field] = ensureBoolean(processedServerSettings[field]);
              }
            }
            setSettings(processedServerSettings);
          }
        }
      } else {
        addDiagnostic('No cached settings found, using server settings');
        // Ensure server settings have correct boolean values
        const processedServerSettings = { ...initialSettings };
        const booleanFields = [
          'customJourneyEnabled', 'splashPageEnabled', 'printerEnabled', 
          'filtersEnabled', 'aiImageCorrection', 'showBoothBossLogo',
          'blobVercelEnabled', 'isDefault'
        ];
        for (const field of booleanFields) {
          if (field in processedServerSettings) {
            processedServerSettings[field] = ensureBoolean(processedServerSettings[field]);
            addDiagnostic(`Converted ${field} to ${processedServerSettings[field]} (${typeof processedServerSettings[field]})`);
          }
        }
        setSettings(processedServerSettings);
      }
    } catch (error) {
      console.error('Error loading cached settings:', error);
      addDiagnostic(`Error loading cached settings: ${error}`);
      setSettings(initialSettings);
    }

    // Setup event listener for settings updates
    const handleSettingsUpdate = (event: CustomEvent) => {
      const { urlPath: updatedUrlPath } = event.detail || {};
      
      if (updatedUrlPath === urlPath) {
        addDiagnostic(`🔄 Settings update detected for URL: ${urlPath}`);
        setIsOutOfSync(true);
      }
    };
    
    // Add the event listener
    window.addEventListener('booth-cache-invalidated', handleSettingsUpdate as EventListener);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('booth-cache-invalidated', handleSettingsUpdate as EventListener);
    };
  }, [initialSettings, urlPath, isServerDataPrioritized]);

  // Add diagnostic message
  const addDiagnostic = (message: string) => {
    console.log(`[BoothClientWrapper] ${message}`);
    setCacheDiagnostics(prev => [message, ...prev].slice(0, 20));
  };

  // Refresh settings from the server
  const refreshSettings = async () => {
    try {
      setIsRefreshing(true);
      addDiagnostic('Refreshing settings from server...');
      
      // Fetch fresh settings with cache busting
      const freshSettings = await getBoothSettings(urlPath);
      
      if (!freshSettings) {
        throw new Error('Failed to fetch settings from server');
      }
      
      // Convert boolean values
      const processedSettings = { ...freshSettings };
      const booleanFields = [
        'customJourneyEnabled', 'splashPageEnabled', 'printerEnabled', 
        'filtersEnabled', 'aiImageCorrection', 'showBoothBossLogo',
        'blobVercelEnabled', 'isDefault'
      ];
      
      for (const field of booleanFields) {
        if (field in processedSettings) {
          const originalValue = processedSettings[field];
          processedSettings[field] = ensureBoolean(processedSettings[field]);
          addDiagnostic(`Converted ${field}: ${originalValue} → ${processedSettings[field]}`);
        }
      }
      
      // Update settings in state and cache
      setSettings(processedSettings);
      setRefreshCount(count => count + 1);
      addDiagnostic(`Settings refreshed at ${new Date().toLocaleTimeString()}`);
      
      // Update local storage
      localStorage.setItem(`boothSettings-${urlPath}`, JSON.stringify({
        ...processedSettings,
        fetchTimestamp: Date.now(),
        cacheVersion: processedSettings.cacheVersion || Date.now()
      }));
      
      // Also update cached settings state for debug display
      setCachedSettings(processedSettings);
    } catch (error) {
      console.error('Error refreshing settings:', error);
      addDiagnostic(`Error refreshing settings: ${error}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Force client update with current settings
  const forceClientUpdate = async () => {
    addDiagnostic('Forcing client update...');
    
    try {
      // Clear localStorage
      localStorage.removeItem(`boothSettings-${urlPath}`);
      
      // Invalidate the server cache
      await invalidateSettingsCache('booth-settings');
      
      // Get fresh settings
      const freshSettings = await getBoothSettings(urlPath);
      
      if (!freshSettings) {
        throw new Error('Failed to fetch settings from server');
      }
      
      // Process boolean fields
      const processedSettings = { ...freshSettings };
      const booleanFields = [
        'customJourneyEnabled', 'splashPageEnabled', 'printerEnabled', 
        'filtersEnabled', 'aiImageCorrection', 'showBoothBossLogo',
        'blobVercelEnabled', 'isDefault'
      ];
      
      for (const field of booleanFields) {
        if (field in processedSettings) {
          const originalValue = processedSettings[field];
          processedSettings[field] = ensureBoolean(processedSettings[field]);
          addDiagnostic(`Converted ${field}: ${originalValue} (${typeof originalValue}) → ${processedSettings[field]} (boolean)`);
        }
      }
      
      // Update settings
      setSettings(processedSettings);
      setCachedSettings(null);
      addDiagnostic(`Client updated with fresh settings at ${new Date().toLocaleTimeString()}`);
      setRefreshCount(count => count + 1);
      
      // Store in local storage
      localStorage.setItem(`boothSettings-${urlPath}`, JSON.stringify({
        ...processedSettings,
        fetchTimestamp: Date.now(),
        cacheVersion: processedSettings.cacheVersion || Date.now()
      }));
    } catch (error) {
      console.error('Error during force client update:', error);
      addDiagnostic(`Error during force client update: ${error}`);
    }
  };

  // Toggle server data prioritization
  const togglePrioritization = () => {
    addDiagnostic(`Data prioritization mode: ${!isServerDataPrioritized ? 'Server' : 'Timestamp'} priority`);
    setIsServerDataPrioritized(!isServerDataPrioritized);
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    // Even in production, show an alert if settings are out of sync
    if (isOutOfSync) {
      return (
        <div className="fixed top-0 left-0 w-full bg-yellow-500 text-white p-2 text-sm text-center z-50">
          Settings have been updated. 
          <button 
            onClick={forceClientUpdate} 
            className="ml-2 underline font-bold"
          >
            Refresh to see changes
          </button>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Show reload alert when settings are out of sync */}
      {isOutOfSync && (
        <div className="fixed top-0 left-0 w-full bg-yellow-500 text-white p-2 text-sm text-center z-50">
          Settings have been updated. 
          <button 
            onClick={forceClientUpdate} 
            className="ml-2 underline font-bold"
          >
            Refresh now
          </button>
        </div>
      )}
      
      {/* Small indicator in corner */}
      <div className="fixed top-0 right-0 z-50">
        <button
          onClick={() => setDebugVisible(!debugVisible)}
          className="bg-blue-600 text-white text-xs px-2 py-1 rounded-bl-md"
        >
          🔧 {settings.captureMode} {settings.customJourneyEnabled ? 'CJ' : 'No CJ'} {debugVisible ? '▲' : '▼'}
        </button>
      </div>
      
      {/* Debug panel */}
      {debugVisible && (
        <div className="fixed top-10 right-0 z-50 w-96 max-h-[80vh] overflow-auto bg-gray-800 text-white p-4 rounded-l-lg shadow-lg">
          <h3 className="font-bold mb-2">Client-side Settings Cache</h3>
          
          <div className="mb-3">
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span className="font-semibold">URL Path:</span>
              <span>{urlPath}</span>
              
              <span className="font-semibold">Capture Mode (Current):</span>
              <span className="font-mono">{settings.captureMode}</span>
              
              <span className="font-semibold">Capture Mode (Server):</span>
              <span className="font-mono">{initialSettings.captureMode}</span>
              
              <span className="font-semibold">Custom Journey (Current):</span>
              <span className="font-mono">{String(settings.customJourneyEnabled)} ({typeof settings.customJourneyEnabled})</span>
              
              <span className="font-semibold">Custom Journey (Server):</span>
              <span className="font-mono">{String(initialSettings.customJourneyEnabled)} ({typeof initialSettings.customJourneyEnabled})</span>
              
              <span className="font-semibold">Settings Timestamp:</span>
              <span className="font-mono">{new Date(settings.fetchTimestamp || 0).toLocaleString()}</span>
              
              <span className="font-semibold">Server Timestamp:</span>
              <span className="font-mono">{new Date(initialSettings.fetchTimestamp || 0).toLocaleString()}</span>
              
              <span className="font-semibold">Cache Version:</span>
              <span className="font-mono">{settings.cacheVersion || 'none'}</span>
              
              <span className="font-semibold">Data Source:</span>
              <span className="font-mono">{isServerDataPrioritized ? 'Server Priority' : 'Timestamp Priority'}</span>
              
              <span className="font-semibold">Refresh Count:</span>
              <span className="font-mono">{refreshCount}</span>
              
              <span className="font-semibold">Sync Status:</span>
              <span className={`font-mono ${isOutOfSync ? 'text-red-400' : 'text-green-400'}`}>
                {isOutOfSync ? 'OUT OF SYNC' : 'In Sync'}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2 mb-3">
            <button
              onClick={refreshSettings}
              disabled={isRefreshing}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Settings'}
            </button>
            
            <button
              onClick={forceClientUpdate}
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
            >
              Force Update
            </button>
            
            <button
              onClick={togglePrioritization}
              className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded"
            >
              Toggle Priority
            </button>
          </div>
          
          <div className="mb-3">
            <h4 className="font-semibold text-sm mb-1">Cache Diagnostics:</h4>
            <div className="bg-gray-900 p-2 rounded text-xs max-h-40 overflow-y-auto">
              {cacheDiagnostics.map((msg, i) => (
                <div key={i} className="mb-1">{msg}</div>
              ))}
            </div>
          </div>
          
          {cachedSettings && (
            <div className="mb-3">
              <h4 className="font-semibold text-sm mb-1">Cached Settings:</h4>
              <div className="bg-gray-900 p-2 rounded text-xs max-h-40 overflow-y-auto">
                <pre>{JSON.stringify(cachedSettings, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 