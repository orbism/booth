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