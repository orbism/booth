// src/app/api/admin/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { handleApiError, forbiddenResponse } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const adminEmail = process.env.ADMIN_EMAIL;
    
    // Verify this is the admin email
    if (!adminEmail) {
      return NextResponse.json({
        error: 'Admin email not configured in environment variables'
      }, {
        status: 500
      });
    }

    if (email !== adminEmail) {
      return forbiddenResponse('Unauthorized: Not the admin email');
    }
    
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: {
        email: adminEmail,
      },
    });
    
    if (!adminUser) {
      // Create admin if it doesn't exist
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: process.env.ADMIN_NAME || 'Admin User',
          password: hashedPassword,
        },
      });
      
      return NextResponse.json({ success: true });
    }
    
    // Update existing admin with password
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: {
        email: adminEmail,
      },
      data: {
        password: hashedPassword,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting up admin:', error);
    return handleApiError(error, 'Failed to set up admin account');
  }
}