import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { 
  getAnalyticsSummary, 
  getRecentEvents, 
  getJourneyFunnelData,
  getConversionTrend,
  getDailyMetricsForRange,
  getMediaTypeStats
} from '@/lib/analytics-server';
import { handleApiError } from '@/lib/errors';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { 
  getUserAnalyticsSummary,
  getUserRecentEvents,
  getUserJourneyFunnelData,
  getUserConversionTrend,
  getUserMediaTypeStats
} from '@/lib/analytics-server';

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
    const eventTypes = [...new Set(events.map((event: any) => event.eventType))];
    
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

// Temporary implementations until we update analytics-server.ts
// These functions will be moved to analytics-server.ts in the next step

async function getUserAnalyticsSummary(userId: string, days: number = 30) {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get total sessions in time period for this user
    const totalSessions = await prisma.boothAnalytics.count({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        userId: userId
      }
    });
    
    // Get completed sessions for this user
    const completedSessions = await prisma.boothAnalytics.count({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        eventType: 'session_complete',
        userId: userId
      }
    });
    
    // Calculate completion rate
    const completionRate = totalSessions > 0 
      ? Math.round((completedSessions / totalSessions) * 100).toString()
      : '0';
    
    // Get average completion time for this user
    const completionTimeResult = await prisma.boothAnalytics.aggregate({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        eventType: 'session_complete',
        durationMs: {
          not: null
        },
        userId: userId
      },
      _avg: {
        durationMs: true
      }
    });
    
    const averageCompletionTimeMs = completionTimeResult._avg.durationMs || 0;

    type EmailDomainGroupResult = {
      emailDomain: string | null;
      _count: {
        emailDomain: number;
      };
    };

    // Get top email domains for this user
    const queryResult = await prisma.boothAnalytics.groupBy({
      by: ['emailDomain'],
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        emailDomain: {
          not: null
        },
        userId: userId
      },
      _count: {
        emailDomain: true
      },
      orderBy: {
        _count: {
          emailDomain: 'desc'
        }
      },
      take: 5
    });
    
    // Apply the type after receiving the result
    const emailDomainsResult: EmailDomainGroupResult[] = queryResult;

    interface EmailDomainResult {
      domain: string;
      count: number;
    }
    
    const topEmailDomains = emailDomainsResult.map((result: EmailDomainGroupResult): EmailDomainResult => ({
      domain: result.emailDomain || 'unknown',
      count: result._count.emailDomain
    })).filter((item: EmailDomainResult) => item.domain !== 'unknown');
    
    return {
      totalSessions,
      completedSessions,
      averageCompletionTimeMs,
      completionRate,
      topEmailDomains
    };
  } catch (error) {
    console.error(`Failed to get analytics summary for user ${userId}:`, error);
    // Return empty data on error
    return {
      totalSessions: 0,
      completedSessions: 0,
      averageCompletionTimeMs: 0,
      completionRate: '0',
      topEmailDomains: []
    };
  }
}

async function getUserRecentEvents(userId: string, limit: number = 20) {
  try {
    // Get recent events for this user
    const events = await prisma.boothEventLog.findMany({
      where: {
        analytics: {
          userId: userId
        }
      },
      take: limit,
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        analytics: {
          select: {
            sessionId: true
          }
        }
      }
    });
    
    return events;
  } catch (error) {
    console.error(`Error fetching recent events for user ${userId}:`, error);
    return []; 
  }
}

async function getDailyMetricsForUserAndRange(userId: string, startDate: Date, endDate: Date) {
  try {
    // Generate array of dates between start and end
    const dateArray = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dateArray.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`Daily metrics: Generating metrics for ${dateArray.length} days for user ${userId}`);
    
    // Get metrics for each day
    const dailyMetrics = await Promise.all(
      dateArray.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);
        
        const dateStr = date.toISOString().split('T')[0];
        
        try {
          const totalSessions = await prisma.boothAnalytics.count({
            where: {
              timestamp: {
                gte: date,
                lt: nextDay
              },
              userId: userId
            }
          });
          
          const completedSessions = await prisma.boothAnalytics.count({
            where: {
              timestamp: {
                gte: date,
                lt: nextDay
              },
              eventType: 'session_complete',
              userId: userId
            }
          });
          
          console.log(`Daily metrics for ${dateStr} (user ${userId}): total=${totalSessions}, completed=${completedSessions}`);
          
          return {
            date: dateStr,
            totalSessions,
            completedSessions,
            completionRate: totalSessions > 0 
              ? Math.round((completedSessions / totalSessions) * 100)
              : 0
          };
        } catch (dayError) {
          console.error(`Error getting metrics for ${dateStr} (user ${userId}):`, dayError);
          return {
            date: dateStr,
            totalSessions: 0,
            completedSessions: 0,
            completionRate: 0
          };
        }
      })
    );
    
    return dailyMetrics;
  } catch (error) {
    console.error(`Failed to get daily metrics for user ${userId}:`, error);
    return [];
  }
}

async function getUserJourneyFunnelData(userId: string, days: number = 30) {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    console.log(`Journey funnel: Analyzing data from ${startDate.toISOString()} to ${endDate.toISOString()} for user ${userId}`);
    
    // Define the journey steps we want to track
    const journeySteps = [
      'view_start',
      'splash_complete', 
      'info_submitted',
      'journey_complete',
      'photo_captured',
      'video_captured',
      'photo_approved',
      'video_approved',
      'email_sent'
    ];
    
    // Get counts for each step
    const stepCounts = await Promise.all(
      journeySteps.map(async (step) => {
        let count = 0;
        
        try {
          // For view_start, we count sessions
          if (step === 'view_start') {
            count = await prisma.boothAnalytics.count({
              where: {
                timestamp: {
                  gte: startDate,
                  lte: endDate
                },
                eventType: 'session_start',
                userId: userId
              }
            });
            
            console.log(`Journey funnel for user ${userId}: '${step}' count = ${count}`);
            return { step, count };
          }
          
          // For other steps, we count events
          count = await prisma.boothEventLog.count({
            where: {
              timestamp: {
                gte: startDate,
                lte: endDate
              },
              eventType: step,
              analytics: {
                userId: userId
              }
            }
          });
          
          console.log(`Journey funnel for user ${userId}: '${step}' count = ${count}`);
          return { step, count };
        } catch (stepError) {
          console.error(`Error counting ${step} events for user ${userId}:`, stepError);
          return { step, count: 0 };
        }
      })
    );
    
    return stepCounts;
  } catch (error) {
    console.error(`Failed to get user journey funnel data for user ${userId}:`, error);
    return [];
  }
}

async function getConversionTrend(userId: string, days: number = 30) {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    console.log(`Conversion trend: Analyzing data from ${startDate.toISOString()} to ${endDate.toISOString()} for user ${userId}`);
    
    // Get conversion trend data for the specified period
    const conversionTrend = await prisma.boothAnalytics.groupBy({
      by: ['eventType'],
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        userId: userId
      },
      _count: {
        eventType: true
      },
      orderBy: {
        _count: {
          eventType: 'desc'
        }
      },
      take: 5
    });
    
    return conversionTrend;
  } catch (error) {
    console.error(`Failed to get conversion trend for user ${userId}:`, error);
    return [];
  }
}

async function getMediaTypeStats(userId: string, days: number = 30) {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    console.log(`Media type statistics: Analyzing data from ${startDate.toISOString()} to ${endDate.toISOString()} for user ${userId}`);
    
    // Get media type statistics for the specified period
    const mediaTypeStats = await prisma.boothAnalytics.groupBy({
      by: ['mediaType'],
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        userId: userId
      },
      _count: {
        mediaType: true
      },
      orderBy: {
        _count: {
          mediaType: 'desc'
        }
      },
      take: 5
    });
    
    return mediaTypeStats;
  } catch (error) {
    console.error(`Failed to get media type statistics for user ${userId}:`, error);
    return [];
  }
}