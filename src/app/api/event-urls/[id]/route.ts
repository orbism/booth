import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Define allowed role types
type UserRole = 'USER' | 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'admin';

// Event URL update validation schema
const eventUrlUpdateSchema = z.object({
  eventName: z.string().min(2, "Event name is required").optional(),
  eventStartDate: z.string().nullable().optional(),
  eventEndDate: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/event-urls/[id]
 * Get a specific event URL by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    console.log(`[API EVENT URL] GET request for ID: ${id}`);
    
    // Get user session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      console.log(`[API EVENT URL] Unauthorized GET attempt for ID: ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized',
          code: 'UNAUTHORIZED_ACCESS'
        },
        { status: 401 }
      );
    }
    
    // Get the user ID
    const userId = session.user.id;
    
    // Get the specified event URL using raw query
    const eventUrlResults = await prisma.$queryRaw`
      SELECT * FROM EventUrl WHERE id = ${id}
    `;
    
    const eventUrl = Array.isArray(eventUrlResults) && eventUrlResults.length > 0 
      ? eventUrlResults[0] 
      : null;
    
    if (!eventUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Event URL not found',
          code: 'EVENT_URL_NOT_FOUND'
        },
        { status: 404 }
      );
    }
    
    // Check if the event URL belongs to the user or if user is admin
    if (eventUrl.userId !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'You do not have permission to access this event URL',
          code: 'FORBIDDEN_ACCESS'
        },
        { status: 403 }
      );
    }
    
    // Return the event URL
    return NextResponse.json({
      success: true,
      eventUrl,
    });
    
  } catch (error) {
    console.error('[API EVENT URL] Error fetching event URL:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch event URL',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'EVENT_URL_FETCH_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/event-urls/[id]
 * Update a specific event URL
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    console.log(`[API EVENT URL] PATCH request for ID: ${id}`);
    
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
    
    // Check if the event URL exists and belongs to the user using raw query
    const eventUrlResults = await prisma.$queryRaw`
      SELECT * FROM EventUrl WHERE id = ${id}
    `;
    
    const eventUrl = Array.isArray(eventUrlResults) && eventUrlResults.length > 0 
      ? eventUrlResults[0] 
      : null;
    
    if (!eventUrl) {
      return NextResponse.json(
        { success: false, error: 'Event URL not found' },
        { status: 404 }
      );
    }
    
    // Check if the event URL belongs to the user or if user is admin
    if (eventUrl.userId !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to update this event URL' },
        { status: 403 }
      );
    }
    
    // Get update data from request
    const body = await request.json();
    
    // Validate input
    const result = eventUrlUpdateSchema.safeParse(body);
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
    
    const { eventName, eventStartDate, eventEndDate, isActive } = result.data;
    
    // Update the event URL using raw query
    let updateParts = [];
    let updateValues = [];
    
    if (eventName !== undefined) {
      updateParts.push("eventName = ?");
      updateValues.push(eventName);
    }
    
    if (eventStartDate !== undefined) {
      updateParts.push("eventStartDate = ?");
      updateValues.push(eventStartDate ? new Date(eventStartDate) : null);
    }
    
    if (eventEndDate !== undefined) {
      updateParts.push("eventEndDate = ?");
      updateValues.push(eventEndDate ? new Date(eventEndDate) : null);
    }
    
    if (isActive !== undefined) {
      updateParts.push("isActive = ?");
      updateValues.push(isActive);
    }
    
    // Add updatedAt
    updateParts.push("updatedAt = ?");
    updateValues.push(new Date());
    
    if (updateParts.length > 0) {
      const updateQuery = `
        UPDATE EventUrl
        SET ${updateParts.join(", ")}
        WHERE id = ?
      `;
      
      await prisma.$executeRawUnsafe(
        updateQuery,
        ...updateValues,
        id
      );
    }
    
    // Get the updated event URL
    const updatedEventUrlResults = await prisma.$queryRaw`
      SELECT * FROM EventUrl WHERE id = ${id}
    `;
    
    const updatedEventUrl = Array.isArray(updatedEventUrlResults) && updatedEventUrlResults.length > 0 
      ? updatedEventUrlResults[0] 
      : null;
    
    // Return the updated event URL
    return NextResponse.json({
      success: true,
      eventUrl: updatedEventUrl,
    });
    
  } catch (error) {
    console.error('Error updating event URL:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update event URL',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/event-urls/[id]
 * Delete a specific event URL
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    console.log(`[API EVENT URL] Deletion requested for ID: ${id}`);
    
    // Get user session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      console.log(`[API EVENT URL] Unauthorized deletion attempt for ID: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user ID and role
    const userId = session.user.id;
    const userRole = session.user.role as UserRole;
    
    console.log(`[API EVENT URL] Deletion attempt by user ${userId} with role ${userRole}`);
    
    // First check if the URL exists at all (without joins)
    const urlExistsCheck = await prisma.$queryRaw`
      SELECT id FROM EventUrl WHERE id = ${id}
    `;
    
    const urlExists = Array.isArray(urlExistsCheck) && urlExistsCheck.length > 0;
    
    if (!urlExists) {
      console.log(`[API EVENT URL] URL with ID ${id} not found in database`);
      return NextResponse.json(
        { success: false, error: 'Event URL not found', code: 'URL_NOT_EXISTS' },
        { status: 404 }
      );
    }
    
    // URL exists - now check if it belongs to the user or if user is admin
    let hasAccess = false;
    
    // Admin bypass - admin can delete any URL
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'admin') {
      console.log(`[API EVENT URL] Admin override for URL ${id} deletion`);
      hasAccess = true;
    } else {
      // Check ownership without join
      const ownershipCheck = await prisma.$queryRaw`
        SELECT userId FROM EventUrl WHERE id = ${id}
      `;
      
      if (Array.isArray(ownershipCheck) && ownershipCheck.length > 0) {
        const urlOwnerId = ownershipCheck[0].userId;
        console.log(`[API EVENT URL] URL ${id} belongs to user ${urlOwnerId}, requester is ${userId}`);
        
        // Check if current user is the owner
        hasAccess = urlOwnerId === userId;
      }
    }
    
    // If user doesn't have access, deny permission
    if (!hasAccess) {
      console.log(`[API EVENT URL] Access denied for user ${userId} to delete URL ${id}`);
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this event URL' },
        { status: 403 }
      );
    }
    
    // User has access, proceed with deletion
    console.log(`[API EVENT URL] Performing deletion for URL ${id}`);
    
    try {
      // Delete the event URL using raw query
      await prisma.$executeRaw`
        DELETE FROM EventUrl WHERE id = ${id}
      `;
      
      console.log(`[API EVENT URL] Successfully deleted URL ${id}`);
      
      // Return success
      return NextResponse.json({
        success: true,
        message: 'Event URL deleted successfully',
      });
    } catch (dbError) {
      console.error(`[API EVENT URL] Database error during deletion:`, dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error during URL deletion',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API EVENT URL] Error deleting event URL:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete event URL',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 