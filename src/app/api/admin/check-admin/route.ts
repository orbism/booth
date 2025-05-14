import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

/**
 * API route to check if the current user has admin privileges
 * 
 * TEMPORARY IMPLEMENTATION:
 * While the database migration to add the 'role' field is pending,
 * this function uses email-based checks to determine admin status:
 * 1. Checks against ADMIN_EMAIL environment variable
 * 2. Checks against adminEmail in settings
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }
    
    // Check if user is the system admin (from env)
    const adminEmail = process.env.ADMIN_EMAIL;
    const isSystemAdmin = adminEmail && session.user.email.toLowerCase() === adminEmail.toLowerCase();
    
    if (isSystemAdmin) {
      return NextResponse.json({ 
        isAdmin: true,
        source: 'environment_variable'
      });
    }
    
    // Check database for user record
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    });
    
    if (!user) {
      return NextResponse.json({ isAdmin: false }, { status: 404 });
    }
    
    // Check if the user's email matches the admin email in settings
    const settings = await prisma.settings.findFirst();
    const isAdminFromSettings = settings?.adminEmail === user.email;
    
    // Add helpful context for debugging
    return NextResponse.json({ 
      isAdmin: isAdminFromSettings,
      source: isAdminFromSettings ? 'settings_table' : null,
      userEmail: user.email,
      settingsAdminEmail: settings?.adminEmail || null
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check admin status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 