import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { 
  getUserAnalyticsSummary,
  getUserRecentEvents,
  getUserJourneyFunnelData,
  getUserConversionTrend,
  getUserMediaTypeStats
} from '@/lib/analytics-server';
import { handleApiError } from '@/lib/errors';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';

// Number of milliseconds in a day
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * GET handler for user analytics dashboard
 * Retrieves analytics data for the current user
 */
export async function GET(request: Request) {
  try {
    // Get the current authenticated user
    const session = await getServerSession(authOptions);
    
    // Return error if not authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get user record with full profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true
      }
    });
    
    // Return error if user not found
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Parse request parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    // Use the current user's ID
    const userId = user.id;
    
    console.log(`Generating analytics dashboard for user ${userId} with ${days} days range`);
    
    // If custom date range is provided, calculate analytics for that range
    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      
      console.log(`Custom date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Calculate days between dates for the summary
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / DAY_MS);
      
      const summary = await getUserAnalyticsSummary(userId, daysDiff);
      const journeyFunnel = await getUserJourneyFunnelData(userId, daysDiff);
      const conversionTrend = await getUserConversionTrend(userId, daysDiff);
      const mediaTypeStats = await getUserMediaTypeStats(userId, daysDiff);
      
      return NextResponse.json({
        summary,
        journeyFunnel,
        conversionTrend,
        mediaTypeStats,
        customPeriod: {
          startDate,
          endDate,
          days: daysDiff
        }
      });
    }
    
    // Otherwise, get analytics for standard time periods (daily, weekly, monthly)
    // For efficiency, we'll get summary for the max period (days) and calculate the rest
    const monthly = await getUserAnalyticsSummary(userId, days);
    
    // Weekly (7 days)
    const weekly = await getUserAnalyticsSummary(userId, 7);
    
    // Daily (1 day)
    const daily = await getUserAnalyticsSummary(userId, 1);
    
    // Get recent events
    const events = await getUserRecentEvents(userId, 20);
    
    // Extract all unique event types from events
    const eventTypes = [...new Set((events as Array<{eventType: string}>).map(event => event.eventType))];
    
    // Get user journey funnel data
    const journeyFunnel = await getUserJourneyFunnelData(userId);
    
    // Get conversion trend data for the specified period
    const conversionTrend = await getUserConversionTrend(userId, days);
    
    // Get media type statistics
    const mediaTypeStats = await getUserMediaTypeStats(userId, days);
    
    // Return all analytics data
    return NextResponse.json({
      daily,
      weekly,
      monthly,
      events,
      eventTypes,
      journeyFunnel,
      conversionTrend,
      mediaTypeStats
    });
  } catch (error) {
    console.error('Error generating user analytics dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics dashboard' },
      { status: 500 }
    );
  }
}