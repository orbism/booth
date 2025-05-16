import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';

/**
 * GET /api/auth/get-username
 * 
 * Returns the username for a given email address.
 * This is primarily used for debugging and internal redirects.
 * 
 * Query parameters:
 * - email: The email address to look up
 */
export async function GET(request: NextRequest) {
  try {
    // First check if the user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the email from the query string
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Additional security check: only allow looking up your own email unless you're an admin
    const isAdmin = session.user.role === 'ADMIN';
    if (!isAdmin && email !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the username from the database
    const user = await prisma.$queryRaw`
      SELECT username FROM User WHERE email = ${email}
    `;

    // Result from raw query is an array
    const username = Array.isArray(user) && user.length > 0 
      ? user[0].username 
      : null;

    return NextResponse.json({ username });
  } catch (error) {
    console.error('Error getting username by email:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 