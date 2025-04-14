// src/app/api/admin/check/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
      return NextResponse.json({ 
        needsSetup: false,
        adminEmail: null
      });
    }
    
    // Check if admin user exists
    const admin = await prisma.user.findUnique({
      where: {
        email: adminEmail,
      },
      select: {
        id: true,
        password: true,
        email: true,
      },
    });
    
    if (!admin) {
      // Create the admin user if it doesn't exist
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: process.env.ADMIN_NAME || 'Admin User',
        },
      });
      
      return NextResponse.json({
        needsSetup: true,
        adminEmail
      });
    }
    
    // Admin exists but has no password
    if (!admin.password) {
      return NextResponse.json({
        needsSetup: true,
        adminEmail
      });
    }
    
    // Admin exists and has password
    return NextResponse.json({
      needsSetup: false,
      adminEmail: null
    });
  } catch (error) {
    console.error('Error checking admin setup:', error);
    return NextResponse.json({ 
      error: 'Failed to check admin status'
    }, { 
      status: 500 
    });
  }
}