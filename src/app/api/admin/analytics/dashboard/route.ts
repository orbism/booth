// src/app/api/admin/analytics/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { 
    getAnalyticsSummary, 
    getRecentEvents, 
    getAnalyticsSummaryForDateRange,
    getJourneyFunnelData,
    getConversionTrend,
    getDailyMetricsForRange
  } from '@/lib/analytics-server';
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
    
    // Check for custom date range
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    let customData = null;
    
    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      
      // Ensure valid dates
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        customData = await getAnalyticsSummaryForDateRange(startDate, endDate);
      }
    }
    
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

    console.log('Fetching journey funnel data...');
    const journeyFunnel = await getJourneyFunnelData(30); // Get 30-day funnel by default
    console.log('Journey funnel data received:', journeyFunnel);

    let customJourneyFunnel = null;
    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        // Calculate days between dates for getJourneyFunnelData
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        customJourneyFunnel = await getJourneyFunnelData(daysDiff);
      }
    }

    // Get conversion trend data
    console.log('Fetching conversion trend data...');
    const conversionTrend = await getConversionTrend(30);
    console.log('Conversion trend data received:', conversionTrend);
    
    // Custom date range conversion trend if requested
    let customConversionTrend = null;
    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        customConversionTrend = await getDailyMetricsForRange(startDate, endDate);
      }
    }
   
    return NextResponse.json({
        daily,
        weekly,
        monthly,
        custom: customData,
        events,
        eventTypes,
        journeyFunnel,
        customJourneyFunnel,
        conversionTrend,
        customConversionTrend
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch analytics dashboard data');
  }
}