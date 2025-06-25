'use client';

import React, { useState } from 'react';

type DebugPanelProps = {
  urlPath: string;
  userId: string;
  eventUrlId: string;
  customJourneyEnabled: boolean;
  captureMode: 'photo' | 'video';
  journeyPagesCount: number;
  activeJourneyId: string | null;
  lastUpdated?: string;
  renderTimestamp: string;
};

const DebugPanelWrapper: React.FC<DebugPanelProps> = ({
  urlPath,
  userId,
  eventUrlId,
  customJourneyEnabled,
  captureMode,
  journeyPagesCount,
  activeJourneyId,
  lastUpdated,
  renderTimestamp
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Only show debug panel in development
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) return null;

  const handleForceRefresh = () => {
    setIsRefreshing(true);
    
    // Clear any localStorage cache
    try {
      localStorage.removeItem('boothSettings');
      localStorage.removeItem('lastSettingsUpdate');
      console.log('Cleared localStorage cache');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    
    // Force a hard refresh with cache-busting query parameter
    window.location.href = `${window.location.pathname}?refresh=${Date.now()}`;
  };

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  // Format values for better readability
  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return 'null';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="fixed bottom-0 right-0 z-50">
      {/* Debug Toggle Button */}
      <button
        onClick={togglePanel}
        className="bg-gray-800 text-white px-2 py-1 text-xs rounded-tl-md hover:bg-gray-700"
      >
        Debug {isOpen ? '▼' : '▲'}
      </button>
      
      {/* Debug Panel */}
      {isOpen && (
        <div className="bg-gray-800 text-white p-4 rounded-tl-md w-96 max-h-[80vh] overflow-auto">
          <h3 className="font-bold mb-2 text-xs uppercase">Booth Debug Panel</h3>
          
          <div className="mb-2 space-y-1 text-xs">
            <p className="flex justify-between">
              <span className="font-semibold">URL Path:</span>
              <span className="text-green-400">{urlPath}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-semibold">Event URL ID:</span>
              <span className="text-green-400">{eventUrlId}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-semibold">User ID:</span>
              <span className="text-green-400">{userId}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-semibold">Capture Mode:</span>
              <span className="text-green-400">{formatValue(captureMode)}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-semibold">Custom Journey:</span>
              <span className="text-green-400">{formatValue(customJourneyEnabled)}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-semibold">Journey Pages:</span>
              <span className="text-green-400">{journeyPagesCount}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-semibold">Active Journey:</span>
              <span className="text-green-400">{formatValue(activeJourneyId)}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-semibold">Last Updated:</span>
              <span className="text-yellow-400">{lastUpdated ? formatTimestamp(lastUpdated) : 'N/A'}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-semibold">Rendered At:</span>
              <span className="text-yellow-400">{formatTimestamp(renderTimestamp)}</span>
            </p>
          </div>
          
          <div className="mt-4 text-xs">
            <h4 className="font-semibold mb-1">Cache Control</h4>
            <div className="flex space-x-2">
              <button
                onClick={handleForceRefresh}
                disabled={isRefreshing}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-3 py-1 rounded text-xs"
              >
                {isRefreshing ? 'Refreshing...' : 'Force Refresh (Clear Cache)'}
              </button>
            </div>
            
            <div className="mt-2 text-gray-400 text-[10px]">
              <p>If settings are not reflecting correctly:</p>
              <ol className="list-decimal ml-4 leading-tight">
                <li>Try Force Refresh to clear all cache</li>
                <li>Check the database connection in the server logs</li>
                <li>Verify the API returns 200 with correct headers</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanelWrapper; 