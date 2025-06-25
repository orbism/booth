/**
 * Settings Service
 * Centralized service for managing booth settings
 */
import { Prisma, Settings, EventUrl } from '@prisma/client';
import { prisma } from './prisma';
import { SettingsInput, SettingsType } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/constants';

/**
 * Ensure any value is properly converted to a boolean
 */
export function ensureBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value === 'true' || value === '1';
  return false;
}

/**
 * Process settings data before sending to client
 * Type-safe settings processing with cache version
 */
export function processSettingsForClient(settings: Settings | null): (Settings & { cacheVersion: number }) | null {
  if (!settings) return null;
  
  // Create a copy to avoid modifying the original
  const result = { ...settings } as any;
  
  // Ensure boolean fields are actual booleans
  const booleanFields = [
    'customJourneyEnabled', 'splashPageEnabled', 'printerEnabled', 
    'filtersEnabled', 'aiImageCorrection', 'showBoothBossLogo',
    'blobVercelEnabled', 'isDefault'
  ];
  
  for (const field of booleanFields) {
    if (field in settings) {
      const settingsAny = settings as any;
      result[field] = ensureBoolean(settingsAny[field]);
    }
  }
  
  // Add cache control headers version
  result.cacheVersion = Date.now();
  
  return result as Settings & { cacheVersion: number };
}

/**
 * Get settings for a user
 */
export async function getUserSettings(userId: string, eventUrlId?: string): Promise<Settings | null> {
  try {
    console.log(`[SETTINGS_SERVICE] Getting settings for user ${userId}${eventUrlId ? ` and eventUrlId ${eventUrlId}` : ''}`);
    
    if (eventUrlId) {
      // If we have an eventUrlId, try to get the specific settings via junction table
      const eventUrlSettings = await prisma.eventUrlSettings.findFirst({
        where: {
          eventUrlId,
          eventUrl: {
            userId
          },
          active: true
        },
        include: {
          settings: true,
          eventUrl: true
        }
      });
      
      if (eventUrlSettings) {
        console.log(`[SETTINGS_SERVICE] Found specific settings for eventUrlId ${eventUrlId}:`, {
          settingsId: eventUrlSettings.settingsId,
          eventUrlId: eventUrlSettings.eventUrlId
        });
        return eventUrlSettings.settings;
      }
      
      console.log(`[SETTINGS_SERVICE] No specific settings found for eventUrlId ${eventUrlId}, falling back to user settings`);
    }
    
    // No eventUrlId specified or no specific settings found, get user's default settings
    const settings = await prisma.settings.findFirst({
      where: { userId }
    });
    
    console.log(`[SETTINGS_SERVICE] Retrieved settings for user ${userId}:`, 
      settings ? {
        id: settings.id,
        customJourneyEnabled: settings.customJourneyEnabled,
        captureMode: settings.captureMode
      } : 'No settings found');
    
    return settings;
  } catch (error) {
    console.error('[SETTINGS_SERVICE] Error fetching user settings:', error);
    return null;
  }
}

/**
 * Get settings by event URL ID
 */
export async function getSettingsByEventUrlId(eventUrlId: string): Promise<Settings | null> {
  try {
    console.log(`[SETTINGS_SERVICE] Looking up settings for event URL ID: ${eventUrlId}`);
    
    // First check if there's a specific setting for this event URL in the junction table
    const eventUrlSettings = await prisma.eventUrlSettings.findFirst({
      where: {
        eventUrlId,
        active: true
      },
      include: {
        settings: true,
        eventUrl: true
      }
    });
    
    if (eventUrlSettings) {
      console.log(`[SETTINGS_SERVICE] Found specific settings for eventUrlId ${eventUrlId}:`, {
        settingsId: eventUrlSettings.settingsId
      });
      return eventUrlSettings.settings;
    }
    
    // If no specific settings found, get the event URL owner's settings
    const eventUrl = await prisma.eventUrl.findUnique({
      where: { id: eventUrlId }
    });
    
    if (!eventUrl) {
      console.error(`[SETTINGS_SERVICE] Event URL with ID ${eventUrlId} not found`);
      return null;
    }
    
    console.log(`[SETTINGS_SERVICE] Found event URL owned by user ${eventUrl.userId}, fetching their settings`);
    
    const settings = await prisma.settings.findFirst({
      where: { userId: eventUrl.userId }
    });
    
    if (!settings) {
      console.error(`[SETTINGS_SERVICE] No settings found for user ${eventUrl.userId}`);
      // Create default settings for this user
      return createDefaultSettingsForUser(eventUrl.userId, eventUrl.eventName);
    }
    
    // Also create an association in the junction table for future use
    const newEventUrlSettings = await prisma.eventUrlSettings.create({
      data: {
        eventUrlId,
        settingsId: settings.id,
        active: true
      }
    });
    
    console.log(`[SETTINGS_SERVICE] Created junction for eventUrlId ${eventUrlId} and settingsId ${settings.id}`);
    
    return settings;
  } catch (error) {
    console.error('[SETTINGS_SERVICE] Error fetching settings by event URL ID:', error);
    return null;
  }
}

/**
 * Get settings by event URL path
 */
export async function getSettingsByUrlPath(urlPath: string): Promise<Settings | null> {
  try {
    console.log(`[SETTINGS_SERVICE] Looking up settings for booth URL path: ${urlPath}`);
    
    // Find the event URL using Prisma
    const eventUrl = await prisma.eventUrl.findFirst({
      where: {
        urlPath,
        isActive: true
      }
    });
    
    if (!eventUrl) {
      console.error(`[SETTINGS_SERVICE] Event URL not found: ${urlPath}`);
      return null;
    }
    
    console.log(`[SETTINGS_SERVICE] Found event URL with ID ${eventUrl.id}, owned by user ${eventUrl.userId}`);
    
    // Get settings through the event URL ID function
    return getSettingsByEventUrlId(eventUrl.id);
  } catch (error) {
    console.error('[SETTINGS_SERVICE] Error fetching settings by URL path:', error);
    return null;
  }
}

/**
 * Create or update settings for a user
 */
export async function updateUserSettings(
  userId: string, 
  data: SettingsInput,
  role: string = 'CUSTOMER',
  eventUrlId?: string
): Promise<Settings | null> {
  try {
    // Log the incoming data for debugging
    console.log(`[SETTINGS_SERVICE] [${role}] Updating settings for user ${userId}${eventUrlId ? ` and eventUrlId ${eventUrlId}` : ''}`, 
      JSON.stringify({
        customJourneyEnabled: data.customJourneyEnabled,
        captureMode: data.captureMode,
        isDefault: data.isDefault,
      }));
    
    // Process boolean fields to ensure proper type values
    const processedData: Record<string, any> = { ...data };
    const booleanFields = [
      'customJourneyEnabled', 'splashPageEnabled', 'printerEnabled', 
      'filtersEnabled', 'aiImageCorrection', 'showBoothBossLogo',
      'blobVercelEnabled', 'isDefault'
    ];
    
    for (const field of booleanFields) {
      if (field in processedData) {
        processedData[field] = ensureBoolean(processedData[field]);
        console.log(`[SETTINGS_SERVICE] Processed boolean field ${field}: ${processedData[field]}`);
      }
    }
    
    // If we're updating for a specific event URL
    if (eventUrlId) {
      console.log(`[SETTINGS_SERVICE] Updating settings for specific event URL ${eventUrlId}`);
      
      // See if a specific setting already exists for this event URL
      const existingEventUrlSettings = await prisma.eventUrlSettings.findFirst({
        where: {
          eventUrlId,
          eventUrl: {
            userId // Make sure the user owns this event URL
          }
        },
        include: {
          settings: true
        }
      });
      
      if (existingEventUrlSettings) {
        // Update the existing specific settings
        console.log(`[SETTINGS_SERVICE] Found existing specific settings for event URL ${eventUrlId}`);
        
        const updateData: Record<string, any> = { ...processedData };
        delete updateData.id;
        delete updateData.userId;
        
        // Update the settings
        const updatedSettings = await prisma.settings.update({
          where: { id: existingEventUrlSettings.settingsId },
          data: updateData as unknown as Prisma.SettingsUpdateInput
        });
        
        console.log(`[SETTINGS_SERVICE] [${role}] Specific settings updated for event URL ${eventUrlId}`);
        return updatedSettings;
      } else {
        // Create new specific settings for this event URL
        console.log(`[SETTINGS_SERVICE] Creating new specific settings for event URL ${eventUrlId}`);
        
        // Get the event URL to ensure it exists and belongs to the user
        const eventUrl = await prisma.eventUrl.findFirst({
          where: {
            id: eventUrlId,
            userId
          }
        });
        
        if (!eventUrl) {
          console.error(`[SETTINGS_SERVICE] Event URL ${eventUrlId} does not exist or doesn't belong to user ${userId}`);
          throw new Error('Event URL not found or not owned by user');
        }
        
        // Create new settings
        const createData = { 
          ...processedData,
          eventName: processedData.eventName || eventUrl.eventName || 'My Event',
          adminEmail: processedData.adminEmail || '',
          smtpHost: processedData.smtpHost || 'smtp.example.com',
          smtpPort: processedData.smtpPort ?? 587,
          smtpUser: processedData.smtpUser || 'user',
          smtpPassword: processedData.smtpPassword || 'password',
          userId // The creator of these settings
        };
        
        const newSettings = await prisma.settings.create({
          data: createData as unknown as Prisma.SettingsCreateInput
        });
        
        // Create the junction table entry
        await prisma.eventUrlSettings.create({
          data: {
            eventUrlId,
            settingsId: newSettings.id,
            active: true
          }
        });
        
        console.log(`[SETTINGS_SERVICE] [${role}] New specific settings created for event URL ${eventUrlId}`);
        return newSettings;
      }
    }
    
    // Regular user settings update (not for a specific event URL)
    // Check if settings already exist
    const existingSettings = await prisma.settings.findFirst({
      where: { userId }
    });
    
    if (existingSettings) {
      // Update existing settings
      const updateData: Record<string, any> = { ...processedData };
      delete updateData.id;
      delete updateData.userId;
      
      const updatedSettings = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: updateData as unknown as Prisma.SettingsUpdateInput
      });
      
      console.log(`[SETTINGS_SERVICE] [${role}] General settings updated for user ${userId}`);
      return updatedSettings;
    } else {
      // Create new settings
      const createData = { 
        ...processedData,
        eventName: processedData.eventName || 'My Event',
        adminEmail: processedData.adminEmail || '',
        smtpHost: processedData.smtpHost || 'smtp.example.com',
        smtpPort: processedData.smtpPort ?? 587,
        smtpUser: processedData.smtpUser || 'user',
        smtpPassword: processedData.smtpPassword || 'password',
        userId
      };
      
      const newSettings = await prisma.settings.create({
        data: createData as unknown as Prisma.SettingsCreateInput
      });
      
      console.log(`[SETTINGS_SERVICE] [${role}] New general settings created for user ${userId}`);
      return newSettings;
    }
  } catch (error) {
    console.error(`[SETTINGS_SERVICE] [${role}] Error updating settings:`, error);
    throw error;
  }
}

/**
 * Create default settings for a user (used when no settings exist)
 */
async function createDefaultSettingsForUser(userId: string, eventName?: string): Promise<Settings> {
  console.log(`[SETTINGS_SERVICE] Creating default settings for user ${userId}`);
  
  // Start with our default settings template
  const defaultData: Partial<Settings> & { userId: string } = {
    ...DEFAULT_SETTINGS,
    userId,
    eventName: eventName || 'My Event'
  };
  
  try {
    const settings = await prisma.settings.create({
      data: defaultData as unknown as Prisma.SettingsCreateInput
    });
    
    console.log(`[SETTINGS_SERVICE] Created default settings for user ${userId} with ID ${settings.id}`);
    return settings;
  } catch (error) {
    console.error(`[SETTINGS_SERVICE] Error creating default settings for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get default settings (system-wide)
 */
export async function getDefaultSettings(): Promise<Settings | null> {
  try {
    const settings = await prisma.settings.findFirst({
      where: { isDefault: true }
    });
    
    return settings;
  } catch (error) {
    console.error('[SETTINGS_SERVICE] Error fetching default settings:', error);
    return null;
  }
}

/**
 * Link settings to an event URL
 */
export async function linkSettingsToEventUrl(settingsId: string, eventUrlId: string): Promise<boolean> {
  try {
    console.log(`[SETTINGS_SERVICE] Linking settings ${settingsId} to event URL ${eventUrlId}`);
    
    // Check if the link already exists
    const existingLink = await prisma.eventUrlSettings.findFirst({
      where: {
        settingsId,
        eventUrlId
      }
    });
    
    if (existingLink) {
      // If it exists but isn't active, activate it
      if (!existingLink.active) {
        await prisma.eventUrlSettings.update({
          where: { id: existingLink.id },
          data: { active: true }
        });
        
        // Deactivate any other settings for this event URL
        await prisma.eventUrlSettings.updateMany({
          where: {
            eventUrlId,
            id: { not: existingLink.id }
          },
          data: { active: false }
        });
      }
      
      console.log(`[SETTINGS_SERVICE] Settings ${settingsId} already linked to event URL ${eventUrlId}`);
      return true;
    }
    
    // Create the link
    await prisma.eventUrlSettings.create({
      data: {
        settingsId,
        eventUrlId,
        active: true
      }
    });
    
    // Deactivate any other settings for this event URL
    await prisma.eventUrlSettings.updateMany({
      where: {
        eventUrlId,
        settingsId: { not: settingsId }
      },
      data: { active: false }
    });
    
    console.log(`[SETTINGS_SERVICE] Successfully linked settings ${settingsId} to event URL ${eventUrlId}`);
    return true;
  } catch (error) {
    console.error(`[SETTINGS_SERVICE] Error linking settings to event URL:`, error);
    return false;
  }
}

/**
 * Get all settings for a user
 */
export async function getAllUserSettings(userId: string): Promise<Settings[]> {
  try {
    console.log(`[SETTINGS_SERVICE] Getting all settings for user ${userId}`);
    
    const settings = await prisma.settings.findMany({
      where: { userId }
    });
    
    console.log(`[SETTINGS_SERVICE] Found ${settings.length} settings for user ${userId}`);
    return settings;
  } catch (error) {
    console.error('[SETTINGS_SERVICE] Error fetching all user settings:', error);
    return [];
  }
} 