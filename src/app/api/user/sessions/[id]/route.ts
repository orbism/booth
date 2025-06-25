import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, checkResourceOwnership } from '@/lib/auth-utils';
import { canManageSession, UserInfo } from '@/lib/permission-utils';

/**
 * GET /api/user/sessions/[id]
 * Get details of a specific booth session by ID with ownership check
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Get user from auth utils
    const user = await getCurrentUser();
    
    // Check if user is authenticated
    if (!user) {
      console.log('[API] GET session unauthorized - no user found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[API] GET session ${id} requested by user ${user.id} (${user.role})`);
    
    // Check permission using both systems for backward compatibility
    // 1. Legacy permission check
    const hasLegacyAccess = await checkResourceOwnership('boothSession', id);
    
    // 2. New permission system check
    const currentUser: UserInfo = {
      id: user.id,
      role: user.role,
      username: user.username
    };
    
    const permissionResult = await canManageSession(currentUser, id, 'read');
    
    // Only grant access if at least one system approves
    const hasAccess = hasLegacyAccess || permissionResult.allowed;
    
    if (!hasAccess) {
      console.log(`[API] GET session access denied for user ${user.id} to session ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: permissionResult.reason || 'You do not have permission to access this session'
        },
        { status: 403 }
      );
    }
    
    // Get the session details using raw query
    const sessionQuery = `
      SELECT 
        b.id, 
        b.userName, 
        b.userEmail, 
        b.photoPath, 
        b.createdAt, 
        b.shared, 
        b.emailSent, 
        b.templateUsed,
        b.eventName,
        b.mediaType,
        b.filter,
        b.eventUrlId,
        b.eventUrlPath,
        e.urlPath,
        e.eventName as eventUrlName
      FROM BoothSession b
      LEFT JOIN EventUrl e ON b.eventUrlId = e.id
      WHERE b.id = ?
    `;
    
    const sessionResults = await prisma.$queryRawUnsafe(sessionQuery, id);
    
    const session = Array.isArray(sessionResults) && sessionResults.length > 0 
      ? sessionResults[0] 
      : null;
    
    if (!session) {
      console.log(`[API] GET session not found: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    console.log(`[API] GET session success for ${id}`);
    
    // Return the session details
    return NextResponse.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('[API] Error fetching session:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch session',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/sessions/[id]
 * Delete a specific booth session with ownership check
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Get user from auth utils
    const user = await getCurrentUser();
    
    // Check if user is authenticated
    if (!user) {
      console.log('[API] DELETE session unauthorized - no user found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[API] DELETE session ${id} requested by user ${user.id} (${user.role})`);
    
    // Check permission using both systems for backward compatibility
    // 1. Legacy permission check
    const hasLegacyAccess = await checkResourceOwnership('boothSession', id);
    
    // 2. New permission system check
    const currentUser: UserInfo = {
      id: user.id,
      role: user.role,
      username: user.username
    };
    
    const permissionResult = await canManageSession(currentUser, id, 'delete');
    
    // Only grant access if at least one system approves
    const hasAccess = hasLegacyAccess || permissionResult.allowed;
    
    if (!hasAccess) {
      console.log(`[API] DELETE session access denied for user ${user.id} to session ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: permissionResult.reason || 'You do not have permission to delete this session'
        },
        { status: 403 }
      );
    }
    
    // Check if session exists
    const sessionResults = await prisma.$queryRaw`
      SELECT id FROM BoothSession WHERE id = ${id}
    `;
    
    const existingSession = Array.isArray(sessionResults) && sessionResults.length > 0 
      ? sessionResults[0] 
      : null;
    
    if (!existingSession) {
      console.log(`[API] DELETE session not found: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Delete the session
    await prisma.$executeRaw`
      DELETE FROM BoothSession WHERE id = ${id}
    `;
    
    console.log(`[API] DELETE session success for ${id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });
    
  } catch (error) {
    console.error('[API] Error deleting session:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete session',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 