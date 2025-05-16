import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, checkResourceOwnership } from '@/lib/auth-utils';

/**
 * GET /api/user/sessions/[id]
 * Get details of a specific booth session by ID with ownership check
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
    
    // Check if the user owns this booth session or is an admin
    const hasAccess = await checkResourceOwnership('boothSession', id);
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to access this session' },
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
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Return the session details
    return NextResponse.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error fetching session:', error);
    
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
    
    // Check if the user owns this booth session or is an admin
    const hasAccess = await checkResourceOwnership('boothSession', id);
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this session' },
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
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Delete the session
    await prisma.$executeRaw`
      DELETE FROM BoothSession WHERE id = ${id}
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting session:', error);
    
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