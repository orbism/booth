'use client';

import React, { useState } from 'react';

export default function DiagnosePage() {
  const [urlPath, setUrlPath] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    if (!urlPath) {
      setError('Please enter a URL path');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Add timestamp for cache busting
      const timestamp = Date.now();
      const response = await fetch(`/api/diagnose/settings?urlPath=${encodeURIComponent(urlPath)}&t=${timestamp}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Diagnostic error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to clear localStorage cache for a URL
  const clearCache = () => {
    if (!urlPath) {
      setError('Please enter a URL path');
      return;
    }
    
    try {
      const key = `boothSettings-${urlPath}`;
      localStorage.removeItem(key);
      alert(`Cache cleared for ${key}`);
    } catch (err) {
      console.error('Error clearing cache:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };
  
  // Function to invalidate server cache
  const invalidateCache = async () => {
    if (!urlPath) {
      setError('Please enter a URL path');
      return;
    }
    
    setLoading(true);
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/cache/invalidate?resource=booth-settings&urlPath=${encodeURIComponent(urlPath)}&urgent=true&t=${timestamp}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      alert(`Cache invalidated: ${JSON.stringify(data)}`);
    } catch (err) {
      console.error('Error invalidating cache:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Settings Diagnostics</h1>
      <p className="mb-4 text-gray-600">
        This tool helps diagnose issues with settings synchronization between the database and the frontend.
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
            onClick={runDiagnostics}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run Diagnostics'}
          </button>
          
          <button
            onClick={clearCache}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Clear Local Cache
          </button>
          
          <button
            onClick={invalidateCache}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Invalidate Server Cache
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
            Diagnostic Results
          </div>
          
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Event URL Information</h2>
            <div className="bg-gray-50 p-3 rounded mb-4">
              <div><strong>ID:</strong> {results.eventUrl.id}</div>
              <div><strong>URL Path:</strong> {results.eventUrl.urlPath}</div>
              <div><strong>User ID:</strong> {results.eventUrl.userId}</div>
              <div><strong>Active:</strong> {results.eventUrl.isActive ? 'Yes' : 'No'}</div>
            </div>
            
            <h2 className="text-lg font-semibold mb-2">Database Settings</h2>
            <div className="bg-gray-50 p-3 rounded mb-4">
              <div><strong>ID:</strong> {results.rawSettings.id}</div>
              <div><strong>Event Name:</strong> {results.rawSettings.eventName}</div>
              <div><strong>Capture Mode:</strong> {results.rawSettings.captureMode}</div>
              <div><strong>Custom Journey Enabled:</strong> {String(results.rawSettings.customJourneyEnabled)}</div>
              <div><strong>Last Updated:</strong> {new Date(results.rawSettings.updatedAt).toLocaleString()}</div>
            </div>
            
            <h2 className="text-lg font-semibold mb-2">Type Information</h2>
            <div className="bg-gray-50 p-3 rounded mb-4">
              <h3 className="font-medium mb-1">customJourneyEnabled</h3>
              <div><strong>Raw Value:</strong> {results.typeInfo.customJourneyEnabled.value}</div>
              <div><strong>Type:</strong> {results.typeInfo.customJourneyEnabled.type}</div>
              <div><strong>As Boolean:</strong> {String(results.typeInfo.customJourneyEnabled.booleanValue)}</div>
              <div><strong>As Number:</strong> {results.typeInfo.customJourneyEnabled.numberValue}</div>
              
              <h3 className="font-medium mb-1 mt-3">captureMode</h3>
              <div><strong>Value:</strong> {results.typeInfo.captureMode.value}</div>
              <div><strong>Type:</strong> {results.typeInfo.captureMode.type}</div>
            </div>
            
            <h2 className="text-lg font-semibold mb-2">API Response</h2>
            <div className="bg-gray-50 p-3 rounded mb-4">
              {results.apiSettings ? (
                <>
                  <div><strong>Custom Journey Enabled:</strong> {String(results.apiSettings.customJourneyEnabled)}</div>
                  <div><strong>Capture Mode:</strong> {results.apiSettings.captureMode}</div>
                </>
              ) : (
                <div className="text-red-500">Failed to fetch API settings</div>
              )}
            </div>
            
            <h2 className="text-lg font-semibold mb-2">Summary</h2>
            <div className="bg-gray-50 p-3 rounded mb-4">
              <div>
                <strong>API in sync with database:</strong>{' '}
                <span className={results.summary.isApiInSync ? 'text-green-600' : 'text-red-600 font-bold'}>
                  {results.summary.isApiInSync ? 'Yes' : 'No'}
                </span>
              </div>
              <div><strong>Database format:</strong></div>
              <div className="ml-4">customJourneyEnabled: {results.summary.databaseFormat.customJourneyEnabled}</div>
              <div className="ml-4">captureMode: {results.summary.databaseFormat.captureMode}</div>
            </div>
            
            <h2 className="text-lg font-semibold mb-2">Recommended Action</h2>
            <div className="bg-gray-50 p-3 rounded mb-4">
              {!results.summary.isApiInSync ? (
                <div className="text-red-600">
                  <p className="font-bold">There is a data inconsistency between the database and API!</p>
                  <ul className="list-disc ml-6 mt-2">
                    <li>Try invalidating the server cache using the button above</li>
                    <li>Clear browser cache and localStorage</li>
                    <li>If problem persists, check database connection and settings service implementation</li>
                  </ul>
                </div>
              ) : (
                <div className="text-green-600">
                  <p className="font-bold">Data appears to be in sync!</p>
                  <p>If you're still experiencing issues:</p>
                  <ul className="list-disc ml-6 mt-2">
                    <li>Try forcing a complete reload of the booth page (Ctrl+Shift+R)</li>
                    <li>Check client-side code for any caching issues</li>
                    <li>Verify that the frontend is correctly interpreting boolean values</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 