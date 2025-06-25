/**
 * Settings Synchronization Tests
 * 
 * These tests verify that settings are correctly handled through the entire system,
 * including boolean values, cache invalidation, and proper API responses.
 */
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureBoolean } from '../lib/settings-service';

// Mock fetch for testing API calls
global.fetch = jest.fn();

// Setup and teardown
beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Helper to mock fetch responses
function mockFetchResponse(data: any, ok = true, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: async () => data,
    headers: new Headers(),
  });
}

describe('Boolean value handling', () => {
  it('should correctly convert various inputs to boolean', () => {
    // Test all possible input types
    expect(ensureBoolean(true)).toBe(true);
    expect(ensureBoolean(false)).toBe(false);
    expect(ensureBoolean(1)).toBe(true);
    expect(ensureBoolean(0)).toBe(false);
    expect(ensureBoolean('true')).toBe(true);
    expect(ensureBoolean('false')).toBe(false);
    expect(ensureBoolean('1')).toBe(true);
    expect(ensureBoolean('0')).toBe(false);
    expect(ensureBoolean(null)).toBe(false);
    expect(ensureBoolean(undefined)).toBe(false);
    expect(ensureBoolean({})).toBe(false);
    expect(ensureBoolean([])).toBe(false);
  });
});

describe('User Settings API', () => {
  it('should fetch user settings with cache busting', async () => {
    // Import the function for testing
    const { getUserSettings } = await import('../lib/client-settings');
    
    // Mock the API response
    mockFetchResponse({
      id: 'test-id',
      customJourneyEnabled: true, // boolean true
      splashPageEnabled: 'true',  // string true
      filtersEnabled: 1,         // number 1
      printerEnabled: '1',       // string 1
      captureMode: 'photo',
      cacheVersion: 12345
    });
    
    // Call the function
    const settings = await getUserSettings();
    
    // Verify the cache busting parameter was included
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/user\/settings\?t=\d+/),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Cache-Control': 'no-cache'
        })
      })
    );
    
    // Verify boolean conversion
    expect(settings).toEqual(expect.objectContaining({
      id: 'test-id',
      customJourneyEnabled: true,  // Still boolean
      splashPageEnabled: true,     // Converted to boolean
      filtersEnabled: true,        // Converted to boolean
      printerEnabled: true,        // Converted to boolean
      captureMode: 'photo',        // String remained unchanged
      cacheVersion: 12345
    }));
  });
  
  it('should update user settings and invalidate cache', async () => {
    // Import the functions for testing
    const { updateUserSettings, invalidateSettingsCache } = await import('../lib/client-settings');
    
    // Mock both API responses
    mockFetchResponse({
      id: 'test-id',
      customJourneyEnabled: true,
      captureMode: 'video',
      cacheVersion: 12345
    });
    
    mockFetchResponse({
      success: true,
      resource: 'all',
      version: 12346
    });
    
    // Call the function with mixed boolean types
    const result = await updateUserSettings({
      customJourneyEnabled: true,
      printerEnabled: true,
      captureMode: 'video'
    });
    
    // Verify the update request
    expect(global.fetch).toHaveBeenNthCalledWith(1,
      expect.stringMatching(/\/api\/user\/settings\?t=\d+/),
      expect.objectContaining({
        method: 'PATCH',
        body: expect.any(String)
      })
    );
    
    // Verify cache invalidation was called
    expect(global.fetch).toHaveBeenNthCalledWith(2,
      expect.stringMatching(/\/api\/cache\/invalidate\?resource=/),
      expect.objectContaining({
        method: 'POST'
      })
    );
    
    // Verify the result
    expect(result).toEqual(expect.objectContaining({
      id: 'test-id',
      customJourneyEnabled: true,
      captureMode: 'video',
      success: true
    }));
  });
});

describe('Booth Settings API', () => {
  it('should fetch booth settings with proper boolean conversion', async () => {
    // Import the function for testing
    const { getBoothSettings } = await import('../lib/client-settings');
    
    // Mock the API response
    mockFetchResponse({
      id: 'test-id',
      customJourneyEnabled: 'true',  // String true
      captureMode: 'photo',
      cacheVersion: 12345
    });
    
    // Call the function
    const settings = await getBoothSettings('test-url');
    
    // Verify the URL parameter and cache busting
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/booth\/settings\?urlPath=test-url&t=\d+/),
      expect.objectContaining({
        method: 'GET'
      })
    );
    
    // Verify boolean conversion
    expect(settings).toEqual(expect.objectContaining({
      id: 'test-id',
      customJourneyEnabled: true,  // Converted to boolean
      captureMode: 'photo',
      cacheVersion: 12345
    }));
  });
  
  it('should invalidate cache with the correct resource parameter', async () => {
    // Import the function for testing
    const { invalidateSettingsCache } = await import('../lib/client-settings');
    
    // Mock the API response
    mockFetchResponse({
      success: true,
      resource: 'booth-settings',
      version: 12345
    });
    
    // Call the function with a specific resource
    const result = await invalidateSettingsCache('booth-settings');
    
    // Verify the resource parameter
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/cache\/invalidate\?resource=booth-settings&t=\d+/),
      expect.objectContaining({
        method: 'POST'
      })
    );
    
    // Verify the result
    expect(result).toBe(true);
  });
});

describe('End-to-end settings flow', () => {
  it('should update settings and reflect changes in booth settings', async () => {
    // Import all functions for testing
    const { updateUserSettings, getBoothSettings, invalidateSettingsCache } = 
      await import('../lib/client-settings');
    
    // Mock all required API responses
    // 1. Update user settings
    mockFetchResponse({
      id: 'test-id',
      customJourneyEnabled: true,
      captureMode: 'video',
      cacheVersion: 12345
    });
    
    // 2. Cache invalidation
    mockFetchResponse({
      success: true,
      resource: 'all',
      version: 12346
    });
    
    // 3. Get booth settings
    mockFetchResponse({
      id: 'test-id',
      customJourneyEnabled: true,
      captureMode: 'video',
      cacheVersion: 12346
    });
    
    // Update user settings
    await updateUserSettings({
      customJourneyEnabled: true,
      captureMode: 'video'
    });
    
    // Get booth settings
    const boothSettings = await getBoothSettings('test-url');
    
    // Verify the flow
    expect(global.fetch).toHaveBeenCalledTimes(3);
    
    // Verify booth settings reflect the update
    expect(boothSettings).toEqual(expect.objectContaining({
      customJourneyEnabled: true,
      captureMode: 'video',
      cacheVersion: 12346
    }));
  });
}); 