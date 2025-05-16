import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { isSystemAdmin, isSettingsAdmin } from '@/types/user';
import bcrypt from 'bcryptjs';

/**
 * Check if the current user has admin privileges
 */
async function checkAdminAccess() {
  try {
    const session = await getServerSession();
    
    // No session or user means not authorized
    if (!session || !session.user) {
      console.log("Admin check failed: No session or user");
      return false;
    }
    
    // Check for ADMIN role directly - this is the preferred method
    if (session.user.role === 'ADMIN') {
      console.log("Admin check passed: User has ADMIN role");
      return true;
    }
    
    // Fallback check: system admin from env
    if (session.user.email && isSystemAdmin({ email: session.user.email })) {
      console.log("Admin check passed: User is system admin from env");
      return true;
    }
    
    // Fallback check: admin from settings
    const settings = await prisma.settings.findFirst();
    if (settings && session.user.email && isSettingsAdmin(session.user.email, settings.adminEmail)) {
      console.log("Admin check passed: User is admin from settings");
      return true;
    }
    
    console.log(`Admin check failed: User ${session.user.email} does not have admin privileges`);
    return false;
  } catch (error) {
    console.error("Error checking admin access:", error);
    return false;
  }
}

/**
 * GET handler - List all users with pagination and search
 */
export async function GET(req: NextRequest) {
  try {
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Use raw SQL to get users with their roles
    let users;
    if (search) {
      // With search condition
      users = await prisma.$queryRaw`
        SELECT id, name, email, image, createdAt, role 
        FROM User 
        WHERE name LIKE ${'%' + search + '%'} OR email LIKE ${'%' + search + '%'}
        ORDER BY createdAt DESC
        LIMIT ${limit} OFFSET ${skip}
      `;
    } else {
      // Without search condition
      users = await prisma.$queryRaw`
        SELECT id, name, email, image, createdAt, role 
        FROM User 
        ORDER BY createdAt DESC
        LIMIT ${limit} OFFSET ${skip}
      `;
    }
    
    // Get total count for pagination
    let total;
    if (search) {
      const countResult = await prisma.$queryRaw`
        SELECT COUNT(*) as total FROM User
        WHERE name LIKE ${'%' + search + '%'} OR email LIKE ${'%' + search + '%'}
      `;
      total = Number((countResult as any)[0].total);
    } else {
      const countResult = await prisma.$queryRaw`
        SELECT COUNT(*) as total FROM User
      `;
      total = Number((countResult as any)[0].total);
    }
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Create a new user
 */
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const body = await req.json();
    const { name, email, password, role = 'CUSTOMER' } = body; // Default to CUSTOMER role if not provided
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUserQuery = await prisma.$queryRaw`
      SELECT id FROM User WHERE email = ${email}
    `;
    
    const existingUser = Array.isArray(existingUserQuery) && existingUserQuery.length > 0;
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create the user with raw query to avoid type issues
    const insertResult = await prisma.$executeRaw`
      INSERT INTO User (id, name, email, password, role, createdAt, updatedAt)
      VALUES (
        CONCAT('clm', SUBSTR(MD5(RAND()), 1, 21)), 
        ${name || null}, 
        ${email}, 
        ${hashedPassword}, 
        ${role}, 
        NOW(), 
        NOW()
      )
    `;
    
    if (insertResult !== 1) {
      throw new Error('Failed to create user');
    }
    
    // Get the created user
    const newUserResult = await prisma.$queryRaw`
      SELECT id, name, email, image, createdAt, role
      FROM User
      WHERE email = ${email}
      ORDER BY createdAt DESC
      LIMIT 1
    `;
    
    const user = Array.isArray(newUserResult) && newUserResult.length > 0 
      ? newUserResult[0] 
      : null;
    
    if (!user) {
      throw new Error('User created but not found');
    }
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 