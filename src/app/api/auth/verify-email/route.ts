import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get the verification token from the URL
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Verification token is required" },
        { status: 400 }
      );
    }
    
    // Find user with this verification token
    // Using type assertion to handle schema mismatch with TypeScript
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpires: {
          gt: new Date() // Token hasn't expired yet
        }
      } as any
    });
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid or expired verification token"
        },
        { status: 400 }
      );
    }
    
    // Update user to mark email as verified and clear verification token
    // Using type assertion to handle schema mismatch with TypeScript
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpires: null
      } as any
    });
    
    // Return success response with redirection info
    return NextResponse.json({
      success: true,
      message: "Email successfully verified",
      redirectUrl: '/verify-success',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error("Email verification error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred during email verification",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 