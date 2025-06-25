/**
 * Direct Database Check API
 * For debugging settings issues
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urlPath = searchParams.get('urlPath');
    
    if (!urlPath) {
      return NextResponse.json({ error: 'urlPath parameter is required' }, { status: 400 });
    }

    // First query: Look up the event URL directly from database
    const eventUrlResults = await prisma.$queryRaw`
      SELECT * FROM EventUrl WHERE urlPath = ${urlPath}
    `;
    
    const eventUrl = Array.isArray(eventUrlResults) && eventUrlResults.length > 0
      ? eventUrlResults[0]
      : null;
      
    // If no URL found, return early
    if (!eventUrl) {
      return NextResponse.json({
        eventUrl: null,
        settings: null,
        error: 'Event URL not found'
      });
    }

    console.log(`[CHECK_DB] Found URL for ${urlPath} with userId: ${eventUrl.userId}`);
    
    // Second query: Look up settings for this user
    const settingsResults = await prisma.$queryRaw`
      SELECT * FROM Settings WHERE userId = ${eventUrl.userId}
    `;
    
    const settings = Array.isArray(settingsResults) && settingsResults.length > 0
      ? settingsResults[0]
      : null;
    
    if (settings) {
      console.log(`[CHECK_DB] Found settings for userId: ${eventUrl.userId}`);
    } else {
      console.log(`[CHECK_DB] NO SETTINGS FOUND for userId: ${eventUrl.userId}`);
    }
    
    // Return both pieces of data for inspection
    return NextResponse.json({
      eventUrl,
      settings,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[CHECK_DB] Error querying database:', error);
    return NextResponse.json({ 
      error: 'Database error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 