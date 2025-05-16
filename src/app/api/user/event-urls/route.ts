import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { RESERVED_KEYWORDS } from '@/types/event-url';
import { getCurrentUser } from '@/lib/auth-utils';

// Event URL validation schema
const eventUrlSchema = z.object({
  urlPath: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .max(30, "URL cannot exceed 30 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens are allowed"),
  eventName: z.string().min(2, "Event name is required"),
  eventStartDate: z.string().optional().nullable(),
  eventEndDate: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/user/event-urls
 * List all event URLs for the specific user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from auth utils
    const user = await getCurrentUser();
    
    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Use raw query to get the user's event URLs
    const eventUrls = await prisma.$queryRaw`
      SELECT id, urlPath, eventName, isActive, eventStartDate, eventEndDate, createdAt, updatedAt
      FROM EventUrl
      WHERE userId = ${user.id}
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
 * POST /api/user/event-urls
 * Create a new event URL for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from auth utils
    const user = await getCurrentUser();
    
    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    // Validate with zod
    const validationResult = eventUrlSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    const { urlPath, eventName, isActive, eventStartDate, eventEndDate } = validationResult.data;
    
    // Check if URL is a reserved keyword
    if (RESERVED_KEYWORDS.includes(urlPath.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'This URL is reserved and cannot be used' },
        { status: 400 }
      );
    }
    
    // Check if user has subscription features
    // This would be a good place to check subscription limits
    // For now, we'll just limit URLs based on whether the user has a subscription
    
    // Check how many URLs the user already has
    const urlCountResult = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count FROM EventUrl WHERE userId = ${user.id}
    `;
    
    const urlCount = urlCountResult[0]?.count || 0;
    const urlLimit = user.subscription?.maxEventUrls || 3; // Default to 3 for free users
    
    if (urlCount >= urlLimit) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'URL limit reached', 
          details: `You can create up to ${urlLimit} URLs with your current plan` 
        },
        { status: 403 }
      );
    }
    
    // Check if the URL path is already in use with raw query
    const existingUrlResults = await prisma.$queryRaw`
      SELECT id FROM EventUrl WHERE urlPath = ${urlPath}
    `;
    
    const existingUrl = Array.isArray(existingUrlResults) && existingUrlResults.length > 0 
      ? existingUrlResults[0] 
      : null;
    
    if (existingUrl) {
      return NextResponse.json(
        { success: false, error: 'URL path is already in use' },
        { status: 400 }
      );
    }
    
    // Create the new event URL with raw query
    await prisma.$executeRaw`
      INSERT INTO EventUrl (
        id, userId, urlPath, eventName, isActive,
        eventStartDate, eventEndDate, createdAt, updatedAt
      ) VALUES (
        uuid(), ${user.id}, ${urlPath}, ${eventName},
        ${isActive},
        ${eventStartDate ? new Date(eventStartDate) : null},
        ${eventEndDate ? new Date(eventEndDate) : null},
        NOW(), NOW()
      )
    `;
    
    // Get the newly created event URL
    const newEventUrlResults = await prisma.$queryRaw`
      SELECT * FROM EventUrl 
      WHERE urlPath = ${urlPath}
      AND userId = ${user.id}
      LIMIT 1
    `;
    
    const eventUrl = Array.isArray(newEventUrlResults) && newEventUrlResults.length > 0 
      ? newEventUrlResults[0] 
      : null;
    
    return NextResponse.json({ 
      success: true, 
      eventUrl 
    }, { status: 201 });
    
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