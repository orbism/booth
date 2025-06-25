import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/debug/url-check
 * Debug endpoint to check if a URL exists and get its details
 * 
 * Query parameters:
 * - urlPath: The URL path to check
 * 
 * Example: /api/debug/url-check?urlPath=testurl
 */
export async function GET(request: NextRequest) {
  try {
    const urlPath = request.nextUrl.searchParams.get('urlPath');
    
    if (!urlPath) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing urlPath parameter',
        example: '/api/debug/url-check?urlPath=testurl'
      }, { status: 400 });
    }
    
    console.log(`[DEBUG] Checking URL existence for: ${urlPath}`);
    
    // Check for URL in database
    const eventUrlResults = await prisma.$queryRaw`
      SELECT * FROM EventUrl WHERE urlPath = ${urlPath.toLowerCase()}
    `;
    
    const eventUrl = Array.isArray(eventUrlResults) && eventUrlResults.length > 0 
      ? eventUrlResults[0] 
      : null;
    
    if (!eventUrl) {
      return NextResponse.json({ 
        success: false, 
        exists: false,
        message: `URL '${urlPath}' does not exist in the database`,
        redirectUrl: `/e/${urlPath}`,
        publicUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/e/${urlPath}`,
      }, { status: 404 });
    }
    
    // URL exists, return details
    console.log(`[DEBUG] URL exists with ID: ${eventUrl.id}, isActive: ${eventUrl.isActive}`);
    
    // Create response with no-cache headers
    const response = NextResponse.json({
      success: true,
      exists: true,
      urlDetails: {
        id: eventUrl.id,
        urlPath: eventUrl.urlPath,
        isActive: !!eventUrl.isActive,
        eventName: eventUrl.eventName,
        userId: eventUrl.userId,
        createdAt: eventUrl.createdAt,
        updatedAt: eventUrl.updatedAt
      },
      redirectUrl: `/e/${urlPath}`,
      publicUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/e/${urlPath}`,
      timestamp: new Date().toISOString()
    });
    
    // Add cache control headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('[DEBUG] Error checking URL:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check URL',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 