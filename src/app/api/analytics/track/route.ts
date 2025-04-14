// src/app/api/analytics/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { event, sessionId, analyticsId, boothSessionId, duration, emailDomain, userAgent, eventType, metadata } = data;
    
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
        
        return NextResponse.json({ id: analytics.id });
      }
      
      case 'session_complete': {
        if (!analyticsId) {
          return NextResponse.json(
            { error: 'Missing analyticsId parameter' },
            { status: 400 }
          );
        }
        
        // Update existing analytics entry with completion data
        await prisma.boothAnalytics.update({
          where: { id: analyticsId },
          data: {
            eventType: 'session_complete',
            boothSessionId,
            emailDomain,
            durationMs: duration,
            completedAt: new Date(),
          },
        });
        
        return NextResponse.json({ success: true });
      }
      
      case 'event': {
        if (!analyticsId || !eventType) {
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
        
        return NextResponse.json({ id: eventLog.id });
      }
      
      default:
        return NextResponse.json(
          { error: 'Unknown event type' },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleApiError(error, 'Failed to track analytics event');
  }
}