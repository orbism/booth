import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { isSystemAdmin, isSettingsAdmin } from '@/types/user';
import bcrypt from 'bcryptjs';

/**
 * Check if the current user has admin privileges
 */
async function checkAdminAccess() {
  const session = await getServerSession();
  
  if (!session || !session.user || !session.user.email) {
    return false;
  }
  
  // Check if user is the system admin (from env)
  // Make sure the user has an email property
  if (session.user && session.user.email && isSystemAdmin({ email: session.user.email })) {
    return true;
  }
  
  // Check if the user is the admin from settings
  const settings = await prisma.settings.findFirst();
  if (settings && isSettingsAdmin(session.user.email, settings.adminEmail)) {
    return true;
  }
  
  return false;
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
    
    // Build the query
    const where = search 
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        } 
      : {};
    
    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        // Only select role if it exists in the schema
        ...(await prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'User' AND COLUMN_NAME = 'role'
        `.then((result: any) => result[0].count > 0 ? { role: true } : {}))
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });
    
    // Get total count for pagination
    const total = await prisma.user.count({ where });
    
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
    const { name, email, password, role } = body;
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create the user
    // Check if role field exists in the schema
    const hasRoleField = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'User' AND COLUMN_NAME = 'role'
    `.then((result: any) => result[0].count > 0);
    
    const userData: any = {
      name,
      email,
      password: hashedPassword,
    };
    
    // Add role if the field exists
    if (hasRoleField && role) {
      userData.role = role;
    }
    
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        // Only select role if it exists in the schema
        ...(hasRoleField ? { role: true } : {})
      },
    });
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 