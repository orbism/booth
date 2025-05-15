import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// Validation schema for email
const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Generate a verification token and set expiry (24 hours from now)
function generateVerificationToken() {
  return {
    token: uuidv4(),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate input
    const result = resendSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation failed", 
          issues: result.error.issues 
        },
        { status: 400 }
      );
    }
    
    const { email } = result.data;
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: "Email is already verified" },
        { status: 400 }
      );
    }
    
    // Generate new verification token
    const { token: verificationToken, expires: verificationTokenExpires } = generateVerificationToken();
    
    // Update user with new verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpires,
      } as any // Using type assertion to handle schema mismatch
    });
    
    // Prepare verification URL
    const verificationUrl = `${request.nextUrl.origin}/verify-email?token=${verificationToken}`;
    
    // Send verification email
    await sendEmail({
      to: email,
      subject: "Verify your BoothBuddy account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify your BoothBuddy Account</h2>
          <p>Hi ${user.name || 'there'},</p>
          <p>A verification email has been requested for your account. Please verify your email address by clicking the button below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #3B82F6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not request this verification email, please ignore it.</p>
          <p>Best regards,<br>The BoothBuddy Team</p>
        </div>
      `,
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: "Verification email has been sent"
    });
    
  } catch (error) {
    console.error("Resend verification error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "An error occurred while resending verification email",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 