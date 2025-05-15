import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Reserved keywords that can't be used as URLs
const RESERVED_KEYWORDS = [
  'admin',
  'api',
  'auth',
  'booth',
  'dashboard',
  'login',
  'logout',
  'register',
  'setup',
  'settings',
  'subscription',
  'support',
  'verify',
  'verify-email',
  'verify-success',
  'e',
];

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
    
    // Get the user's event URLs
    const eventUrls = await prisma.eventUrl.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    
    // Return the event URLs
    return NextResponse.json({
      success: true,
      eventUrls,
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
    
    // Check if URL is already in use
    const existingUrl = await prisma.eventUrl.findUnique({
      where: { urlPath: urlPath.toLowerCase() }
    });
    
    if (existingUrl) {
      return NextResponse.json(
        { success: false, error: 'This URL is already taken' },
        { status: 400 }
      );
    }
    
    // Check subscription limits
    const userId = session.user.id;
    
    // Get the user with their subscription data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true, eventUrls: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check for URL limits based on subscription tier
    // Most tiers only allow 1 URL
    const maxUrls = user.subscription?.tier === 'GOLD' || user.subscription?.tier === 'PLATINUM' || user.subscription?.tier === 'ADMIN' ? 5 : 1;
    
    if (user.eventUrls.length >= maxUrls) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Your subscription only allows ${maxUrls} custom URL${maxUrls === 1 ? '' : 's'}. Please upgrade to add more.` 
        },
        { status: 403 }
      );
    }
    
    // Create the event URL
    const eventUrl = await prisma.eventUrl.create({
      data: {
        userId,
        urlPath: urlPath.toLowerCase(),
        eventName,
        isActive,
        eventStartDate: eventStartDate ? new Date(eventStartDate) : null,
        eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
      }
    });
    
    // Return the created URL
    return NextResponse.json({
      success: true,
      eventUrl,
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