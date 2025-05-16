import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';

/**
 * GET /api/user/sessions
 * List all booth sessions for the current user with optional filtering
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
    
    // Get query parameters for pagination and filtering
    const { searchParams } = request.nextUrl;
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');
    const mediaType = searchParams.get('mediaType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const eventUrlId = searchParams.get('eventUrlId');
    
    const skip = (page - 1) * limit;
    
    // Build the where clause
    let whereClause = `userId = ${user.id}`;
    const whereParams: any[] = [];
    
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
    
    const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(
      countQuery, 
      ...whereParams
    );
    
    const totalCount = countResult[0]?.count || 0;
    
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
    
    return NextResponse.json({
      success: true,
      sessions: sessions || [],
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching sessions:', error);
    
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