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
    
    // Get role directly from the session if available
    const roleFromSession = session.user.role;
    const isAdminFromSession = roleFromSession === 'ADMIN';
    
    console.log('User API - Session role:', roleFromSession);
    
    // Fetch user data - use raw query to get around TypeScript issues
    const users = await prisma.$queryRaw`
      SELECT id, name, email, emailVerified, username, organizationName, role
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
    
    const userRole = user.role || roleFromSession;
    const isAdmin = userRole === 'ADMIN';
    
    console.log('User API - Database role:', user.role);
    console.log('User API - Final role used:', userRole);
    
    // Return user data with role information
    return NextResponse.json({
      isAuthenticated: true,
      isAdmin,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        organizationName: user.organizationName,
        role: userRole,
        isAdmin
      }
    });
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch user data',
        message: error instanceof Error ? error.message : 'Unknown error',
        isAuthenticated: false
      },
      { status: 500 }
    );
  }
} 