import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/debug/settings-check
 * Debug endpoint for checking settings data and troubleshooting cache issues
 * 
 * Query parameters:
 * - urlPath: The URL path to check settings for
 * - userId: Optional user ID to check settings for
 * - flushCache: If 'true', attempts to purge caches
 * 
 * Example: /api/debug/settings-check?urlPath=testurl
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[DEBUG] Settings check API called at ${new Date().toISOString()}`);
  
  try {
    // Get query parameters
    const urlPath = request.nextUrl.searchParams.get('urlPath');
    const userId = request.nextUrl.searchParams.get('userId');
    const flushCache = request.nextUrl.searchParams.get('flushCache') === 'true';
    const timestamp = Date.now();
    
    console.log(`[DEBUG] Settings check for urlPath: ${urlPath}, userId: ${userId || 'not specified'}`);
    
    // Object to hold all our results
    const results = {
      timestamp,
      startTime,
      endTime: 0,
      processingTime: 0,
      urlPath,
      eventUrl: null as any,
      settings: null as any,
      directSettings: null as any,
      apiSettings: null as any,
      errors: [] as string[],
      cacheInfo: {
        flushed: flushCache,
        headers: {} as Record<string, string>
      }
    };
    
    // Get event URL data if urlPath is provided
    if (urlPath) {
      try {
        // Get event URL data
        const eventUrlData = await prisma.$queryRaw`
          SELECT * FROM EventUrl 
          WHERE urlPath = ${urlPath}
          LIMIT 1
        `;
        
        results.eventUrl = Array.isArray(eventUrlData) && eventUrlData.length > 0 
          ? eventUrlData[0] 
          : null;
          
        // If event URL exists, get associated user ID
        if (results.eventUrl) {
          const resolvedUserId = results.eventUrl.userId;
          
          // Get settings data directly from database
          try {
            const settingsData = await prisma.$queryRaw`
              SELECT id, captureMode, customJourneyEnabled, updatedAt, createdAt
              FROM Settings 
              WHERE userId = ${resolvedUserId}
              ORDER BY updatedAt DESC
              LIMIT 1
            `;
            
            results.directSettings = Array.isArray(settingsData) && settingsData.length > 0 
              ? settingsData[0] 
              : null;
          } catch (settingsError) {
            results.errors.push(`Error fetching direct settings: ${settingsError instanceof Error ? settingsError.message : 'Unknown error'}`);
          }
          
          // Try to get settings via the API
          try {
            const apiUrl = new URL('/api/booth/settings', request.nextUrl.origin);
            apiUrl.searchParams.append('urlPath', urlPath);
            apiUrl.searchParams.append('t', timestamp.toString());
            apiUrl.searchParams.append('debug', 'true');
            
            console.log(`[DEBUG] Fetching settings from API: ${apiUrl.toString()}`);
            
            const apiResponse = await fetch(apiUrl.toString(), {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            
            if (apiResponse.ok) {
              results.apiSettings = await apiResponse.json();
              
              // Capture relevant headers from API response
              apiResponse.headers.forEach((value, key) => {
                if (key.toLowerCase().includes('cache') || 
                    key.toLowerCase().includes('pragma') ||
                    key.toLowerCase().includes('expires') ||
                    key.toLowerCase().includes('etag') ||
                    key.toLowerCase().includes('last-modified')) {
                  results.cacheInfo.headers[key] = value;
                }
              });
            } else {
              results.errors.push(`API error: ${apiResponse.status} ${apiResponse.statusText}`);
            }
          } catch (apiError) {
            results.errors.push(`Error fetching API settings: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
          }
        } else {
          results.errors.push(`Event URL not found for path: ${urlPath}`);
        }
      } catch (eventError) {
        results.errors.push(`Error fetching event URL: ${eventError instanceof Error ? eventError.message : 'Unknown error'}`);
      }
    } else if (userId) {
      // Get settings for userId directly
      try {
        const settingsData = await prisma.$queryRaw`
          SELECT id, captureMode, customJourneyEnabled, updatedAt, createdAt
          FROM Settings 
          WHERE userId = ${userId}
          ORDER BY updatedAt DESC
          LIMIT 1
        `;
        
        results.directSettings = Array.isArray(settingsData) && settingsData.length > 0 
          ? settingsData[0] 
          : null;
      } catch (settingsError) {
        results.errors.push(`Error fetching settings for userId ${userId}: ${settingsError instanceof Error ? settingsError.message : 'Unknown error'}`);
      }
    } else {
      results.errors.push("Either urlPath or userId must be provided");
    }
    
    // Calculate timing
    results.endTime = Date.now();
    results.processingTime = results.endTime - startTime;
    
    // Create HTML response for better debugging
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Settings Debug Tool</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; line-height: 1.5; padding: 1rem; max-width: 1200px; margin: 0 auto; }
          h1 { color: #0070f3; }
          h2 { color: #0070f3; margin-top: 2rem; }
          pre { background: #f6f8fa; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; font-size: 0.85rem; }
          .card { border: 1px solid #eaeaea; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1.5rem; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .error { color: #d32f2f; }
          .success { color: #2e7d32; }
          table { width: 100%; border-collapse: collapse; }
          table th, table td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #eaeaea; }
          .debug-section { background: #f1f7ff; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; }
          .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
          .btn { display: inline-block; padding: 0.5rem 1rem; background: #0070f3; color: white; text-decoration: none; border-radius: 0.25rem; margin-right: 0.5rem; margin-bottom: 0.5rem; font-size: 0.875rem; }
          .btn-secondary { background: #fff; border: 1px solid #0070f3; color: #0070f3; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Settings Debug Tool</h1>
          <div>
            <span>Processing time: ${results.processingTime}ms</span>
          </div>
        </div>
        
        <div class="card">
          <h2>Request Info</h2>
          <table>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
            </tr>
            <tr>
              <td>URL Path</td>
              <td>${urlPath || 'Not provided'}</td>
            </tr>
            <tr>
              <td>User ID</td>
              <td>${userId || (results.eventUrl ? results.eventUrl.userId : 'Not provided')}</td>
            </tr>
            <tr>
              <td>Timestamp</td>
              <td>${new Date(timestamp).toISOString()}</td>
            </tr>
          </table>
          
          <div class="debug-section">
            <h3>Debug Actions</h3>
            <div>
              <a href="?urlPath=${urlPath || ''}&t=${Date.now()}" class="btn">Refresh</a>
              <a href="?urlPath=${urlPath || ''}&flushCache=true&t=${Date.now()}" class="btn">Flush Cache</a>
              <a href="/api/booth/settings?urlPath=${urlPath || ''}&t=${Date.now()}" target="_blank" class="btn btn-secondary">View API Response</a>
              <a href="/e/${urlPath || ''}?t=${Date.now()}" target="_blank" class="btn btn-secondary">View Event URL</a>
            </div>
          </div>
        </div>
        
        ${results.errors.length > 0 ? `
          <div class="card">
            <h2>Errors</h2>
            <ul>
              ${results.errors.map(error => `<li class="error">${error}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${results.eventUrl ? `
          <div class="card">
            <h2>Event URL</h2>
            <pre>${JSON.stringify(results.eventUrl, null, 2)}</pre>
          </div>
        ` : ''}
        
        <div class="comparison">
          ${results.directSettings ? `
            <div class="card">
              <h2>Database Settings</h2>
              <p class="success">Direct database query results</p>
              <pre>${JSON.stringify(results.directSettings, null, 2)}</pre>
            </div>
          ` : ''}
          
          ${results.apiSettings ? `
            <div class="card">
              <h2>API Settings</h2>
              <p class="success">API response data</p>
              <pre>${JSON.stringify(results.apiSettings, null, 2)}</pre>
            </div>
          ` : ''}
        </div>
        
        ${Object.keys(results.cacheInfo.headers).length > 0 ? `
          <div class="card">
            <h2>Cache Headers</h2>
            <pre>${JSON.stringify(results.cacheInfo.headers, null, 2)}</pre>
          </div>
        ` : ''}
        
        <div class="card">
          <h2>All Results</h2>
          <pre>${JSON.stringify({
            timestamp: results.timestamp,
            processingTime: results.processingTime,
            errors: results.errors,
          }, null, 2)}</pre>
        </div>
      </body>
      </html>
    `;
    
    // Return HTML response with cache control headers
    const response = new NextResponse(htmlResponse, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
    return response;
  } catch (error) {
    console.error('[DEBUG] Error in settings-check API:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 