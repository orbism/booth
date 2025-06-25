import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { RESERVED_KEYWORDS, getMaxEventUrlsForTier } from '@/types/event-url';
import { SubscriptionTier } from '@/types/event-url';

// Event URL validation schema
const eventUrlSchema = z.object({
  urlPath: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .max(30, "URL cannot exceed 30 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens are allowed"),
  eventName: z.string().min(2, "Event name is required"),
  eventStartDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/event-urls
 * List all event URLs for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user ID
    const userId = session.user.id;
    
    // Use raw query to get the user's event URLs with session counts
    const eventUrls = await prisma.$queryRaw`
      SELECT 
        e.id, 
        e.urlPath, 
        e.eventName, 
        e.isActive, 
        e.eventStartDate, 
        e.eventEndDate, 
        e.createdAt, 
        e.updatedAt,
        COUNT(b.id) as sessionsCount
      FROM EventUrl e
      LEFT JOIN BoothSession b ON e.id = b.eventUrlId
      WHERE e.userId = ${userId}
      GROUP BY e.id
      ORDER BY e.createdAt DESC
    `;
    
    // Return the event URLs
    return NextResponse.json({
      success: true,
      eventUrls: eventUrls || [],
    });
    
  } catch (error) {
    console.error('Error fetching event URLs:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch event URLs',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'EVENT_URLS_FETCH_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/event-urls
 * Create a new event URL
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get form data from request
    const body = await request.json();
    
    // Validate input
    const result = eventUrlSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation failed", 
          issues: result.error.issues 
        },
        { status: 400 }
      );
    }
    
    const { urlPath, eventName, eventStartDate, eventEndDate, isActive } = result.data;
    
    // Check if URL is a reserved keyword
    if (RESERVED_KEYWORDS.includes(urlPath.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'This URL is reserved and cannot be used' },
        { status: 400 }
      );
    }

    // Use transaction to prevent race conditions
    const eventUrl = await prisma.$transaction(async (tx) => {
      // Check if URL is already in use
      const existingUrl = await tx.eventUrl.findUnique({
        where: { urlPath: urlPath.toLowerCase() }
      });

      if (existingUrl) {
        throw new Error('This URL is already taken');
      }

      // Create the event URL
      return tx.eventUrl.create({
        data: {
          urlPath: urlPath.toLowerCase(),
          eventName,
          eventStartDate,
          eventEndDate,
          isActive,
          userId: session.user.id
        }
      });
    });

    return NextResponse.json({
      success: true,
      eventUrl
    });
    
  } catch (error) {
    console.error('Error creating event URL:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create event URL',
        code: 'EVENT_URL_CREATE_ERROR'
      },
      { status: 500 }
    );
  }
} 