// src/app/api/analytics/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { event, sessionId, analyticsId, boothSessionId, duration, emailDomain, userAgent, eventType, metadata } = data;
    
    console.log('Analytics tracking:', { event, sessionId, analyticsId });
    
    // Track different event types
    switch (event) {
      case 'session_start': {
        // Create new analytics entry for session start
        const analytics = await prisma.boothAnalytics.create({
          data: {
            sessionId: sessionId || crypto.randomUUID(),
            eventType: 'session_start',
            userAgent: userAgent || request.headers.get('user-agent') || null,
            timestamp: new Date(),
          },
        });
        
        console.log('Created analytics session:', analytics.id);
        return NextResponse.json({ id: analytics.id });
      }
      
      case 'session_complete': {
        if (!analyticsId) {
          console.error('Missing analyticsId parameter');
          return NextResponse.json(
            { error: 'Missing analyticsId parameter' },
            { status: 400 }
          );
        }

        // Get the media type from the request data
        const mediaType = data.mediaType || 'photo';
        
        // Update existing analytics entry with completion data
        const updated = await prisma.boothAnalytics.update({
          where: { id: analyticsId },
          data: {
            eventType: 'session_complete',
            boothSessionId,
            emailDomain,
            durationMs: duration,
            completedAt: new Date(),
            mediaType: mediaType,
          },
        });
        
        console.log('Updated analytics session:', updated.id);
        return NextResponse.json({ success: true });
      }
      
      case 'event': {
        if (!analyticsId || !eventType) {
          console.error('Missing required parameters', { analyticsId, eventType });
          return NextResponse.json(
            { error: 'Missing required parameters' },
            { status: 400 }
          );
        }
        
        // Record specific event in event log
        const eventLog = await prisma.boothEventLog.create({
          data: {
            analyticsId,
            eventType,
            metadata: metadata ? JSON.stringify(metadata) : null,
            timestamp: new Date(),
          },
        });
        
        console.log('Logged event:', eventLog.id, eventType);
        return NextResponse.json({ id: eventLog.id });
      }
      
      default:
        console.error('Unknown event type:', event);
        return NextResponse.json(
          { error: 'Unknown event type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return handleApiError(error, 'Failed to track analytics event');
  }
}