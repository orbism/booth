import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint for checking settings using Prisma instead of direct MySQL
 * This is a replacement for any debug endpoints that use mysql2 directly
 */
export async function GET(request: NextRequest) {
  try {
    // Get URL parameters
    const searchParams = request.nextUrl.searchParams;
    const urlPath = searchParams.get('urlPath');
    
    if (!urlPath) {
      return NextResponse.json(
        { error: 'URL path is required' },
        { status: 400 }
      );
    }
    
    console.log(`[DEBUG API] Looking up settings for URL path: ${urlPath}`);
    
    // Find event URL using Prisma
    const eventUrl = await prisma.eventUrl.findFirst({
      where: { 
        urlPath,
        isActive: true
      }
    });
    
    if (!eventUrl) {
      return NextResponse.json(
        { error: 'Event URL not found' },
        { status: 404 }
      );
    }
    
    // Find settings using Prisma
    const settings = await prisma.settings.findFirst({
      where: { userId: eventUrl.userId },
      orderBy: { updatedAt: 'desc' }
    });
    
    // Get user info for role context
    const user = await prisma.user.findUnique({
      where: { id: eventUrl.userId },
      select: { 
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    // Return detailed debug information
    return NextResponse.json({
      eventUrl,
      settings,
      user,
      debug: {
        timestamp: Date.now(),
        booleanFields: {
          customJourneyEnabled: {
            value: settings?.customJourneyEnabled,
            type: typeof settings?.customJourneyEnabled,
            jsBooleanValue: Boolean(settings?.customJourneyEnabled)
          },
          splashPageEnabled: {
            value: settings?.splashPageEnabled,
            type: typeof settings?.splashPageEnabled,
            jsBooleanValue: Boolean(settings?.splashPageEnabled)
          }
        }
      }
    });
  } catch (error) {
    console.error('[DEBUG API] Error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
} 