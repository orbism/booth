// src/app/api/admin/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { handleApiError, unauthorizedResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }
    
    const { searchParams } = request.nextUrl;
    
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');
    const mediaType = searchParams.get('mediaType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const skip = (page - 1) * limit;
    
    // Build the where clause
    const where: any = {};
    
    // Only add mediaType if it exists in the schema
    // Try/catch helps handle schema mismatches gracefully
    try {
      if (mediaType) {
        // Check if the field exists in the schema first
        const schema = await prisma.$queryRaw`SHOW COLUMNS FROM BoothSession WHERE Field = 'mediaType'`;
        if (Array.isArray(schema) && schema.length > 0) {
          where.mediaType = mediaType;
        } else {
          console.warn("mediaType field not found in schema, ignoring filter");
        }
      }
    } catch (error) {
      console.warn("Error checking schema for mediaType:", error);
    }
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    // Query with filters
    const sessions = await prisma.boothSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    
    // Add mediaType property to each session if it doesn't exist
    const enhancedSessions = sessions.map((session) => {
      // Clone the session to avoid modifying the Prisma objects directly
      const enhancedSession = { ...session };
      
      if (!enhancedSession.mediaType) {
        // Simple logic to determine if it's a video by file extension
        enhancedSession.mediaType = enhancedSession.photoPath?.endsWith('.webm') || 
                           enhancedSession.photoPath?.endsWith('.mp4') ? 'video' : 'photo';
      }
      return enhancedSession;
    });
    
    const totalCount = await prisma.boothSession.count({ where });
    
    return NextResponse.json({
      sessions: enhancedSessions,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch sessions');
  }
}