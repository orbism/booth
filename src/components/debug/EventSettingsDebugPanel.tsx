'use client';

import React, { useState } from 'react';

type EventSettingsDebugPanelProps = {
  urlPath: string;
  userId: string;
  eventUrlId: string;
  customJourneyEnabled: boolean;
  captureMode: string;
  journeyPagesCount: number;
  activeJourneyId: string | null;
  lastUpdated?: string;
  renderTimestamp: string;
};

const EventSettingsDebugPanel: React.FC<EventSettingsDebugPanelProps> = ({
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  // Function to update a single field
  const updateField = async (field: string, value: string | boolean) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      // Convert value to string for logging
      const valueStr = typeof value === 'boolean' ? (value ? 'true' : 'false') : value;
      console.log(`[DEBUG PANEL] Updating ${field} to ${valueStr} (type: ${typeof value})`);
      
      // Construct URL with timestamp for cache-busting
      const url = `/api/booth/settings?urlPath=${urlPath}&t=${Date.now()}`;
      
      // Special handling for boolean fields to ensure they remain as booleans
      // and don't get converted to strings
      let processedValue = value;
      if (field === 'customJourneyEnabled' && typeof value === 'boolean') {
        // Keep boolean value as boolean
        processedValue = value;
      } else if (field === 'captureMode') {
        // Ensure captureMode is either 'photo' or 'video'
        processedValue = value === 'photo' ? 'photo' : 'video';
      }
      
      // Prepare the update payload
      const updateData = {
        [field]: processedValue,
        userId: userId, // Include userId to ensure we update the correct settings
        eventName: 'Photo Booth Event', // Include eventName to ensure it's set
        updatedAt: new Date().toISOString() // Include updatedAt to ensure it's set
      };
      
      console.log(`[DEBUG PANEL] Sending update payload:`, updateData);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      
      // More detailed error handling for 500 errors
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to update setting';
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || 'Failed to update setting';
          } else {
            errorMessage = await response.text() || 'Failed to update setting';
          }
        } catch (parseError) {
          console.error('[DEBUG PANEL] Error parsing error response:', parseError);
          errorMessage = `Error ${response.status}: Failed to update setting`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log(`[DEBUG PANEL] Update response:`, data);
      
      setMessage({
        text: `Updated ${field} to ${valueStr} successfully`,
        type: 'success'
      });
      
      // Force page refresh after 1 second to see changes
      setTimeout(() => {
        console.log(`[DEBUG PANEL] Reloading page to see changes...`);
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error(`[DEBUG PANEL] Error updating ${field}:`, error);
      setMessage({
        text: error instanceof Error ? error.message : 'Error updating setting',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-4 text-xs bg-gray-100 p-3 rounded border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          Debug Panel
          {isLoading && (
            <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
          )}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-2 py-1 text-white text-xs rounded flex items-center ${isExpanded ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              {isExpanded ? (
                <path d="M18 15l-6-6-6 6"/>
              ) : (
                <path d="M6 9l6 6 6-6"/>
              )}
            </svg>
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          <a 
            href={`?t=${Date.now()}`} 
            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
            </svg>
            Refresh
          </a>
        </div>
      </div>
      
      {message && (
        <div className={`mb-2 p-2 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-800' :
          message.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p><span className="font-semibold">Page Render Time:</span> {renderTimestamp}</p>
          <p><span className="font-semibold">Settings Updated:</span> {lastUpdated || 'unknown'}</p>
          <p><span className="font-semibold">Event URL ID:</span> <span className="text-blue-600">{eventUrlId}</span></p>
          <p><span className="font-semibold">User ID:</span> <span className="text-blue-600">{userId || 'None'}</span></p>
        </div>
        <div>
          <p>
            <span className="font-semibold">Capture Mode:</span> 
            <span className="text-green-600 font-bold">{captureMode || 'photo'}</span>
            <button 
              onClick={() => updateField('captureMode', captureMode === 'photo' ? 'video' : 'photo')}
              className="ml-2 px-1 py-0.5 bg-orange-500 text-white rounded hover:bg-orange-600 text-[9px]"
              disabled={isLoading}
            >
              Toggle
            </button>
          </p>
          <p>
            <span className="font-semibold">Custom Journey:</span> 
            <span className={`font-bold ${customJourneyEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {customJourneyEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button 
              onClick={() => updateField('customJourneyEnabled', !customJourneyEnabled)}
              className="ml-2 px-1 py-0.5 bg-orange-500 text-white rounded hover:bg-orange-600 text-[9px]"
              disabled={isLoading}
            >
              Toggle
            </button>
          </p>
          <p><span className="font-semibold">Journey Pages:</span> <span className={`font-bold ${journeyPagesCount > 0 ? 'text-green-600' : 'text-orange-500'}`}>{journeyPagesCount}</span></p>
          <p><span className="font-semibold">Active Journey ID:</span> <span className="text-blue-600">{activeJourneyId || 'none'}</span></p>
          
          {/* Debug Info */}
          <div className="mt-2 border-t border-gray-200 pt-2 text-xs text-gray-500">
            <p>customJourneyEnabled: {String(customJourneyEnabled)} (type: {typeof customJourneyEnabled})</p>
            <p>captureMode: {captureMode} (type: {typeof captureMode})</p>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h4 className="font-bold mb-2">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateField('customJourneyEnabled', true)}
              className="p-2 bg-green-600 text-white rounded hover:bg-green-700 text-center"
              disabled={isLoading || customJourneyEnabled}
            >
              Enable Custom Journey
            </button>
            <button
              onClick={() => updateField('customJourneyEnabled', false)}
              className="p-2 bg-red-600 text-white rounded hover:bg-red-700 text-center"
              disabled={isLoading || !customJourneyEnabled}
            >
              Disable Custom Journey
            </button>
            <button
              onClick={() => updateField('captureMode', 'photo')}
              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
              disabled={isLoading || captureMode === 'photo'}
            >
              Set Photo Mode
            </button>
            <button
              onClick={() => updateField('captureMode', 'video')}
              className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-center"
              disabled={isLoading || captureMode === 'video'}
            >
              Set Video Mode
            </button>
          </div>
          
          <div className="mt-4">
            <h4 className="font-bold mb-2">Debugging Links</h4>
            <div className="flex flex-wrap gap-2">
              <a 
                href={`/api/debug/view-settings?userId=${userId}&ts=${Date.now()}`} 
                target="_blank"
                className="px-2 py-1 border border-gray-300 bg-white text-gray-600 text-xs rounded hover:bg-gray-50"
              >
                View Settings Details
              </a>
              <a 
                href={`/api/booth/settings?urlPath=${urlPath}&t=${Date.now()}`} 
                target="_blank"
                className="px-2 py-1 border border-gray-300 bg-white text-gray-600 text-xs rounded hover:bg-gray-50"
              >
                Booth Settings API
              </a>
              <a 
                href={`/api/user/settings?username=${userId}&t=${Date.now()}`} 
                target="_blank"
                className="px-2 py-1 border border-gray-300 bg-white text-gray-600 text-xs rounded hover:bg-gray-50"
              >
                User Settings API
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventSettingsDebugPanel; 