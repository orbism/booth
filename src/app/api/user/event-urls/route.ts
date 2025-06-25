import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { RESERVED_KEYWORDS } from '@/types/event-url';
import { getCurrentUser } from '@/lib/auth-utils';
import { getUserByIdentifier, hasUserAccess } from '@/lib/user-utils';

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
 * Can filter by username for admin users
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[EVENT URLS API] Processing GET request");
    
    // Get authenticated user
    const currentUser = await getCurrentUser();
    
    // Check if user is authenticated
    if (!currentUser) {
      console.log("[EVENT URLS API] Unauthorized - No current user found");
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log(`[EVENT URLS API] User authenticated: ${currentUser.id}, username: ${currentUser.username}, role: ${currentUser.role}`);
    
    // Get query parameters
    const { searchParams } = request.nextUrl;
    const username = searchParams.get('username');
    const includeSettings = searchParams.get('includeSettings') === 'true';
    
    console.log(`[EVENT URLS API] Requested username param: ${username || 'none'}, includeSettings: ${includeSettings}`);
    
    // Determine which user's event URLs to fetch
    let targetUserId = currentUser.id;
    let targetUsername = currentUser.username;
    
    // If username is provided and it's different from the current user's
    if (username && username !== currentUser.username) {
      console.log(`[EVENT URLS API] Username provided (${username}) differs from current user (${currentUser.username})`);
      
      const targetUser = await getUserByIdentifier(username);
      
      if (!targetUser) {
        console.log(`[EVENT URLS API] Target user not found: ${username}`);
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      console.log(`[EVENT URLS API] Target user found: ${targetUser.id}, checking access`);
      
      // Check if current user has access to target user's data
      const hasAccess = await hasUserAccess(currentUser.id, targetUser.id, currentUser.role);
      
      if (!hasAccess) {
        console.log(`[EVENT URLS API] Access denied for user ${currentUser.id} to access event URLs for ${targetUser.id}`);
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have access to this user\'s event URLs' },
          { status: 403 }
        );
      }
      
      console.log(`[EVENT URLS API] Access granted for user ${currentUser.id} to access event URLs for ${targetUser.id}`);
      targetUserId = targetUser.id;
      targetUsername = targetUser.username;
    } else {
      console.log(`[EVENT URLS API] Using current user's ID: ${currentUser.id}`);
    }
    
    console.log(`[EVENT URLS API] Fetching event URLs for user ID: ${targetUserId}, username: ${targetUsername}`);
    
    // Use Prisma to get the target user's event URLs
    const eventUrls = await prisma.eventUrl.findMany({
      where: {
        userId: targetUserId
      },
      include: includeSettings ? {
        eventUrlSettings: {
          where: { active: true },
          include: { settings: true }
        }
      } : undefined,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`[EVENT URLS API] Found ${eventUrls.length} event URLs`);
    
    // Return the event URLs
    return NextResponse.json(eventUrls);
    
  } catch (error) {
    console.error('[EVENT URLS API] Error fetching event URLs:', error);
    
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
    console.log("[EVENT URLS API] Processing POST request to create new event URL");
    
    // Get user from auth utils
    const user = await getCurrentUser();
    
    // Check if user is authenticated
    if (!user) {
      console.log("[EVENT URLS API] Unauthorized - No current user found");
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log(`[EVENT URLS API] User authenticated: ${user.id}, role: ${user.role}`);
    
    // Parse and validate request body
    const body = await request.json();
    console.log("[EVENT URLS API] Request body:", body);
    
    // Validate with zod
    const validationResult = eventUrlSchema.safeParse(body);
    if (!validationResult.success) {
      console.log("[EVENT URLS API] Validation failed:", validationResult.error.format());
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
    console.log(`[EVENT URLS API] Validated data: urlPath=${urlPath}, eventName=${eventName}, isActive=${isActive}`);
    
    // Check if URL is a reserved keyword
    if (RESERVED_KEYWORDS.includes(urlPath.toLowerCase())) {
      console.log(`[EVENT URLS API] URL path "${urlPath}" is a reserved keyword`);
      return NextResponse.json(
        { success: false, error: 'This URL is reserved and cannot be used' },
        { status: 400 }
      );
    }
    
    // Check user URL limits (using Prisma instead of raw query)
    const urlCount = await prisma.eventUrl.count({
      where: { userId: user.id }
    });
    
    console.log(`[EVENT URLS API] User ${user.id} has ${urlCount} existing URLs`);
    
    const urlLimit = user.subscription?.maxEventUrls || 3; // Default to 3 for free users
    console.log(`[EVENT URLS API] User URL limit is ${urlLimit}`);
    
    if (urlCount >= urlLimit) {
      console.log(`[EVENT URLS API] User has reached URL limit (${urlCount}/${urlLimit})`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'URL limit reached', 
          details: `You can create up to ${urlLimit} URLs with your current plan` 
        },
        { status: 403 }
      );
    }
    
    // Check if the URL path is already in use (using Prisma)
    const existingUrl = await prisma.eventUrl.findFirst({
      where: { urlPath }
    });
    
    if (existingUrl) {
      console.log(`[EVENT URLS API] URL path "${urlPath}" is already in use`);
      return NextResponse.json(
        { success: false, error: 'URL path is already in use' },
        { status: 400 }
      );
    }
    
    console.log(`[EVENT URLS API] Creating new event URL for user ${user.id}: ${urlPath}`);
    
    // Create the new event URL with Prisma
    const eventUrl = await prisma.eventUrl.create({
      data: {
        userId: user.id,
        urlPath,
        eventName,
        isActive,
        eventStartDate: eventStartDate ? new Date(eventStartDate) : null,
        eventEndDate: eventEndDate ? new Date(eventEndDate) : null
      }
    });
    
    console.log(`[EVENT URLS API] Successfully created event URL: ${eventUrl.id}`);
    
    // Get or create user settings
    const userSettings = await prisma.settings.findFirst({
      where: { userId: user.id }
    });
    
    if (userSettings) {
      console.log(`[EVENT URLS API] Found existing settings for user ${user.id}: ${userSettings.id}`);
      
      try {
        // Link the user's settings to this event URL
        const eventUrlSettings = await prisma.eventUrlSettings.create({
          data: {
            eventUrlId: eventUrl.id,
            settingsId: userSettings.id,
            active: true
          }
        });
        console.log(`[EVENT URLS API] Created junction for eventUrl ${eventUrl.id} and settings ${userSettings.id}`);
      } catch (junctionError) {
        console.error(`[EVENT URLS API] Error creating junction:`, junctionError);
        // Don't fail the creation if we can't create the junction
      }
    } else {
      console.log(`[EVENT URLS API] No settings found for user ${user.id} - will use defaults`);
    }
    
    console.log(`[EVENT URLS API] Returning new event URL: ${eventUrl.id}`);
    return NextResponse.json(eventUrl, { status: 201 });
    
  } catch (error) {
    console.error('[EVENT URLS API] Error creating event URL:', error);
    
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