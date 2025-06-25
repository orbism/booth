/**
 * Settings Diagnostic API
 * For troubleshooting settings synchronization issues
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureBoolean } from '@/lib/settings-service';

/**
 * GET /api/diagnose/settings?urlPath=[urlPath]
 * Get detailed diagnostic information about settings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urlPath = searchParams.get('urlPath');
    
    if (!urlPath) {
      return NextResponse.json({ error: 'urlPath parameter is required' }, { status: 400 });
    }
    
    console.log(`[DIAGNOSE] Getting diagnostic info for URL path: ${urlPath}`);
    
    // Get event URL data
    const eventUrlResults = await prisma.$queryRaw`
      SELECT id, userId, urlPath, isActive FROM EventUrl WHERE urlPath = ${urlPath} LIMIT 1
    `;

    const eventUrl = Array.isArray(eventUrlResults) && eventUrlResults.length > 0 
      ? eventUrlResults[0] as { id: string, userId: string, urlPath: string, isActive: boolean }
      : null;
    
    if (!eventUrl) {
      return NextResponse.json({ 
        error: 'Event URL not found',
        urlPath,
        timestamp: Date.now()
      }, { status: 404 });
    }
    
    // Get settings via raw query to see actual database values
    const settingsResults = await prisma.$queryRaw`
      SELECT * FROM Settings WHERE userId = ${eventUrl.userId} LIMIT 1
    `;
    
    const rawSettings = Array.isArray(settingsResults) && settingsResults.length > 0 
      ? settingsResults[0]
      : null;
    
    if (!rawSettings) {
      return NextResponse.json({ 
        error: 'Settings not found for this URL',
        urlPath,
        eventUrl,
        timestamp: Date.now()
      }, { status: 404 });
    }
    
    // Get type information for critical fields
    const typeInfo = {
      customJourneyEnabled: {
        value: rawSettings.customJourneyEnabled,
        type: typeof rawSettings.customJourneyEnabled,
        booleanValue: ensureBoolean(rawSettings.customJourneyEnabled),
        numberValue: Number(rawSettings.customJourneyEnabled),
        stringValue: String(rawSettings.customJourneyEnabled)
      },
      captureMode: {
        value: rawSettings.captureMode,
        type: typeof rawSettings.captureMode
      },
      splashPageEnabled: {
        value: rawSettings.splashPageEnabled,
        type: typeof rawSettings.splashPageEnabled,
        booleanValue: ensureBoolean(rawSettings.splashPageEnabled)
      },
      printerEnabled: {
        value: rawSettings.printerEnabled,
        type: typeof rawSettings.printerEnabled,
        booleanValue: ensureBoolean(rawSettings.printerEnabled)
      }
    };
    
    // Test API route call - what the frontend would get
    let apiSettings = null;
    try {
      const apiRoute = `/api/booth/settings?urlPath=${urlPath}`;
      const host = request.headers.get('host') || 'localhost:3000';
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const apiUrl = `${protocol}://${host}${apiRoute}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      apiSettings = await response.json();
    } catch (apiError) {
      console.error('[DIAGNOSE] Error fetching API settings:', apiError);
    }
    
    // Return all the diagnostic information
    return NextResponse.json({
      timestamp: Date.now(),
      urlPath,
      eventUrl: {
        id: eventUrl.id,
        urlPath: eventUrl.urlPath,
        userId: eventUrl.userId,
        isActive: eventUrl.isActive
      },
      rawSettings: {
        id: rawSettings.id,
        eventName: rawSettings.eventName,
        customJourneyEnabled: rawSettings.customJourneyEnabled,
        captureMode: rawSettings.captureMode,
        splashPageEnabled: rawSettings.splashPageEnabled,
        updatedAt: rawSettings.updatedAt
      },
      typeInfo,
      apiSettings: apiSettings ? {
        customJourneyEnabled: apiSettings.customJourneyEnabled,
        captureMode: apiSettings.captureMode,
        splashPageEnabled: apiSettings.splashPageEnabled
      } : null,
      summary: {
        isApiInSync: apiSettings && 
          apiSettings.customJourneyEnabled === ensureBoolean(rawSettings.customJourneyEnabled) &&
          apiSettings.captureMode === rawSettings.captureMode,
        databaseFormat: {
          customJourneyEnabled: Number.isInteger(rawSettings.customJourneyEnabled) ? 'INTEGER (0/1)' : 'OTHER',
          captureMode: typeof rawSettings.captureMode === 'string' ? 'STRING' : 'OTHER'
        }
      }
    });
  } catch (error) {
    console.error('[DIAGNOSE] Error in settings diagnostic:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    }, { status: 500 });
  }
} 