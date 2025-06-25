/**
 * Settings Controller
 * Handles API routes for settings management
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { z } from 'zod';
import { getUserSettings, updateUserSettings, getSettingsByUrlPath, processSettingsForClient, ensureBoolean, getSettingsByEventUrlId } from './settings-service';
import { handleApiError, unauthorizedResponse } from '@/lib/errors';

// Basic settings validation schema - can be expanded as needed
const settingsSchema = z.object({
  // General Settings
  eventName: z.string().min(1, "Event name is required").optional(),
  adminEmail: z.string().email("Invalid email address").optional(),
  countdownTime: z.coerce.number().int().min(1).max(10).optional(),
  resetTime: z.coerce.number().int().min(10).max(300).optional(),

  // Email Setup Settings
  emailSubject: z.string().min(1, "Email subject is required").optional(),
  emailTemplate: z.string().min(1, "Email template is required").optional(),
  smtpHost: z.string().min(1, "SMTP host is required").optional(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().min(1, "SMTP username is required").optional(),
  smtpPassword: z.string().min(1, "SMTP password is required").optional(),

  // Boolean fields with coercion
  customJourneyEnabled: z.preprocess(val => 
    typeof val === 'string' ? val === 'true' || val === '1' : Boolean(val), 
    z.boolean().optional()
  ),
  splashPageEnabled: z.preprocess(val => 
    typeof val === 'string' ? val === 'true' || val === '1' : Boolean(val), 
    z.boolean().optional()
  ),
  printerEnabled: z.preprocess(val => 
    typeof val === 'string' ? val === 'true' || val === '1' : Boolean(val), 
    z.boolean().optional()
  ),
  filtersEnabled: z.preprocess(val => 
    typeof val === 'string' ? val === 'true' || val === '1' : Boolean(val), 
    z.boolean().optional()
  ),
  aiImageCorrection: z.preprocess(val => 
    typeof val === 'string' ? val === 'true' || val === '1' : Boolean(val), 
    z.boolean().optional()
  ),
  showBoothBossLogo: z.preprocess(val => 
    typeof val === 'string' ? val === 'true' || val === '1' : Boolean(val), 
    z.boolean().optional()
  ),
  blobVercelEnabled: z.preprocess(val => 
    typeof val === 'string' ? val === 'true' || val === '1' : Boolean(val), 
    z.boolean().optional()
  ),

  // Capture settings
  captureMode: z.enum(["photo", "video", "both"]).optional(),
});

/**
 * Get settings for the authenticated user
 */
export async function handleGetUserSettings(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return unauthorizedResponse();
    }
    
    const userId = session.user.id;
    const role = session.user.role;
    
    // Check if we're requesting settings for a specific event URL
    const { searchParams } = new URL(request.url);
    const eventUrlId = searchParams.get('eventUrlId');
    
    // Log for debugging
    console.log(`[SETTINGS_API] GET settings for user ${userId} with role ${role}${eventUrlId ? ` and eventUrlId ${eventUrlId}` : ''}`);
    
    // Get settings for the user
    const settings = await getUserSettings(userId, eventUrlId || undefined);
    
    // Process settings for client
    const processedSettings = processSettingsForClient(settings);
    
    // Add cache control headers
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, max-age=0');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return NextResponse.json(
      processedSettings || { 
        error: 'No settings found',
        cacheVersion: Date.now()
      },
      { headers }
    );
  } catch (error) {
    return handleApiError(error, 'Failed to get user settings');
  }
}

/**
 * Update settings for the authenticated user
 */
export async function handleUpdateUserSettings(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return unauthorizedResponse();
    }
    
    const userId = session.user.id;
    const role = session.user.role;
    
    // Check if we're updating settings for a specific event URL
    const { searchParams } = new URL(request.url);
    const eventUrlId = searchParams.get('eventUrlId');
    
    // Parse and validate request body
    const body = await request.json();
    
    // Explicitly ensure all boolean fields are properly converted
    if (body.customJourneyEnabled !== undefined) {
      body.customJourneyEnabled = ensureBoolean(body.customJourneyEnabled);
    }
    if (body.splashPageEnabled !== undefined) {
      body.splashPageEnabled = ensureBoolean(body.splashPageEnabled);
    }
    if (body.printerEnabled !== undefined) {
      body.printerEnabled = ensureBoolean(body.printerEnabled);
    }
    if (body.filtersEnabled !== undefined) {
      body.filtersEnabled = ensureBoolean(body.filtersEnabled);
    }
    if (body.aiImageCorrection !== undefined) {
      body.aiImageCorrection = ensureBoolean(body.aiImageCorrection);
    }
    if (body.showBoothBossLogo !== undefined) {
      body.showBoothBossLogo = ensureBoolean(body.showBoothBossLogo);
    }
    if (body.blobVercelEnabled !== undefined) {
      body.blobVercelEnabled = ensureBoolean(body.blobVercelEnabled);
    }
    
    // Add debugging for the most common issue field
    if (body.customJourneyEnabled !== undefined) {
      console.log(`[SETTINGS_API] customJourneyEnabled before validation: ${body.customJourneyEnabled} (${typeof body.customJourneyEnabled})`);
    }
    
    // Validate the data
    const validatedData = settingsSchema.parse(body);
    
    // Log additional debug info after validation
    if (validatedData.customJourneyEnabled !== undefined) {
      console.log(`[SETTINGS_API] customJourneyEnabled after validation: ${validatedData.customJourneyEnabled} (${typeof validatedData.customJourneyEnabled})`);
    }
    
    // Log for debugging
    console.log(`[SETTINGS_API] UPDATE settings for user ${userId} with role ${role}${eventUrlId ? ` and eventUrlId ${eventUrlId}` : ''}`);
    
    // Update settings
    const updatedSettings = await updateUserSettings(
      userId, 
      validatedData, 
      role,
      eventUrlId || undefined
    );
    
    // Process settings for client
    const processedSettings = processSettingsForClient(updatedSettings);
    
    // Add cache control headers
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, max-age=0');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return NextResponse.json(
      processedSettings || { error: 'Failed to update settings' },
      { headers }
    );
  } catch (error) {
    return handleApiError(error, 'Failed to update user settings');
  }
}

/**
 * Get settings by URL path (for public booth pages)
 */
export async function handleGetSettingsByUrlPath(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urlPath = searchParams.get('urlPath');
    
    if (!urlPath) {
      return NextResponse.json(
        { error: 'urlPath parameter is required' },
        { status: 400 }
      );
    }
    
    // Log for debugging
    console.log(`[SETTINGS_API] GET settings for urlPath ${urlPath} at ${new Date().toISOString()}`);
    
    // Get settings by URL path
    const settings = await getSettingsByUrlPath(urlPath);
    
    // Process settings for client, with detailed logging
    const processedSettings = processSettingsForClient(settings);
    
    // Log what we're returning
    if (processedSettings) {
      console.log(`[SETTINGS_API] Returning processed settings for ${urlPath}:`, {
        id: processedSettings.id,
        customJourneyEnabled: processedSettings.customJourneyEnabled,
        customJourneyEnabled_type: typeof processedSettings.customJourneyEnabled,
        captureMode: processedSettings.captureMode,
        cacheVersion: processedSettings.cacheVersion
      });
    } else {
      console.error(`[SETTINGS_API] No settings found for ${urlPath}`);
    }
    
    // Add cache control headers
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, max-age=0');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return NextResponse.json(
      processedSettings || { 
        error: 'No settings found',
        cacheVersion: Date.now()
      },
      { headers }
    );
  } catch (error) {
    return handleApiError(error, 'Failed to get settings by URL path');
  }
} 