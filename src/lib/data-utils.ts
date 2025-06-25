/**
 * Database Data Conversion Utilities
 * 
 * Standardized functions for converting between database and application data formats
 */

/**
 * Convert database boolean value (0/1) to JavaScript boolean
 * 
 * @param value Database value (could be 0/1, true/false, or null/undefined)
 * @returns Standardized boolean value
 */
export function dbBoolToBoolean(value: any): boolean {
  // Extra logging for debugging
  console.log(`[dbBoolToBoolean] Converting value: ${value} (type: ${typeof value})`);
  
  // Catch special cases first
  if (value === undefined || value === null) {
    console.log(`[dbBoolToBoolean] Null/undefined value, returning FALSE`);
    return false;
  }
  
  // If it's already a boolean, return it directly
  if (typeof value === 'boolean') {
    console.log(`[dbBoolToBoolean] Value is already boolean: ${value}`);
    return value;
  }
  
  // Handle numeric cases (database typically uses 0/1)
  if (typeof value === 'number') {
    const result = value !== 0;
    console.log(`[dbBoolToBoolean] Numeric value ${value} converted to ${result}`);
    return result;
  }
  
  // Handle string cases (could be '0'/'1', 'true'/'false', etc)
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    const result = lowered === 'true' || lowered === '1' || lowered === 'yes' || lowered === 'y';
    console.log(`[dbBoolToBoolean] String value '${value}' converted to ${result}`);
    return result;
  }
  
  // Fallback - anything not explicitly true is false
  console.log(`[dbBoolToBoolean] Unknown type ${typeof value}, returning FALSE`);
  return false;
}

/**
 * Convert JavaScript boolean to database boolean (0/1)
 * 
 * @param value Boolean value
 * @returns Database representation (1 for true, 0 for false)
 */
export function booleanToDbBool(value: boolean | string | number | null | undefined): number {
  // Extra logging for debugging
  console.log(`[booleanToDbBool] Converting value: ${value} (type: ${typeof value})`);
  
  // Catch special cases first
  if (value === undefined || value === null) {
    console.log(`[booleanToDbBool] Null/undefined value, returning 0`);
    return 0;
  }
  
  // Handle boolean directly
  if (typeof value === 'boolean') {
    const result = value ? 1 : 0;
    console.log(`[booleanToDbBool] Boolean value ${value} converted to ${result}`);
    return result;
  }
  
  // Handle numeric cases
  if (typeof value === 'number') {
    const result = value === 0 ? 0 : 1;
    console.log(`[booleanToDbBool] Numeric value ${value} converted to ${result}`);
    return result;
  }
  
  // Handle string cases
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    const result = (lowered === 'true' || lowered === '1' || lowered === 'yes' || lowered === 'y') ? 1 : 0;
    console.log(`[booleanToDbBool] String value '${value}' converted to ${result}`);
    return result;
  }
  
  // Fallback
  console.log(`[booleanToDbBool] Unknown type ${typeof value}, returning 0`);
  return 0;
}

/**
 * Safely parse JSON data from database
 * 
 * @param jsonData JSON string or object from database
 * @param defaultValue Default value to return if parsing fails
 * @returns Parsed object or default value
 */
export function safeParseJson<T>(jsonData: any, defaultValue: T): T {
  if (!jsonData) {
    return defaultValue;
  }
  
  // If it's already an object, return it directly
  if (typeof jsonData === 'object' && !Array.isArray(jsonData)) {
    return jsonData as T;
  }
  
  // If it's an array, return it if the expected type is an array
  if (Array.isArray(jsonData) && Array.isArray(defaultValue)) {
    return jsonData as T;
  }
  
  // If it's a string, try to parse it
  if (typeof jsonData === 'string') {
    try {
      console.log(`[safeParseJson] Attempting to parse JSON string: ${jsonData.substring(0, 50)}${jsonData.length > 50 ? '...' : ''}`);
      const parsed = JSON.parse(jsonData) as T;
      console.log(`[safeParseJson] Successfully parsed JSON to ${Array.isArray(parsed) ? 'array' : typeof parsed}`);
      return parsed;
    } catch (error) {
      console.error('Error parsing JSON data:', error);
      return defaultValue;
    }
  }
  
  return defaultValue;
}

/**
 * Process settings data from the database to be sent to the client
 * This ensures proper typing and format conversion
 */
export function processSettingsFromDb(settings: any): any {
  if (!settings) return null;
  
  // Add user role awareness
  const userRole = settings?.userRole || 'unknown';
  console.log(`[processSettingsFromDb] Processing settings for role: ${userRole}`);
  
  // Clone settings to avoid modifying original
  const processed = { ...settings };
  
  // Process boolean fields with enhanced conversion
  const booleanFields = [
    'customJourneyEnabled',
    'splashPageEnabled',
    'printerEnabled',
    'aiImageCorrection',
    'filtersEnabled',
    'showBoothBossLogo'
  ];
  
  booleanFields.forEach(field => {
    if (field in processed) {
      const originalValue = processed[field];
      
      // Strict conversion logic for all possible value types
      if (typeof originalValue === 'boolean') {
        // Already boolean, no change needed
      } else if (typeof originalValue === 'number') {
        processed[field] = originalValue !== 0;
      } else if (typeof originalValue === 'string') {
        processed[field] = originalValue === 'true' || originalValue === '1';
      } else {
        // Default to false for null/undefined/other types
        processed[field] = false;
      }
      
      console.log(`[processSettingsFromDb] ${field}: ${originalValue} (${typeof originalValue}) → ${processed[field]} (${typeof processed[field]})`);
    }
  });
  
  // Process journey pages from stored JSON
  if (processed.journeyPagesJson && typeof processed.journeyPagesJson === 'string') {
    try {
      processed.journeyPages = JSON.parse(processed.journeyPagesJson);
    } catch (e) {
      console.error('[processSettingsFromDb] Error parsing journeyPagesJson:', e);
      processed.journeyPages = [];
    }
  } else {
    processed.journeyPages = [];
  }
  
  // Add timestamp for version tracking
  processed._timestamp = Date.now();
  
  return processed;
}

/**
 * Process settings data from the client to be stored in the database
 * This ensures proper typing and format conversion
 */
export function processSettingsForDb(settings: any): any {
  if (!settings) return null;
  
  // Clone settings to avoid modifying original
  const processed = { ...settings };
  
  // Process boolean fields for database storage
  const booleanFields = [
    'customJourneyEnabled',
    'splashPageEnabled',
    'printerEnabled',
    'aiImageCorrection',
    'filtersEnabled',
    'showBoothBossLogo'
  ];
  
  booleanFields.forEach(field => {
    if (field in processed) {
      const originalValue = processed[field];
      
      // For database, convert boolean values to 0/1
      if (typeof originalValue === 'boolean') {
        processed[field] = originalValue ? 1 : 0;
      } else if (typeof originalValue === 'string') {
        processed[field] = (originalValue === 'true' || originalValue === '1') ? 1 : 0;
      } else if (typeof originalValue === 'number') {
        processed[field] = originalValue ? 1 : 0;
      } else {
        // Default to 0 for null/undefined/other types
        processed[field] = 0;
      }
      
      console.log(`[processSettingsForDb] ${field}: ${originalValue} (${typeof originalValue}) → ${processed[field]}`);
    }
  });
  
  return processed;
}

/**
 * Debug-friendly function to log settings values
 * 
 * @param settings Settings object
 * @param label Optional label for the log
 */
export function logSettingsDebug(settings: any, label = 'Settings Debug'): void {
  if (!settings) {
    console.log(`[${label}] Settings object is null or undefined`);
    return;
  }
  
  console.log(`[${label}]`, {
    id: settings.id,
    userId: settings.userId,
    captureMode: settings.captureMode,
    customJourneyEnabled: settings.customJourneyEnabled,
    customJourneyEnabled_type: typeof settings.customJourneyEnabled,
    journeyConfigType: settings.journeyConfig ? (
      Array.isArray(settings.journeyConfig) 
        ? `Array (${settings.journeyConfig.length} items)` 
        : typeof settings.journeyConfig
    ) : 'null',
    activeJourneyId: settings.activeJourneyId,
    updatedAt: settings.updatedAt,
    fetchTimestamp: settings.fetchTimestamp,
  });
} 