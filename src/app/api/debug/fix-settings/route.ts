import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/debug/fix-settings
 * Debug endpoint for fixing settings directly in the database
 * 
 * Query parameters:
 * - userId: User ID to fix settings for
 * - id: Settings ID to fix
 * - captureMode: New capture mode to set (photo/video)
 * 
 * Example: /api/debug/fix-settings?id=cmar8riqf0001j0hqj48bmrhy&captureMode=photo
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[DEBUG] Fix settings API called at ${new Date().toISOString()}`);
  
  try {
    // Get query parameters
    const settingsId = request.nextUrl.searchParams.get('id');
    const userId = request.nextUrl.searchParams.get('userId');
    const captureMode = request.nextUrl.searchParams.get('captureMode') || 'photo';
    
    if (!settingsId && !userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Either id or userId must be provided' 
      }, { status: 400 });
    }
    
    console.log(`[DEBUG] Fixing settings with ${settingsId ? `id: ${settingsId}` : `userId: ${userId}`}, setting captureMode to: ${captureMode}`);
    
    // Results object
    const results = {
      startTime,
      endTime: 0,
      processingTime: 0,
      settingsId,
      userId,
      captureMode,
      beforeUpdate: null as any,
      afterUpdate: null as any,
      rowsAffected: 0
    };
    
    // First fetch the current settings
    try {
      if (settingsId) {
        const currentSettings = await prisma.$queryRaw`
          SELECT id, captureMode, userId, updatedAt
          FROM Settings 
          WHERE id = ${settingsId}
        `;
        
        results.beforeUpdate = Array.isArray(currentSettings) && currentSettings.length > 0 
          ? currentSettings[0] 
          : null;
      } else if (userId) {
        const currentSettings = await prisma.$queryRaw`
          SELECT id, captureMode, userId, updatedAt
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
      
      // Now update the settings
      if (settingsId) {
        const updateResult = await prisma.$executeRaw`
          UPDATE Settings 
          SET captureMode = ${captureMode}, 
              updatedAt = NOW() 
          WHERE id = ${settingsId}
        `;
        
        results.rowsAffected = updateResult;
      } else if (userId) {
        const updateResult = await prisma.$executeRaw`
          UPDATE Settings 
          SET captureMode = ${captureMode}, 
              updatedAt = NOW() 
          WHERE userId = ${userId}
        `;
        
        results.rowsAffected = updateResult;
      }
      
      // Fetch updated settings
      if (settingsId) {
        const updatedSettings = await prisma.$queryRaw`
          SELECT id, captureMode, userId, updatedAt
          FROM Settings 
          WHERE id = ${settingsId}
        `;
        
        results.afterUpdate = Array.isArray(updatedSettings) && updatedSettings.length > 0 
          ? updatedSettings[0] 
          : null;
      } else if (userId) {
        const updatedSettings = await prisma.$queryRaw`
          SELECT id, captureMode, userId, updatedAt
          FROM Settings 
          WHERE userId = ${userId}
        `;
        
        results.afterUpdate = Array.isArray(updatedSettings) && updatedSettings.length > 0 
          ? updatedSettings[0] 
          : null;
      }
      
      // Calculate timing
      results.endTime = Date.now();
      results.processingTime = results.endTime - startTime;
      
      // Return success response
      return NextResponse.json({
        success: true,
        message: `Settings updated successfully, ${results.rowsAffected} row(s) affected`,
        results
      });
      
    } catch (dbError) {
      console.error('[DEBUG] Database error while fixing settings:', dbError);
      
      return NextResponse.json({ 
        success: false, 
        error: 'Database error', 
        message: dbError instanceof Error ? dbError.message : 'Unknown database error' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[DEBUG] Error in fix-settings API:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fix settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 