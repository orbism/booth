// src/app/api/admin/analytics/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { getAnalyticsSummary, getRecentEvents } from '@/lib/analytics-server';
import { handleApiError, unauthorizedResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    
    // Fetch analytics data
    const [daily, weekly, monthly] = await Promise.all([
      getAnalyticsSummary(1),
      getAnalyticsSummary(7),
      getAnalyticsSummary(30),
    ]);
    
    // Get recent events
    const events = await getRecentEvents(50);
    
    // Get unique event types
    const eventTypesResult = await prisma.boothEventLog.groupBy({
      by: ['eventType'],
      orderBy: {
        eventType: 'asc'
      }
    });
    
    const eventTypes = eventTypesResult.map((item: { eventType: string }) => item.eventType);
        
    return NextResponse.json({
      daily,
      weekly,
      monthly,
      events,
      eventTypes
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch analytics dashboard data');
  }
}