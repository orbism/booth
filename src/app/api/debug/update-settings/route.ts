import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/debug/update-settings
 * Debug endpoint for updating any field in settings directly in the database
 * 
 * Query parameters:
 * - id: Settings ID to update
 * - userId: Alternative to look up settings by userId
 * - field: Field name to update (captureMode, customJourneyEnabled, etc.)
 * - value: New value to set for the field
 * 
 * Example: /api/debug/update-settings?id=cmar8riqf0001j0hqj48bmrhy&field=captureMode&value=photo
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[DEBUG] Update settings API called at ${new Date().toISOString()}`);
  
  try {
    // Get query parameters
    const settingsId = request.nextUrl.searchParams.get('id');
    const userId = request.nextUrl.searchParams.get('userId');
    const field = request.nextUrl.searchParams.get('field');
    const value = request.nextUrl.searchParams.get('value');
    
    // Validation
    if (!settingsId && !userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Either id or userId must be provided' 
      }, { status: 400 });
    }
    
    if (!field || value === null) {
      return NextResponse.json({ 
        success: false, 
        error: 'Both field and value must be provided' 
      }, { status: 400 });
    }
    
    console.log(`[DEBUG] Updating settings with ${settingsId ? `id: ${settingsId}` : `userId: ${userId}`}, setting ${field} to: ${value}`);
    
    // Results object
    const results = {
      startTime,
      endTime: 0,
      processingTime: 0,
      settingsId,
      userId,
      field,
      value,
      beforeUpdate: null as any,
      afterUpdate: null as any,
      rowsAffected: 0,
      query: ''
    };
    
    // First fetch the current settings to verify they exist
    try {
      if (settingsId) {
        const currentSettings = await prisma.$queryRaw`
          SELECT *
          FROM Settings 
          WHERE id = ${settingsId}
        `;
        
        results.beforeUpdate = Array.isArray(currentSettings) && currentSettings.length > 0 
          ? currentSettings[0] 
          : null;
      } else if (userId) {
        const currentSettings = await prisma.$queryRaw`
          SELECT *
          FROM Settings 
          WHERE userId = ${userId}
        `;
        
        results.beforeUpdate = Array.isArray(currentSettings) && currentSettings.length > 0 
          ? currentSettings[0] 
          : null;
      }
      
      if (!results.beforeUpdate) {
        return NextResponse.json({ 
          success: false, 
          error: 'Settings not found' 
        }, { status: 404 });
      }
      
      // Get the settingsId if we only have userId
      if (!settingsId && results.beforeUpdate) {
        results.settingsId = results.beforeUpdate.id;
      }
      
      // Validate field exists on settings
      if (!(field in results.beforeUpdate)) {
        return NextResponse.json({ 
          success: false, 
          error: `Field '${field}' does not exist in Settings table` 
        }, { status: 400 });
      }
      
      // SQL is difficult to parameterize for field names, so we need to build it carefully
      const allowedFields = [
        'captureMode', 'customJourneyEnabled', 'splashPageEnabled', 'printerEnabled',
        'aiImageCorrection', 'filtersEnabled', 'showBoothBossLogo', 'blobVercelEnabled',
        'eventName', 'journeyConfig', 'theme', 'primaryColor', 'secondaryColor'
      ];
      
      if (!allowedFields.includes(field)) {
        return NextResponse.json({ 
          success: false, 
          error: `Field '${field}' is not supported for security reasons` 
        }, { status: 400 });
      }
      
      // Special handling for boolean fields
      if (['customJourneyEnabled', 'splashPageEnabled', 'printerEnabled', 'aiImageCorrection', 
           'filtersEnabled', 'showBoothBossLogo', 'blobVercelEnabled'].includes(field)) {
        const boolValue = value.toLowerCase() === 'true' || value === '1';
        
        // For booleans, we'll use a different approach with SQL literals, which is safer for this specific case
        // since field is already validated against allowedFields
        const sql = Prisma.sql`UPDATE Settings SET ${Prisma.raw(field + ' = ' + (boolValue ? '1' : '0'))}, updatedAt = NOW() WHERE id = ${results.settingsId}`;
        const updateResult = await prisma.$executeRaw(sql);
        
        results.rowsAffected = updateResult;
        results.query = `UPDATE Settings SET ${field} = ${boolValue ? 1 : 0}, updatedAt = NOW() WHERE id = '${results.settingsId}'`;
      } else {
        // For string fields, also use SQL literals in a safe manner
        const sql = Prisma.sql`UPDATE Settings SET ${Prisma.raw(field + ' = ' + "'" + value.replace(/'/g, "''") + "'")}, updatedAt = NOW() WHERE id = ${results.settingsId}`;
        const updateResult = await prisma.$executeRaw(sql);
        
        results.rowsAffected = updateResult;
        results.query = `UPDATE Settings SET ${field} = '${value}', updatedAt = NOW() WHERE id = '${results.settingsId}'`;
      }
      
      // Fetch updated settings
      const updatedSettings = await prisma.$queryRaw`
        SELECT *
        FROM Settings 
        WHERE id = ${results.settingsId}
      `;
      
      results.afterUpdate = Array.isArray(updatedSettings) && updatedSettings.length > 0 
        ? updatedSettings[0] 
        : null;
      
      // Calculate timing
      results.endTime = Date.now();
      results.processingTime = results.endTime - startTime;
      
      // HTML response for better debugging
      const htmlResponse = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Settings Update Tool</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; line-height: 1.5; padding: 1rem; max-width: 1200px; margin: 0 auto; }
            h1 { color: #0070f3; }
            h2 { color: #0070f3; margin-top: 2rem; }
            pre { background: #f6f8fa; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; font-size: 0.85rem; }
            .card { border: 1px solid #eaeaea; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1.5rem; }
            .header { display: flex; justify-content: space-between; align-items: center; }
            .success { color: #2e7d32; }
            table { width: 100%; border-collapse: collapse; }
            table th, table td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #eaeaea; }
            .value-change { display: flex; gap: 1rem; }
            .before { color: #d32f2f; text-decoration: line-through; }
            .after { color: #2e7d32; font-weight: bold; }
            .debug-section { background: #f1f7ff; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; }
            .btn { display: inline-block; padding: 0.5rem 1rem; background: #0070f3; color: white; text-decoration: none; border-radius: 0.25rem; margin-right: 0.5rem; margin-bottom: 0.5rem; font-size: 0.875rem; }
            .btn-secondary { background: #fff; border: 1px solid #0070f3; color: #0070f3; }
            form { margin-top: 1.5rem; }
            input, select { padding: 0.5rem; margin-right: 0.5rem; border: 1px solid #ddd; border-radius: 0.25rem; }
            label { margin-right: 0.5rem; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Settings Update Tool</h1>
            <div>
              <span>Processing time: ${results.processingTime}ms</span>
            </div>
          </div>
          
          <div class="card">
            <h2 class="success">Settings Updated Successfully</h2>
            <p>Updated the <strong>${field}</strong> field from <span class="before">${results.beforeUpdate?.[field]}</span> to <span class="after">${value}</span>.</p>
            <p>Rows affected: ${results.rowsAffected}</p>
            
            <h3>SQL Query</h3>
            <pre>${results.query}</pre>
            
            <div class="debug-section">
              <h3>Update Another Field</h3>
              <form action="/api/debug/update-settings" method="get">
                <input type="hidden" name="id" value="${results.settingsId}">
                
                <div style="margin-bottom: 1rem;">
                  <label for="field">Field:</label>
                  <select name="field" id="field">
                    <option value="captureMode">captureMode</option>
                    <option value="customJourneyEnabled">customJourneyEnabled</option>
                    <option value="splashPageEnabled">splashPageEnabled</option>
                    <option value="printerEnabled">printerEnabled</option>
                    <option value="aiImageCorrection">aiImageCorrection</option>
                    <option value="filtersEnabled">filtersEnabled</option>
                    <option value="showBoothBossLogo">showBoothBossLogo</option>
                    <option value="eventName">eventName</option>
                  </select>
                </div>
                
                <div style="margin-bottom: 1rem;">
                  <label for="value">Value:</label>
                  <input type="text" name="value" id="value" placeholder="New value">
                </div>
                
                <button type="submit" class="btn">Update Field</button>
              </form>
            </div>
            
            <div style="margin-top: 2rem;">
              <a href="/api/debug/settings-check?urlPath=${results.beforeUpdate?.eventUrlPath || ''}&t=${Date.now()}" class="btn">View Full Settings</a>
              <a href="/e/${results.beforeUpdate?.eventUrlPath || ''}?t=${Date.now()}" target="_blank" class="btn btn-secondary">Test Event URL</a>
            </div>
          </div>
          
          <div class="card">
            <h2>Before Update</h2>
            <pre>${JSON.stringify(results.beforeUpdate, null, 2)}</pre>
          </div>
          
          <div class="card">
            <h2>After Update</h2>
            <pre>${JSON.stringify(results.afterUpdate, null, 2)}</pre>
          </div>
        </body>
        </html>
      `;
      
      // Return HTML response
      return new NextResponse(htmlResponse, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
    } catch (dbError) {
      console.error('[DEBUG] Database error while updating settings:', dbError);
      
      return NextResponse.json({ 
        success: false, 
        error: 'Database error', 
        message: dbError instanceof Error ? dbError.message : 'Unknown database error' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[DEBUG] Error in update-settings API:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 