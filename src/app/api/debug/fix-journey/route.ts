import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint to diagnose and fix issues with custom journeys
 * 
 * GET /api/debug/fix-journey
 * Query parameters:
 * - userId: User ID to modify settings for
 * - id: Settings ID to modify (alternative to userId)
 * - action: Action to perform (get, enable, disable, clear, test)
 * - journeyConfig: Optional JSON string to set as journey config
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    // Get parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const settingsId = searchParams.get('id');
    const action = searchParams.get('action') || 'get';
    const journeyConfig = searchParams.get('journeyConfig');
    const urlPath = searchParams.get('urlPath');
    
    // Log parameters
    console.log('[DEBUG FIX JOURNEY] Request with params:', { userId, settingsId, action, urlPath });
    
    // Store results for response
    const results: any = {
      action,
      timestamp: new Date().toISOString(),
      success: false,
      message: '',
      data: null,
      eventUrl: null,
      beforeUpdate: null,
      afterUpdate: null,
    };
    
    // If urlPath is provided, get eventUrl to find userId
    if (urlPath) {
      try {
        const eventUrlData = await prisma.$queryRaw`
          SELECT id, userId, eventName, urlPath, isActive, createdAt, updatedAt
          FROM EventUrl 
          WHERE urlPath = ${urlPath}
          LIMIT 1
        `;
        
        if (Array.isArray(eventUrlData) && eventUrlData.length > 0) {
          results.eventUrl = eventUrlData[0];
          // Use the userId from the eventUrl if not directly provided
          if (!userId && !settingsId) {
            results.message = `Using userId from eventUrl: ${results.eventUrl.userId}`;
          }
        } else {
          results.message = `Event URL not found for path: ${urlPath}`;
          return NextResponse.json(results, { status: 404 });
        }
      } catch (error) {
        results.error = `Error fetching event URL: ${error instanceof Error ? error.message : 'Unknown error'}`;
        return NextResponse.json(results, { status: 500 });
      }
    }
    
    // Build where clause for finding settings
    let where: any = {};
    if (settingsId) {
      where.id = settingsId;
    } else if (userId) {
      where.userId = userId;
    } else if (results.eventUrl?.userId) {
      where.userId = results.eventUrl.userId;
    } else {
      results.message = 'No userId or settingsId provided';
      return NextResponse.json(results, { status: 400 });
    }
    
    // Get current settings before any changes
    try {
      // Use direct SQL query to avoid Prisma typing issues with userId
      const settingsData = await prisma.$queryRaw`
        SELECT id, userId, customJourneyEnabled, activeJourneyId, journeyConfig
        FROM Settings 
        WHERE ${where.id ? `id = ${where.id}` : `userId = ${where.userId}`}
        ORDER BY updatedAt DESC
        LIMIT 1
      `;
      
      if (!Array.isArray(settingsData) || settingsData.length === 0) {
        results.message = 'Settings not found';
        return NextResponse.json(results, { status: 404 });
      }
      
      const settings = settingsData[0];
      
      results.beforeUpdate = {
        id: settings.id,
        userId: settings.userId,
        customJourneyEnabled: settings.customJourneyEnabled,
        activeJourneyId: settings.activeJourneyId,
        journeyConfig: settings.journeyConfig
      };
      
      // For action=get, just return current settings
      if (action === 'get') {
        results.success = true;
        results.message = 'Retrieved current settings';
        results.data = results.beforeUpdate;
        
        // Parse journey config if it exists
        if (settings.journeyConfig) {
          try {
            if (typeof settings.journeyConfig === 'string') {
              results.data.parsedJourneyConfig = JSON.parse(settings.journeyConfig);
            } else {
              results.data.parsedJourneyConfig = settings.journeyConfig;
            }
          } catch (error) {
            results.data.journeyParseError = `Error parsing journey config: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        }
        
        return NextResponse.json(results);
      }
      
      // Perform the requested action
      let updateData: any = {};
      
      if (action === 'enable') {
        updateData.customJourneyEnabled = true;
        results.message = 'Enabled custom journey';
      } else if (action === 'disable') {
        updateData.customJourneyEnabled = false;
        results.message = 'Disabled custom journey';
      } else if (action === 'clear') {
        updateData.journeyConfig = null;
        updateData.activeJourneyId = null;
        results.message = 'Cleared journey config';
      } else if (action === 'test') {
        // Create a test journey config with sample pages
        const testJourney = [
          {
            id: `debug-page-1`,
            title: 'Debug Test Page 1',
            content: 'This is a test journey page created by the debug endpoint.',
            backgroundImage: null,
            buttonText: 'Next',
            buttonImage: null
          },
          {
            id: `debug-page-2`,
            title: 'Debug Test Page 2',
            content: 'If you can see this, the custom journey feature is working!',
            backgroundImage: null,
            buttonText: 'Finish',
            buttonImage: null
          }
        ];
        
        updateData.journeyConfig = JSON.stringify(testJourney);
        updateData.customJourneyEnabled = true;
        results.message = 'Set test journey config';
      } else if (action === 'set' && journeyConfig) {
        // Try to parse the provided journeyConfig
        try {
          const parsedConfig = JSON.parse(journeyConfig);
          updateData.journeyConfig = journeyConfig;
          results.message = 'Set custom journey config';
        } catch (error) {
          results.message = `Invalid journey config JSON: ${error instanceof Error ? error.message : 'Unknown error'}`;
          return NextResponse.json(results, { status: 400 });
        }
      } else {
        results.message = `Unknown or invalid action: ${action}`;
        return NextResponse.json(results, { status: 400 });
      }
      
      // Update settings using prisma
      const updatedSettings = await prisma.settings.update({
        where: { id: settings.id },
        data: updateData
      });
      
      // Query updated settings to get all fields
      const updatedSettingsData = await prisma.$queryRaw`
        SELECT id, userId, customJourneyEnabled, activeJourneyId, journeyConfig
        FROM Settings 
        WHERE id = ${settings.id}
      `;
      
      const finalSettings = Array.isArray(updatedSettingsData) && updatedSettingsData.length > 0
        ? updatedSettingsData[0]
        : updatedSettings;
      
      results.afterUpdate = {
        id: finalSettings.id,
        userId: finalSettings.userId || settings.userId, // Keep the original userId if missing
        customJourneyEnabled: finalSettings.customJourneyEnabled,
        activeJourneyId: finalSettings.activeJourneyId,
        journeyConfig: finalSettings.journeyConfig
      };
      
      results.success = true;
      
      // Parse journey config in afterUpdate if it exists
      if (finalSettings.journeyConfig) {
        try {
          if (typeof finalSettings.journeyConfig === 'string') {
            results.afterUpdate.parsedJourneyConfig = JSON.parse(finalSettings.journeyConfig);
          } else {
            results.afterUpdate.parsedJourneyConfig = finalSettings.journeyConfig;
          }
        } catch (error) {
          results.afterUpdate.journeyParseError = `Error parsing journey config: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }
      
      return NextResponse.json(results);
    } catch (error) {
      results.error = `Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return NextResponse.json(results, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to process request', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 