import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getCurrentUser, checkResourceOwnership } from '@/lib/auth-utils';
import { RESERVED_KEYWORDS } from '@/types/event-url';

// Event URL update validation schema
const eventUrlUpdateSchema = z.object({
  urlPath: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .max(30, "URL cannot exceed 30 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens are allowed")
    .optional(),
  eventName: z.string().min(2, "Event name is required").optional(),
  eventStartDate: z.string().optional().nullable(),
  eventEndDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/user/event-urls/[id]
 * Get a specific event URL by ID with ownership check
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get user from auth utils
    const user = await getCurrentUser();
    
    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user owns this event URL or is an admin
    const hasAccess = await checkResourceOwnership('eventUrl', id);
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to access this event URL' },
        { status: 403 }
      );
    }
    
    // Get the specified event URL using raw query
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
    
    // Return the event URL
    return NextResponse.json({
      success: true,
      eventUrl,
    });
    
  } catch (error) {
    console.error('Error fetching event URL:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch event URL',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/event-urls/[id]
 * Update a specific event URL with ownership check
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get user from auth utils
    const user = await getCurrentUser();
    
    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user owns this event URL or is an admin
    const hasAccess = await checkResourceOwnership('eventUrl', id);
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to update this event URL' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    // Validate with zod
    const validationResult = eventUrlUpdateSchema.safeParse(body);
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
    
    // Get the existing event URL for comparison
    const eventUrlResults = await prisma.$queryRaw`
      SELECT * FROM EventUrl WHERE id = ${id}
    `;
    
    const existingUrl = Array.isArray(eventUrlResults) && eventUrlResults.length > 0 
      ? eventUrlResults[0] 
      : null;
    
    if (!existingUrl) {
      return NextResponse.json(
        { success: false, error: 'Event URL not found' },
        { status: 404 }
      );
    }
    
    // If changing the URL path, check if the new path is valid and available
    if (urlPath && urlPath !== existingUrl.urlPath) {
      // Check for reserved keywords
      if (RESERVED_KEYWORDS.includes(urlPath.toLowerCase())) {
        return NextResponse.json(
          { success: false, error: 'This URL is reserved and cannot be used' },
          { status: 400 }
        );
      }
      
      // Check if already in use
      const duplicateUrlResults = await prisma.$queryRaw`
        SELECT id FROM EventUrl WHERE urlPath = ${urlPath}
      `;
      
      const duplicateUrl = Array.isArray(duplicateUrlResults) && duplicateUrlResults.length > 0 
        ? duplicateUrlResults[0] 
        : null;
      
      if (duplicateUrl) {
        return NextResponse.json(
          { success: false, error: 'URL path is already in use' },
          { status: 400 }
        );
      }
    }
    
    // Build update query dynamically with only the fields that were provided
    let updateParts = [];
    let updateValues = [];
    
    if (urlPath) {
      updateParts.push(`urlPath = ?`);
      updateValues.push(urlPath);
    }
    
    if (eventName) {
      updateParts.push(`eventName = ?`);
      updateValues.push(eventName);
    }
    
    if (isActive !== undefined) {
      updateParts.push(`isActive = ?`);
      updateValues.push(isActive);
    }
    
    if (eventStartDate !== undefined) {
      updateParts.push(`eventStartDate = ?`);
      updateValues.push(eventStartDate ? new Date(eventStartDate) : null);
    }
    
    if (eventEndDate !== undefined) {
      updateParts.push(`eventEndDate = ?`);
      updateValues.push(eventEndDate ? new Date(eventEndDate) : null);
    }
    
    // Only update if there are changes
    if (updateParts.length > 0) {
      // Add updatedAt to the update query
      updateParts.push(`updatedAt = ?`);
      updateValues.push(new Date());
      
      // Construct the query
      const updateQuery = `
        UPDATE EventUrl 
        SET ${updateParts.join(', ')} 
        WHERE id = ?
      `;
      
      // Add the ID to values
      updateValues.push(id);
      
      // Execute the update query
      await prisma.$executeRawUnsafe(updateQuery, ...updateValues);
    }
    
    // Get the updated event URL
    const updatedUrlResults = await prisma.$queryRaw`
      SELECT * FROM EventUrl WHERE id = ${id}
    `;
    
    const updatedUrl = Array.isArray(updatedUrlResults) && updatedUrlResults.length > 0 
      ? updatedUrlResults[0] 
      : null;
    
    return NextResponse.json({
      success: true, 
      eventUrl: updatedUrl
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
 * DELETE /api/user/event-urls/[id]
 * Delete a specific event URL with ownership check
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get user from auth utils
    const user = await getCurrentUser();
    
    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user owns this event URL or is an admin
    const hasAccess = await checkResourceOwnership('eventUrl', id);
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this event URL' },
        { status: 403 }
      );
    }
    
    // Check if event URL exists
    const eventUrlResults = await prisma.$queryRaw`
      SELECT * FROM EventUrl WHERE id = ${id}
    `;
    
    const existingUrl = Array.isArray(eventUrlResults) && eventUrlResults.length > 0 
      ? eventUrlResults[0] 
      : null;
    
    if (!existingUrl) {
      return NextResponse.json(
        { success: false, error: 'Event URL not found' },
        { status: 404 }
      );
    }
    
    // Delete the event URL
    await prisma.$executeRaw`
      DELETE FROM EventUrl WHERE id = ${id}
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Event URL deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting event URL:', error);
    
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