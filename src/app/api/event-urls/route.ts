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
    
    // Use raw query to get the user's event URLs due to TypeScript issues
    const eventUrls = await prisma.$queryRaw`
      SELECT id, urlPath, eventName, isActive, eventStartDate, eventEndDate, createdAt, updatedAt
      FROM EventUrl
      WHERE userId = ${userId}
      ORDER BY createdAt DESC
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
        message: error instanceof Error ? error.message : 'Unknown error' 
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
    
    // Check if URL is already in use - using raw query for TypeScript compatibility
    const existingUrl = await prisma.$queryRaw`
      SELECT id FROM EventUrl WHERE urlPath = ${urlPath.toLowerCase()}
    `;
    
    if (Array.isArray(existingUrl) && existingUrl.length > 0) {
      return NextResponse.json(
        { success: false, error: 'This URL is already taken' },
        { status: 400 }
      );
    }
    
    // Check subscription limits
    const userId = session.user.id;
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get subscription data using raw query
    const subscriptionData = await prisma.$queryRaw`
      SELECT tier FROM Subscription WHERE userId = ${userId} LIMIT 1
    `;
    
    // Get count of existing event URLs
    const urlCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM EventUrl WHERE userId = ${userId}
    `;
    const urlCount = Array.isArray(urlCountResult) && urlCountResult.length > 0 
      ? Number(urlCountResult[0].count) 
      : 0;
    
    // Get max URLs for subscription tier
    const tier = Array.isArray(subscriptionData) && subscriptionData.length > 0 
      ? (subscriptionData[0].tier as SubscriptionTier)
      : 'FREE';
    
    const maxUrls = getMaxEventUrlsForTier(tier);
    
    if (urlCount >= maxUrls) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Your subscription only allows ${maxUrls} custom URL${maxUrls === 1 ? '' : 's'}. Please upgrade to add more.` 
        },
        { status: 403 }
      );
    }
    
    // Create the event URL using raw query
    await prisma.$executeRaw`
      INSERT INTO EventUrl (
        id, userId, urlPath, eventName, isActive,
        eventStartDate, eventEndDate, createdAt, updatedAt
      ) VALUES (
        uuid(), ${userId}, ${urlPath.toLowerCase()}, ${eventName}, ${isActive},
        ${eventStartDate ? new Date(eventStartDate) : null},
        ${eventEndDate ? new Date(eventEndDate) : null},
        NOW(), NOW()
      )
    `;
    
    // Get the newly created event URL
    const newEventUrl = await prisma.$queryRaw`
      SELECT * FROM EventUrl 
      WHERE userId = ${userId} AND urlPath = ${urlPath.toLowerCase()}
      LIMIT 1
    `;
    
    // Return the created URL
    return NextResponse.json({
      success: true,
      eventUrl: Array.isArray(newEventUrl) && newEventUrl.length > 0 ? newEventUrl[0] : null,
    });
    
  } catch (error) {
    console.error('Error creating event URL:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create event URL',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 