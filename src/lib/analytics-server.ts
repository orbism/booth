// src/lib/analytics-server.ts
import { prisma } from './prisma';

/**
 * Get analytics summary for the specified time period
 * This is a server-only function that accesses the database directly
 */
export async function getAnalyticsSummary(days: number = 30) {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get total sessions in time period
    const totalSessions = await prisma.boothAnalytics.count({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    // Get completed sessions
    const completedSessions = await prisma.boothAnalytics.count({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        eventType: 'session_complete'
      }
    });
    
    // Calculate completion rate
    const completionRate = totalSessions > 0 
      ? Math.round((completedSessions / totalSessions) * 100).toString()
      : '0';
    
    // Get average completion time
    const completionTimeResult = await prisma.boothAnalytics.aggregate({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        eventType: 'session_complete',
        durationMs: {
          not: null
        }
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

    // Get top email domains
    const emailDomainsResult: EmailDomainGroupResult[] = await prisma.boothAnalytics.groupBy({
      by: ['emailDomain'],
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        emailDomain: {
          not: null
        }
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
    console.error('Failed to get analytics summary:', error);
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

/**
 * Get recent analytics events
 */
export async function getRecentEvents(limit: number = 20) {
  try {
    // First get recent events
    const events = await prisma.boothEventLog.findMany({
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
    console.error('Error fetching recent events:', error);
    return []; 
  }
}

/**
 * Get analytics summary for a custom date range
 */
export async function getAnalyticsSummaryForDateRange(startDate: Date, endDate: Date) {
  try {
    // Ensure endDate includes the entire day
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);
    
    // Get total sessions in time period
    const totalSessions = await prisma.boothAnalytics.count({
      where: {
        timestamp: {
          gte: startDate,
          lte: adjustedEndDate
        }
      }
    });
    
    // Get completed sessions
    const completedSessions = await prisma.boothAnalytics.count({
      where: {
        timestamp: {
          gte: startDate,
          lte: adjustedEndDate
        },
        eventType: 'session_complete'
      }
    });
    
    // Calculate completion rate
    const completionRate = totalSessions > 0 
      ? Math.round((completedSessions / totalSessions) * 100).toString()
      : '0';
    
    // Get average completion time
    const completionTimeResult = await prisma.boothAnalytics.aggregate({
      where: {
        timestamp: {
          gte: startDate,
          lte: adjustedEndDate
        },
        eventType: 'session_complete',
        durationMs: {
          not: null
        }
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

    // Get top email domains
    const emailDomainsResult: EmailDomainGroupResult[] = await prisma.boothAnalytics.groupBy({
      by: ['emailDomain'],
      where: {
        timestamp: {
          gte: startDate,
          lte: adjustedEndDate
        },
        emailDomain: {
          not: null
        }
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

    interface EmailDomainResult {
      domain: string;
      count: number;
    }
    
    const topEmailDomains = emailDomainsResult.map((result: EmailDomainGroupResult): EmailDomainResult => ({
      domain: result.emailDomain || 'unknown',
      count: result._count.emailDomain
    })).filter((item: EmailDomainResult) => item.domain !== 'unknown');
    
    // Get daily metrics for the date range
    const dailyMetrics = await getDailyMetricsForRange(startDate, adjustedEndDate);
    
    return {
      totalSessions,
      completedSessions,
      averageCompletionTimeMs,
      completionRate,
      topEmailDomains,
      dailyMetrics
    };
  } catch (error) {
    console.error('Failed to get analytics for date range:', error);
    // Return empty data on error
    return {
      totalSessions: 0,
      completedSessions: 0,
      averageCompletionTimeMs: 0,
      completionRate: '0',
      topEmailDomains: [],
      dailyMetrics: []
    };
  }
}

/**
 * Get daily metrics for a date range
 */
export async function getDailyMetricsForRange(startDate: Date, endDate: Date) {
  try {
    // Generate array of dates between start and end
    const dateArray = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dateArray.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Get metrics for each day
    const dailyMetrics = await Promise.all(
      dateArray.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);
        
        const totalSessions = await prisma.boothAnalytics.count({
          where: {
            timestamp: {
              gte: date,
              lt: nextDay
            }
          }
        });
        
        const completedSessions = await prisma.boothAnalytics.count({
          where: {
            timestamp: {
              gte: date,
              lt: nextDay
            },
            eventType: 'session_complete'
          }
        });
        
        return {
          date: date.toISOString().split('T')[0],
          totalSessions,
          completedSessions,
          completionRate: totalSessions > 0 
            ? Math.round((completedSessions / totalSessions) * 100)
            : 0
        };
      })
    );
    
    return dailyMetrics;
  } catch (error) {
    console.error('Failed to get daily metrics:', error);
    return [];
  }
}

/**
 * Get user journey funnel data
 */
export async function getJourneyFunnelData(days: number = 30) {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Define the journey steps we want to track
    const journeySteps = [
      'view_start',
      'splash_complete', 
      'info_submitted',
      'journey_complete',
      'photo_captured',
      'photo_approved',
      'email_sent'
    ];
    
    // Get counts for each step
    const stepCounts = await Promise.all(
      journeySteps.map(async (step) => {
        // For view_start, we count sessions
        if (step === 'view_start') {
          const count = await prisma.boothAnalytics.count({
            where: {
              timestamp: {
                gte: startDate,
                lte: endDate
              },
              eventType: 'session_start'
            }
          });
          
          return { step, count };
        }
        
        // For other steps, we count events
        const count = await prisma.boothEventLog.count({
          where: {
            timestamp: {
              gte: startDate,
              lte: endDate
            },
            eventType: step
          }
        });
        
        return { step, count };
      })
    );
    
    // Make sure we log what we're returning
    console.log('Journey funnel data:', stepCounts);
    
    return stepCounts;
  } catch (error) {
    console.error('Failed to get journey funnel data:', error);
    return [];
  }
}

/**
 * Get conversion trend data for the last N days
 */
export async function getConversionTrend(days: number = 30) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await getDailyMetricsForRange(startDate, endDate);
  } catch (error) {
    console.error('Failed to get conversion trend:', error);
    return [];
  }
}