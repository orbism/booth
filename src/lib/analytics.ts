// src/lib/analytics.ts

import { v4 as uuidv4 } from 'uuid';

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
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return uuidv4();
}

/**
 * Track a booth session start (when user begins interacting with booth)
 * Client-safe implementation using fetch API
 */
export async function trackBoothSessionStart(userAgent: string | null) {
  try {
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'session_start',
        sessionId: uuidv4(),
        userAgent: userAgent || navigator.userAgent,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to track session start');
    }
    
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Failed to track booth session start:', error);
    return null;
  }
}

/**
 * Track when a user completes the photo booth flow
 * Client-safe implementation using fetch API
 */
export async function trackBoothSessionComplete(
  analyticsId: string | null,
  boothSessionId: string,
  userEmail: string,
  durationMs: number,
) {
  if (!analyticsId) return null;
  
  try {
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'session_complete',
        analyticsId,
        boothSessionId,
        emailDomain: userEmail.split('@')[1],
        duration: durationMs,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to track session completion');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to track booth session completion:', error);
    return null;
  }
}

/**
 * Track specific events during the booth flow
 * Client-safe implementation using fetch API
 */
export async function trackBoothEvent(
  analyticsId: string | null,
  eventType: 'view_start' | 'info_submitted' | 'photo_captured' | 'photo_approved' | 
             'email_sent' | 'retake_photo' | 'error' | 'splash_complete' | 'journey_complete',
  metadata?: Record<string, unknown>,
) {
  if (!analyticsId) return null;
  
  try {
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'event',
        analyticsId,
        eventType,
        metadata,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to track event');
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to track booth event ${eventType}:`, error);
    return null;
  }
}

// src/lib/analytics.ts (additions)

/**
 * Track journey page view events
 */
export async function trackJourneyPageView(
  analyticsId: string | null,
  pageId: string,
  pageIndex: number,
  pageTitle: string,
) {
  if (!analyticsId) return null;
  
  try {
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'event',
        analyticsId,
        eventType: 'journey_page_view',
        metadata: {
          pageId,
          pageIndex,
          pageTitle,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to track journey page view');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to track journey page view:', error);
    return null;
  }
}

/**
 * Track journey completion event
 */
export async function trackJourneyComplete(
  analyticsId: string | null,
  totalPages: number,
  timeSpentMs: number,
) {
  if (!analyticsId) return null;
  
  try {
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'event',
        analyticsId,
        eventType: 'journey_complete',
        metadata: {
          totalPages,
          timeSpentMs,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to track journey completion');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to track journey completion:', error);
    return null;
  }
}

// Intention: get analytics summary for a specified number of days
// Note: getAnalyticsSummary is a server-side function
// It should be moved to a server component or API route
// This stub just maintains the function signature but delegates to an API endpoint
// Note: This server-side stub should be replaced with actual implementation
export async function getAnalyticsSummary(/*_days: number = 30 */) {
  try {
    // Client-side code should fetch from an API endpoint
    console.warn('getAnalyticsSummary() should only be called from server components');
    
    // Return empty placeholder data
    return {
      totalSessions: 0,
      completedSessions: 0,
      averageCompletionTimeMs: 0,
      completionRate: '0',
      topEmailDomains: []
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
  }
}