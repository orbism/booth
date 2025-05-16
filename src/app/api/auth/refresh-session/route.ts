import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          isAuthenticated: false
        },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Fetch the actual role from the database using raw query to avoid TypeScript issues
    const users = await prisma.$queryRaw`
      SELECT id, role
      FROM User
      WHERE id = ${userId}
    `;
    
    // Raw query returns an array
    const user = Array.isArray(users) && users.length > 0 ? users[0] : null;
    
    if (!user) {
      return NextResponse.json(
        { 
          error: 'User not found',
          isAuthenticated: true
        },
        { status: 404 }
      );
    }
    
    // Return role information
    return NextResponse.json({
      message: 'Session refresh data',
      currentSession: {
        role: session.user.role
      },
      databaseValue: {
        role: user.role
      },
      instructions: "The session shows a cached role. You need to sign out and sign back in to refresh the session token with the updated role from the database."
    });
    
  } catch (error) {
    console.error('Error refreshing session data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to refresh session data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 