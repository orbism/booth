'use client';

import React, { useState, useEffect } from 'react';
import { getUserSettings, updateUserSettings, getBoothSettings, invalidateSettingsCache } from '@/lib/client-settings';
import { ensureBoolean } from '@/lib/settings-factory';

type SettingsSyncTestProps = {
  userId?: string;
  urlPath?: string;
};

/**
 * Test component for verifying settings synchronization
 * Shows current settings from both user and booth endpoints
 * Provides buttons to test updating settings
 */
export default function SettingsSyncTest({ userId, urlPath }: SettingsSyncTestProps) {
  const [userSettings, setUserSettings] = useState<any>(null);
  const [boothSettings, setBoothSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);
  
  // Get both types of settings for comparison
  const fetchAllSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Log the action
      addToLog('Fetching settings from both endpoints...');
      
      // Fetch user settings if we have a userId
      if (userId) {
        const userSettingsData = await getUserSettings();
        if (userSettingsData) {
          addToLog(`User settings fetched, cacheVersion: ${userSettingsData.cacheVersion}`);
          setUserSettings(userSettingsData);
        } else {
          addToLog('User settings fetch failed');
        }
      }
      
      // Fetch booth settings if we have a urlPath
      if (urlPath) {
        const boothSettingsData = await getBoothSettings(urlPath);
        if (boothSettingsData) {
          addToLog(`Booth settings fetched, cacheVersion: ${boothSettingsData.cacheVersion}`);
          setBoothSettings(boothSettingsData);
        } else {
          addToLog('Booth settings fetch failed');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error fetching settings: ${errorMessage}`);
      addToLog(`ERROR: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle a boolean setting
  const toggleSetting = async (settingName: string) => {
    if (!userSettings) {
      addToLog(`Cannot toggle ${settingName}: No user settings available`);
      return;
    }
    
    setLoading(true);
    try {
      // Get the current value and toggle it
      const currentValue = userSettings[settingName];
      const newValue = !ensureBoolean(currentValue);
      
      addToLog(`Toggling ${settingName}: ${currentValue} → ${newValue}`);
      
      // Create update object
      const updateData = {
        [settingName]: newValue
      };
      
      // Update the settings
      const result = await updateUserSettings(updateData);
      
      if (result) {
        addToLog(`Settings updated successfully`);
        
        // Invalidate booth settings cache to ensure changes are reflected
        await invalidateSettingsCache('booth-settings');
        addToLog('Booth settings cache invalidated');
        
        // Refresh the settings
        await fetchAllSettings();
      } else {
        addToLog('Settings update failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error toggling setting: ${errorMessage}`);
      addToLog(`ERROR: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Change capture mode
  const toggleCaptureMode = async () => {
    if (!userSettings) {
      addToLog('Cannot toggle capture mode: No user settings available');
      return;
    }
    
    setLoading(true);
    try {
      // Toggle between photo and video
      const currentMode = userSettings.captureMode;
      const newMode = currentMode === 'photo' ? 'video' : 'photo';
      
      addToLog(`Changing captureMode: ${currentMode} → ${newMode}`);
      
      // Update the settings
      const result = await updateUserSettings({ captureMode: newMode });
      
      if (result) {
        addToLog(`Capture mode updated successfully`);
        
        // Invalidate booth settings cache to ensure changes are reflected
        await invalidateSettingsCache('booth-settings');
        addToLog('Booth settings cache invalidated');
        
        // Refresh the settings
        await fetchAllSettings();
      } else {
        addToLog('Capture mode update failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error toggling capture mode: ${errorMessage}`);
      addToLog(`ERROR: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Add a message to the action log
  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(`[SettingsSyncTest] ${message}`);
    setActionLog(prevLog => [logEntry, ...prevLog].slice(0, 30));
  };
  
  // Fetch settings on initial load
  useEffect(() => {
    fetchAllSettings();
  }, []);
  
  // Helper to display boolean values consistently
  const formatBoolean = (value: any): string => {
    const boolValue = ensureBoolean(value);
    return boolValue ? '✅ true' : '❌ false';
  };
  
  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Settings Synchronization Test</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      <div className="flex flex-wrap gap-4 mb-6">
        <button 
          onClick={fetchAllSettings}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh Settings'}
        </button>
        
        <button 
          onClick={() => toggleSetting('customJourneyEnabled')}
          disabled={loading || !userSettings}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          Toggle Custom Journey
        </button>
        
        <button 
          onClick={() => toggleSetting('splashPageEnabled')}
          disabled={loading || !userSettings}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          Toggle Splash Page
        </button>
        
        <button 
          onClick={toggleCaptureMode}
          disabled={loading || !userSettings}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          Toggle Capture Mode
        </button>
        
        <button 
          onClick={() => invalidateSettingsCache('booth-settings')}
          disabled={loading}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          Invalidate Cache
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Settings */}
        <div className="border rounded-lg p-4 bg-white shadow">
          <h3 className="text-lg font-semibold mb-2">User Settings</h3>
          {!userSettings ? (
            <p className="text-gray-500">No user settings available</p>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium">Cache Version:</span>
                <span className="font-mono">{userSettings.cacheVersion || 'N/A'}</span>
                
                <span className="font-medium">Capture Mode:</span>
                <span className="font-mono">{userSettings.captureMode || 'N/A'}</span>
                
                <span className="font-medium">Custom Journey:</span>
                <span className="font-mono">{formatBoolean(userSettings.customJourneyEnabled)}</span>
                
                <span className="font-medium">Splash Page:</span>
                <span className="font-mono">{formatBoolean(userSettings.splashPageEnabled)}</span>
                
                <span className="font-medium">Printer Enabled:</span>
                <span className="font-mono">{formatBoolean(userSettings.printerEnabled)}</span>
                
                <span className="font-medium">Filters Enabled:</span>
                <span className="font-mono">{formatBoolean(userSettings.filtersEnabled)}</span>
                
                <span className="font-medium">Updated At:</span>
                <span className="font-mono">
                  {userSettings.updatedAt 
                    ? new Date(userSettings.updatedAt).toLocaleString() 
                    : 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Booth Settings */}
        <div className="border rounded-lg p-4 bg-white shadow">
          <h3 className="text-lg font-semibold mb-2">Booth Settings</h3>
          {!boothSettings ? (
            <p className="text-gray-500">No booth settings available</p>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium">Cache Version:</span>
                <span className="font-mono">{boothSettings.cacheVersion || 'N/A'}</span>
                
                <span className="font-medium">Capture Mode:</span>
                <span className="font-mono">{boothSettings.captureMode || 'N/A'}</span>
                
                <span className="font-medium">Custom Journey:</span>
                <span className="font-mono">{formatBoolean(boothSettings.customJourneyEnabled)}</span>
                
                <span className="font-medium">Splash Page:</span>
                <span className="font-mono">{formatBoolean(boothSettings.splashPageEnabled)}</span>
                
                <span className="font-medium">Printer Enabled:</span>
                <span className="font-mono">{formatBoolean(boothSettings.printerEnabled)}</span>
                
                <span className="font-medium">Filters Enabled:</span>
                <span className="font-mono">{formatBoolean(boothSettings.filtersEnabled)}</span>
                
                <span className="font-medium">Updated At:</span>
                <span className="font-mono">
                  {boothSettings.updatedAt 
                    ? new Date(boothSettings.updatedAt).toLocaleString() 
                    : 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Settings comparison */}
      {userSettings && boothSettings && (
        <div className="mt-6 border rounded-lg p-4 bg-white shadow">
          <h3 className="text-lg font-semibold mb-2">Settings Comparison</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Setting
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Settings
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booth Settings
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Match?
                  </th>
                </tr>
              </thead>
              <tbody>
                {['captureMode', 'customJourneyEnabled', 'splashPageEnabled', 'printerEnabled', 'filtersEnabled'].map(key => {
                  const userValue = userSettings[key];
                  const boothValue = boothSettings[key];
                  const isBoolean = typeof userValue === 'boolean' || typeof boothValue === 'boolean';
                  
                  // For boolean comparison, ensure both are converted properly
                  const userBoolValue = isBoolean ? ensureBoolean(userValue) : userValue;
                  const boothBoolValue = isBoolean ? ensureBoolean(boothValue) : boothValue;
                  
                  // Check if values match
                  const match = isBoolean 
                    ? userBoolValue === boothBoolValue
                    : userValue === boothValue;
                  
                  return (
                    <tr key={key} className={!match ? "bg-red-50" : ""}>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm font-medium">
                        {key}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        {isBoolean ? formatBoolean(userValue) : userValue}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        {isBoolean ? formatBoolean(boothValue) : boothValue}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        {match ? '✅' : '❌'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Action Log */}
      <div className="mt-6 border rounded-lg p-4 bg-gray-50 shadow">
        <h3 className="text-lg font-semibold mb-2">Action Log</h3>
        <div className="bg-black text-green-400 p-3 rounded h-60 overflow-y-auto font-mono text-sm">
          {actionLog.length === 0 ? (
            <p>No actions logged yet.</p>
          ) : (
            <ul>
              {actionLog.map((entry, index) => (
                <li key={index}>{entry}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 