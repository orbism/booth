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
 * GET handler - Get a specific user's details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = params.id;
    
    // Get the user with raw SQL
    const userResults = await prisma.$queryRaw`
      SELECT id, name, email, image, createdAt, role
      FROM User
      WHERE id = ${userId}
    `;
    
    if (!Array.isArray(userResults) || userResults.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = userResults[0];
    
    // Get user sessions
    const sessions = await prisma.$queryRaw`
      SELECT id, expires
      FROM Session
      WHERE userId = ${userId}
      ORDER BY expires DESC
    `;
    
    // Get booth sessions
    const boothSessions = await prisma.$queryRaw`
      SELECT id, photoPath, createdAt, emailSent, mediaType, filter
      FROM BoothSession
      WHERE userId = ${userId}
      ORDER BY createdAt DESC
    `;
    
    // Combine data
    const userWithSessions = {
      ...user,
      sessions: sessions || [],
      boothSessions: boothSessions || []
    };

    return NextResponse.json(userWithSessions);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler - Update a user's details
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = params.id;
    const body = await req.json();
    const { name, email, password, role } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 400 }
        );
      }
    }

    // Check if role field exists in the schema
    const hasRoleField = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'User' AND COLUMN_NAME = 'role'
    `.then((result: any) => result[0].count > 0);

    // Prepare update data
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    
    // Only update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }
    
    // Only update role if the field exists and it was provided
    if (hasRoleField && role !== undefined) {
      updateData.role = role;
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler - Delete a user
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = params.id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the current session
    const session = await getServerSession();
    
    // Prevent admins from deleting themselves
    if (session?.user?.email === user.email) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 