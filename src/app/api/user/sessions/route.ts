import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { getUserByIdentifier, hasUserAccess } from '@/lib/user-utils';
import { canAccessUserData, UserInfo } from '@/lib/permission-utils';

/**
 * GET /api/user/sessions
 * List all booth sessions for the current user or a specific user (for admins)
 * with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[SESSIONS API] Processing GET request");
    
    // Get authenticated user from auth utils
    const currentUser = await getCurrentUser();
    
    // Check if user is authenticated
    if (!currentUser) {
      console.log("[SESSIONS API] Unauthorized - No current user found");
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log(`[SESSIONS API] User authenticated: ${currentUser.id}, username: ${currentUser.username}, role: ${currentUser.role}`);
    
    // Get query parameters for pagination, filtering, and target user
    const { searchParams } = request.nextUrl;
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');
    const mediaType = searchParams.get('mediaType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const eventUrlId = searchParams.get('eventUrlId');
    const username = searchParams.get('username'); // Added username parameter
    
    console.log(`[SESSIONS API] Requested username param: ${username || 'none'}`);
    
    // Determine which user's sessions to fetch
    let targetUserId = currentUser.id;
    let targetUsername = currentUser.username;
    
    // If username is provided and it's different from the current user's
    if (username && username !== currentUser.username) {
      console.log(`[SESSIONS API] Username provided (${username}) differs from current user (${currentUser.username})`);
      
      const targetUser = await getUserByIdentifier(username);
      
      if (!targetUser) {
        console.log(`[SESSIONS API] Target user not found: ${username}`);
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      console.log(`[SESSIONS API] Target user found: ${targetUser.id}, checking access`);
      
      // Check permissions using both systems for backward compatibility
      // 1. Legacy permission check
      const hasLegacyAccess = await hasUserAccess(currentUser.id, targetUser.id, currentUser.role);
      
      // 2. New permission system check
      const user: UserInfo = {
        id: currentUser.id,
        role: currentUser.role,
        username: currentUser.username
      };
      
      const permissionResult = await canAccessUserData(user, targetUser.id);
      
      // Only grant access if at least one system approves
      const hasAccess = hasLegacyAccess || permissionResult.allowed;
      
      if (!hasAccess) {
        console.log(`[SESSIONS API] Access denied for user ${currentUser.id} to access sessions for ${targetUser.id}: ${permissionResult.reason || 'Unknown reason'}`);
        return NextResponse.json(
          { 
            success: false, 
            error: permissionResult.reason || 'Forbidden: You do not have access to this user\'s sessions'
          },
          { status: 403 }
        );
      }
      
      console.log(`[SESSIONS API] Access granted for user ${currentUser.id} to access sessions for ${targetUser.id}`);
      targetUserId = targetUser.id;
      targetUsername = targetUser.username;
    } else {
      console.log(`[SESSIONS API] Using current user's ID: ${currentUser.id}`);
    }
    
    console.log(`[SESSIONS API] Fetching sessions for user ID: ${targetUserId}, username: ${targetUsername}`);
    
    const skip = (page - 1) * limit;
    
    // Build the where clause
    let whereClause = `userId = ?`;
    const whereParams: any[] = [targetUserId];
    
    // Add media type filter if provided
    if (mediaType) {
      whereClause += ` AND mediaType = ?`;
      whereParams.push(mediaType);
    }
    
    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause += ` AND createdAt BETWEEN ? AND ?`;
      whereParams.push(new Date(startDate), new Date(endDate));
    }
    
    // Add event URL filter if provided
    if (eventUrlId) {
      whereClause += ` AND eventUrlId = ?`;
      whereParams.push(eventUrlId);
    }
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM BoothSession 
      WHERE ${whereClause}
    `;
    
    try {
      const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(
        countQuery, 
        ...whereParams
      );
      
      const totalCount = countResult[0]?.count || 0;
      
      console.log(`[SESSIONS API] Total sessions found: ${totalCount}`);
      
      // If no sessions found, return an empty array instead of a failure
      if (totalCount === 0) {
        console.log(`[SESSIONS API] No sessions found for user ${targetUserId}`);
        return NextResponse.json({
          success: true,
          sessions: [],
          pagination: {
            totalCount: 0,
            page,
            limit,
            totalPages: 0
          }
        });
      }
      
      // Get the sessions with pagination
      const sessionsQuery = `
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
        WHERE ${whereClause}
        ORDER BY b.createdAt DESC
        LIMIT ? OFFSET ?
      `;
      
      const sessions = await prisma.$queryRawUnsafe(
        sessionsQuery, 
        ...whereParams, 
        limit, 
        skip
      );
      
      console.log(`[SESSIONS API] Fetched ${Array.isArray(sessions) ? sessions.length : 0} sessions for page ${page}`);
      
      // Add mediaUrl and status fields for backward compatibility with frontend
      const enhancedSessions = Array.isArray(sessions) ? sessions.map((session: any) => ({
        ...session,
        mediaUrl: session.photoPath, // Backward compatibility
        status: session.emailSent ? 'complete' : 'incomplete', // Backward compatibility
      })) : [];
      
      return NextResponse.json({
        success: true,
        sessions: enhancedSessions,
        pagination: {
          totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (dbError) {
      console.error('[SESSIONS API] Database error:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error occurred', 
          message: dbError instanceof Error ? dbError.message : 'Unknown database error' 
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('[SESSIONS API] Error fetching sessions:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch sessions',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 