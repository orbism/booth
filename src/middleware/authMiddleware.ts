import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

/**
 * Middleware to check if user is authenticated
 */
export async function requireAuth(req: NextRequest) {
  const session = await getServerSession();
  
  if (!session || !session.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  return NextResponse.next();
}

/**
 * Middleware to check if user is an admin
 * 
 * TEMPORARY IMPLEMENTATION:
 * While the database migration to add the 'role' field is pending,
 * this function uses email-based checks to determine admin status:
 * 1. Checks against ADMIN_EMAIL environment variable
 * 2. Checks against adminEmail in settings
 * 
 * This will be updated to use the proper role field once the database migration is applied.
 */
export async function requireAdmin(req: NextRequest) {
  const session = await getServerSession();
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // First check system admin (from env)
  const adminEmail = process.env.ADMIN_EMAIL;
  const isSystemAdmin = adminEmail && session.user.email.toLowerCase() === adminEmail.toLowerCase();
  
  if (isSystemAdmin) {
    return NextResponse.next();
  }
  
  // Then check database for admin email in settings
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    });
    
    if (!user) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // Check if the user's email matches the admin email in settings
    const settings = await prisma.settings.findFirst();
    const isAdminFromSettings = settings?.adminEmail === user.email;
    
    if (isAdminFromSettings) {
      return NextResponse.next();
    }
    
    // FUTURE IMPLEMENTATION:
    // Once the 'role' field is added to the User model, enable this code:
    /*
    if (user.role === 'ADMIN') {
      return NextResponse.next();
    }
    */
  } catch (error) {
    console.error('Error checking admin status:', error);
  }
  
  // Not an admin, redirect to home
  return NextResponse.redirect(new URL('/', req.url));
} 