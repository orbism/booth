'use client';

import React, { useState } from 'react';

export default function CheckSettingsPage() {
  const [urlPath, setUrlPath] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const checkSettings = async () => {
    if (!urlPath) {
      setError('Please enter a URL path');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Direct server fetch to check database
      const response = await fetch(`/api/check-settings?urlPath=${encodeURIComponent(urlPath)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Error checking settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  // Add function to create default settings
  const createDefaultSettings = async () => {
    if (!results?.eventUrl) {
      setError('No event URL found to create settings for');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/create-default-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          urlPath: urlPath
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create settings');
      }
      
      // Show success message
      alert(`Settings created successfully! ${data.message}`);
      
      // Refresh the data
      checkSettings();
    } catch (err) {
      console.error('Error creating settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to create settings');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Database Settings Check</h1>
      <p className="mb-4 text-gray-600">
        This tool directly queries the database to check if settings exist for a URL path.
      </p>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Event URL Path
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={urlPath}
            onChange={(e) => setUrlPath(e.target.value)}
            placeholder="e.g. test-event"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={checkSettings}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Settings'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
          {error}
        </div>
      )}
      
      {results && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b font-medium">
            Database Query Results
          </div>
          
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Event URL</h2>
            {results.eventUrl ? (
              <div className="bg-gray-50 p-3 rounded mb-4">
                <div><strong>URL Path:</strong> {results.eventUrl.urlPath}</div>
                <div><strong>User ID:</strong> {results.eventUrl.userId}</div>
                <div><strong>Is Active:</strong> {results.eventUrl.isActive ? 'Yes' : 'No'}</div>
                <div><strong>Created:</strong> {new Date(results.eventUrl.createdAt).toLocaleString()}</div>
              </div>
            ) : (
              <div className="bg-yellow-50 p-3 border border-yellow-300 rounded mb-4 text-yellow-800">
                No event URL found with this path. Please check the URL path or create a new event URL.
              </div>
            )}
            
            <h2 className="text-lg font-semibold mb-2">Settings</h2>
            {results.settings ? (
              <div className="bg-gray-50 p-3 rounded mb-4">
                <div><strong>ID:</strong> {results.settings.id}</div>
                <div><strong>User ID:</strong> {results.settings.userId}</div>
                <div><strong>Event Name:</strong> {results.settings.eventName}</div>
                <div><strong>Custom Journey Enabled:</strong> {String(results.settings.customJourneyEnabled)} (Type: {typeof results.settings.customJourneyEnabled})</div>
                <div><strong>Capture Mode:</strong> {results.settings.captureMode}</div>
                <div><strong>Last Updated:</strong> {new Date(results.settings.updatedAt).toLocaleString()}</div>
              </div>
            ) : (
              <div className="bg-red-50 p-3 border border-red-300 rounded mb-4 text-red-800">
                <p className="font-bold">No settings found for this URL's owner!</p>
                
                {results.eventUrl && (
                  <p className="mt-2">
                    This means the URL exists but the user ({results.eventUrl.userId}) does not have any settings.
                    The user needs to create settings through their dashboard.
                  </p>
                )}
              </div>
            )}
            
            <h2 className="text-lg font-semibold mb-2">What to do next</h2>
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              {!results.eventUrl ? (
                <div>
                  <p className="font-semibold">The URL doesn't exist</p>
                  <ul className="list-disc ml-6 mt-2">
                    <li>Check for typos in the URL path</li>
                    <li>Create this event URL for a user</li>
                  </ul>
                </div>
              ) : !results.settings ? (
                <div>
                  <p className="font-semibold">URL exists but Settings are missing</p>
                  <ul className="list-disc ml-6 mt-2">
                    <li>Have the user log in and configure their settings from the Customer dashboard</li>
                    <li>Create default settings for this user: {results.eventUrl.userId}</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-green-700">Both URL and Settings exist</p>
                  <p>If you're still having issues, check:</p>
                  <ul className="list-disc ml-6 mt-2">
                    <li>Cache invalidation</li>
                    <li>Settings type conversions (especially for boolean values)</li>
                    <li>Client-side code for properly reading the settings</li>
                  </ul>
                </div>
              )}
            </div>
            
            {results?.eventUrl && !results?.settings && (
              <div className="mt-4">
                <button
                  onClick={createDefaultSettings}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Create Default Settings
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  This will create default settings for the user who owns this URL.
                  Note: You must be an admin to use this feature.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 