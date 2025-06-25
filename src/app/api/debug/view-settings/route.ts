import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processSettingsFromDb } from '@/lib/data-utils';
import { Prisma } from '@prisma/client';

/**
 * GET /api/debug/view-settings
 * Debug endpoint to view the raw and processed settings for troubleshooting
 * Query parameters:
 * - id: Settings ID
 * - userId: User ID
 * - ts: Timestamp to force cache refresh
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const userId = url.searchParams.get('userId');
    const timestamp = url.searchParams.get('ts') || Date.now().toString();
    
    console.log(`[DEBUG VIEW SETTINGS] Request params: id=${id}, userId=${userId}, ts=${timestamp}`);
    
    if (!id && !userId) {
      return NextResponse.json(
        { error: 'Either id or userId is required' },
        { status: 400 }
      );
    }

    // Fetch the settings using the appropriate query
    let rawSettings;
    if (id) {
      rawSettings = await prisma.$queryRaw`
        SELECT * FROM Settings WHERE id = ${id} LIMIT 1
      `;
    } else if (userId) {
      rawSettings = await prisma.$queryRaw`
        SELECT * FROM Settings WHERE userId = ${userId} LIMIT 1
      `;
    }
    
    const settings = Array.isArray(rawSettings) && rawSettings.length > 0 
      ? rawSettings[0] 
      : null;
    
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }
    
    // Process the settings to see the difference
    const processedSettings = processSettingsFromDb(settings);
    
    // Create a detailed comparison of key fields
    const comparison = {
      customJourneyEnabled: {
        rawValue: settings.customJourneyEnabled,
        rawType: typeof settings.customJourneyEnabled,
        processedValue: processedSettings.customJourneyEnabled,
        processedType: typeof processedSettings.customJourneyEnabled
      },
      splashPageEnabled: {
        rawValue: settings.splashPageEnabled,
        rawType: typeof settings.splashPageEnabled,
        processedValue: processedSettings.splashPageEnabled,
        processedType: typeof processedSettings.splashPageEnabled
      },
      printerEnabled: {
        rawValue: settings.printerEnabled,
        rawType: typeof settings.printerEnabled,
        processedValue: processedSettings.printerEnabled,
        processedType: typeof processedSettings.printerEnabled
      },
      aiImageCorrection: {
        rawValue: settings.aiImageCorrection,
        rawType: typeof settings.aiImageCorrection,
        processedValue: processedSettings.aiImageCorrection,
        processedType: typeof processedSettings.aiImageCorrection
      },
      filtersEnabled: {
        rawValue: settings.filtersEnabled,
        rawType: typeof settings.filtersEnabled,
        processedValue: processedSettings.filtersEnabled,
        processedType: typeof processedSettings.filtersEnabled
      },
      journeyConfig: {
        rawValue: typeof settings.journeyConfig === 'object' ? 
          `Object with ${Object.keys(settings.journeyConfig || {}).length} keys` : 
          settings.journeyConfig,
        rawType: typeof settings.journeyConfig,
        processedValue: Array.isArray(processedSettings.journeyConfig) ? 
          `Array with ${processedSettings.journeyConfig.length} items` : 
          processedSettings.journeyConfig,
        processedType: typeof processedSettings.journeyConfig
      }
    };
    
    const endTime = Date.now();
    
    return NextResponse.json({
      success: true,
      requestParams: {
        id,
        userId,
        timestamp
      },
      timing: {
        startTime,
        endTime,
        duration: endTime - startTime
      },
      raw: settings,
      processed: processedSettings,
      comparison,
      
      // Add HTML visualization for nicer viewing in browser
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Settings Debug View</title>
          <style>
            body { font-family: system-ui, sans-serif; line-height: 1.6; padding: 20px; max-width: 1200px; margin: 0 auto; }
            h1, h2, h3 { margin-top: 20px; }
            .container { display: flex; gap: 20px; }
            .column { flex: 1; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow: auto; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .highlight { background-color: #ffffcc; }
          </style>
        </head>
        <body>
          <h1>Settings Debug View</h1>
          <p>Request processed at ${new Date().toISOString()} in ${endTime - startTime}ms</p>
          
          <h2>Request Parameters</h2>
          <ul>
            <li><strong>ID:</strong> ${id || 'Not provided'}</li>
            <li><strong>User ID:</strong> ${userId || 'Not provided'}</li>
            <li><strong>Timestamp:</strong> ${timestamp}</li>
          </ul>
          
          <h2>Boolean Values Comparison</h2>
          <table>
            <tr>
              <th>Field</th>
              <th>Raw Value</th>
              <th>Raw Type</th>
              <th>Processed Value</th>
              <th>Processed Type</th>
            </tr>
            ${Object.entries(comparison).map(([field, values]) => `
              <tr>
                <td>${field}</td>
                <td>${values.rawValue}</td>
                <td>${values.rawType}</td>
                <td>${values.processedValue}</td>
                <td>${values.processedType}</td>
              </tr>
            `).join('')}
          </table>
          
          <div class="container">
            <div class="column">
              <h2>Raw Settings</h2>
              <pre>${JSON.stringify(settings, null, 2)}</pre>
            </div>
            <div class="column">
              <h2>Processed Settings</h2>
              <pre>${JSON.stringify(processedSettings, null, 2)}</pre>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (error) {
    console.error('[DEBUG VIEW SETTINGS] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 