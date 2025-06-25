import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getCurrentUser, checkResourceOwnership } from '@/lib/auth-utils';
import { RESERVED_KEYWORDS } from '@/types/event-url';
import { getUserByIdentifier, hasUserAccess } from '@/lib/user-utils';
import { canManageEventUrl, UserInfo } from '@/lib/permission-utils';

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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log(`[API] GET event URL ${id} requested`);
    
    // Get user from auth utils
    const user = await getCurrentUser();
    
    // Check if user is authenticated
    if (!user) {
      console.log('[API] GET event URL unauthorized - no user found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log(`[API] GET event URL ${id} requested by user ${user.id} (${user.role})`);
    
    // Check permission using both systems for backward compatibility
    // 1. Legacy permission check
    const hasLegacyAccess = await checkResourceOwnership('eventUrl', id);
    
    // 2. New permission system check
    const currentUser: UserInfo = {
      id: user.id,
      role: user.role,
      username: user.username
    };
    
    const permissionResult = await canManageEventUrl(currentUser, id, 'read');
    
    // Only grant access if at least one system approves
    const hasAccess = hasLegacyAccess || permissionResult.allowed;
    
    if (!hasAccess) {
      console.log(`[API] GET event URL access denied for user ${user.id} to URL ${id}: ${permissionResult.reason || 'Unknown reason'}`);
      return NextResponse.json(
        { 
          success: false, 
          error: permissionResult.reason || 'You do not have permission to access this event URL' 
        },
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
      console.log(`[API] GET event URL not found: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Event URL not found' },
        { status: 404 }
      );
    }
    
    console.log(`[API] GET event URL success for ${id}`);
    
    // Return the event URL
    return NextResponse.json({
      success: true,
      eventUrl,
    });
    
  } catch (error) {
    console.error('[API] Error fetching event URL:', error);
    
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log(`[API] PATCH event URL ${id} requested`);
    
    // Get user from auth utils
    const user = await getCurrentUser();
    
    // Check if user is authenticated
    if (!user) {
      console.log('[API] PATCH event URL unauthorized - no user found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log(`[API] PATCH event URL ${id} requested by user ${user.id} (${user.role})`);
    
    // Check permission using both systems for backward compatibility
    // 1. Legacy permission check
    const hasLegacyAccess = await checkResourceOwnership('eventUrl', id);
    
    // 2. New permission system check
    const currentUser: UserInfo = {
      id: user.id,
      role: user.role,
      username: user.username
    };
    
    const permissionResult = await canManageEventUrl(currentUser, id, 'update');
    
    // Only grant access if at least one system approves
    const hasAccess = hasLegacyAccess || permissionResult.allowed;
    
    if (!hasAccess) {
      console.log(`[API] PATCH event URL access denied for user ${user.id} to URL ${id}: ${permissionResult.reason || 'Unknown reason'}`);
      return NextResponse.json(
        { 
          success: false, 
          error: permissionResult.reason || 'You do not have permission to update this event URL' 
        },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    // Validate with zod
    const validationResult = eventUrlUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      console.log(`[API] PATCH event URL validation failed for ${id}`);
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
      console.log(`[API] PATCH event URL not found: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Event URL not found' },
        { status: 404 }
      );
    }
    
    // If changing the URL path, check if the new path is valid and available
    if (urlPath && urlPath !== existingUrl.urlPath) {
      // Check for reserved keywords
      if (RESERVED_KEYWORDS.includes(urlPath.toLowerCase())) {
        console.log(`[API] PATCH event URL reserved keyword rejected: ${urlPath}`);
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
        console.log(`[API] PATCH event URL duplicate path rejected: ${urlPath}`);
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
      
      console.log(`[API] PATCH event URL success for ${id}`);
    } else {
      console.log(`[API] PATCH event URL no changes for ${id}`);
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
    console.error('[API] Error updating event URL:', error);
    
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Get URL parameters
    const { searchParams } = request.nextUrl;
    const username = searchParams.get('username');
    
    console.log(`[API] DELETE event URL ${id} requested, username param: ${username || 'none'}, request URL: ${request.url}`);
    
    // Get the current user
    const user = await getCurrentUser();
    
    // Check if user is authenticated
    if (!user) {
      console.log(`[API] DELETE event URL unauthorized - no user found`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log(`[API] DELETE event URL ${id} requested by user ${user.id} (${user.role})`);
    
    // First verify that the URL actually exists by itself (no joins)
    const urlExistenceCheck = await prisma.$queryRaw`
      SELECT id, userId FROM EventUrl WHERE id = ${id}
    `;
    
    const urlInfo = Array.isArray(urlExistenceCheck) && urlExistenceCheck.length > 0
      ? urlExistenceCheck[0]
      : null;
    
    if (!urlInfo) {
      console.log(`[API] DELETE event URL not found: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Event URL not found', reason: 'URL_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    console.log(`[API] Found event URL ${id} belonging to user ${urlInfo.userId}`);
    
    // Check if user is admin or super admin (they can delete any URL)
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    
    // Check if user is the owner of the URL
    const isOwner = urlInfo.userId === user.id;
    
    // Admin or owner can delete
    const hasAccess = isAdmin || isOwner;
    
    console.log(`[API] Access check for URL deletion: isAdmin=${isAdmin}, isOwner=${isOwner}, hasAccess=${hasAccess}`);
    
    if (!hasAccess) {
      console.log(`[API] Access denied for user ${user.id} to delete URL ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'You do not have permission to delete this event URL',
          reason: 'PERMISSION_DENIED'
        },
        { status: 403 }
      );
    }
    
    // User has access, proceed with deletion
    console.log(`[API] Access granted for URL deletion ${id}`);
    
    try {
      await prisma.$executeRaw`
        DELETE FROM EventUrl WHERE id = ${id}
      `;
      
      console.log(`[API] Successfully deleted event URL ${id}`);
      
      return NextResponse.json({
        success: true,
        message: 'Event URL deleted successfully'
      });
    } catch (dbError) {
      console.error(`[API] Database error during URL deletion:`, dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error during deletion',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Error in DELETE event URL:', error);
    
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