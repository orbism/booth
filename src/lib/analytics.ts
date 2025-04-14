// src/lib/analytics.ts

import { v4 as uuidv4 } from 'uuid';
import { prisma } from './prisma';

type BoothAnalyticsRecord = {
    id: string;
    sessionId: string;
    boothSessionId?: string;
    eventType: string;
    timestamp: Date;
    completedAt?: Date;
    userAgent?: string;
    emailDomain?: string;
    durationMs?: number;
  };

/**
 * Anonymize email addresses for privacy-conscious analytics
 */
export function anonymizeEmail(email: string): string {
    if (!email) return '';
    
    const parts = email.split('@');
    if (parts.length !== 2) return '';
    
    // Get first 2 chars and hash the rest
    const name = parts[0];
    const firstTwo = name.substring(0, 2);
    const domain = parts[1];
    
    return `${firstTwo}***@${domain}`;
}

/**
 * Generate a unique session ID or retrieve an existing one
 * This version doesn't rely on cookies and can be used anywhere (TODO - build server component that can handle cookies)
 */
// export async function getBoothSessionId(): Promise<string> {
//     try {
//         const cookieStore = await cookies();
//         let sessionId = cookieStore.get('booth_session_id')?.value;
        
//         if (!sessionId) {
//         sessionId = uuidv4();
//         // Note: cookies can only be set in a Server Action or Route Handler
//         // We'll need to set this in the appropriate place when calling this function
//         }
        
//         return sessionId;
//     } catch (error) {
//         // Fallback if cookies() fails (e.g., in client components)
//         return uuidv4();
//     }
// }
export function generateSessionId(): string {
    return uuidv4();
}

/**
 * Track a booth session start (when user begins interacting with booth)
 */
export async function trackBoothSessionStart(userAgent: string | null) {
  try {
    const session = await prisma.boothAnalytics.create({
      data: {
        sessionId: uuidv4(),
        eventType: 'session_start',
        userAgent: userAgent || 'unknown',
        timestamp: new Date(),
      },
    });
    
    return session.id;
  } catch (error) {
    console.error('Failed to track booth session start:', error);
    return null;
  }
}

/**
 * Track when a user completes the photo booth flow
 */
export async function trackBoothSessionComplete(
  analyticsId: string | null,
  boothSessionId: string,
  userEmail: string,
  durationMs: number,
) {
  if (!analyticsId) return null;
  
  try {
    // Update the analytics record
    await prisma.boothAnalytics.update({
      where: { id: analyticsId },
      data: {
        boothSessionId,
        eventType: 'session_complete',
        emailDomain: userEmail.split('@')[1],
        durationMs,
        completedAt: new Date(),
      },
    });
    
    return true;
  } catch (error) {
    console.error('Failed to track booth session completion:', error);
    return null;
  }
}

/**
 * Track specific events during the booth flow
 */
export async function trackBoothEvent(
  analyticsId: string | null,
  eventType: 'view_start' | 'info_submitted' | 'photo_captured' | 'photo_approved' | 'email_sent' | 'retake_photo' | 'error',
  metadata?: Record<string, any>,
) {
  if (!analyticsId) return null;
  
  try {
    await prisma.boothEventLog.create({
      data: {
        analyticsId,
        eventType,
        metadata: metadata ? JSON.stringify(metadata) : null,
        timestamp: new Date(),
      },
    });
    
    return true;
  } catch (error) {
    console.error(`Failed to track booth event ${eventType}:`, error);
    return null;
  }
}

/**
 * Get analytics summary for admin dashboard
 */
export async function getAnalyticsSummary(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  try {
    // Check if tables exist before querying
    const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'BoothAnalytics'
        );
    `;
    
    const exists = Array.isArray(tableExists) && tableExists.length > 0 && tableExists[0].exists;
    
    if (!exists) {
        // Return empty data if table doesn't exist
        return {
        totalSessions: 0,
        completedSessions: 0,
        averageCompletionTimeMs: 0,
        completionRate: '0',
        topEmailDomains: []
        };
    }

    // Get session count
    const sessionCount = await prisma.boothAnalytics.findMany({
        where: {
          timestamp: {
            gte: startDate,
          },
        },
      }).then((results: BoothAnalyticsRecord[]) => results.length);
    
    // Get completed session count
    const completedSessionCount = await prisma.boothAnalytics.findMany({
        where: {
          eventType: 'session_complete',
          timestamp: {
            gte: startDate,
          },
        },
    }).then((results: BoothAnalyticsRecord[]) => results.length);
    
    // Get average completion time
    const completionTimeResult = await prisma.boothAnalytics.aggregate({
      where: {
        eventType: 'session_complete',
        timestamp: {
          gte: startDate,
        },
        durationMs: {
          not: null,
        },
      },
      _avg: {
        durationMs: true,
      },
    });
    
    // Get completion rate
    const completionRate = sessionCount > 0 
      ? (completedSessionCount / sessionCount) * 100 
      : 0;
    
    // Get email domains (for understanding traffic sources)
    const emailDomains = await prisma.boothAnalytics.groupBy({
      by: ['emailDomain'],
      where: {
        emailDomain: {
          not: null,
        },
        timestamp: {
          gte: startDate,
        },
      },
      _count: {
        emailDomain: true,
      },
      orderBy: {
        _count: {
          emailDomain: 'desc',
        },
      },
      take: 5,
    });
    
    return {
      totalSessions: sessionCount,
      completedSessions: completedSessionCount,
      averageCompletionTimeMs: completionTimeResult._avg.durationMs || 0,
      completionRate: completionRate.toFixed(1),
      topEmailDomains: emailDomains.map((domain: { emailDomain: string; _count: { emailDomain: number } }) => ({
        domain: domain.emailDomain,
        count: domain._count.emailDomain,
      })),
    };
  } catch (error) {
    console.error('Failed to get analytics summary:', error);
    return {
        totalSessions: 0,
        completedSessions: 0,
        averageCompletionTimeMs: 0,
        completionRate: '0',
        topEmailDomains: []
      };
    // return null;
  }
}