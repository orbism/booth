import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user data with subscription information
    const users = await prisma.$queryRaw`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.username,
        u.role,
        u.organizationName,
        s.tier as subscriptionTier
      FROM User u
      LEFT JOIN Subscription s ON u.id = s.userId
      WHERE u.email = ${session.user.email}
      LIMIT 1
    `;
    
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = users[0];
    
    // Format the response with just the needed fields
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      organizationName: user.organizationName,
      subscriptionTier: user.subscriptionTier
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
} 