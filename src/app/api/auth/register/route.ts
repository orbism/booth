import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcryptjs from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';
import { generateWelcomeEmail } from '@/lib/email-templates/welcome';
import { SubscriptionTier, SubscriptionDuration } from '@/lib/subscription-features';

// Validation schema for registration
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  organizationName: z.string().min(2, "Organization name is required").optional(),
  organizationSize: z.string().optional(),
  industry: z.string().optional(),
});

type RegisterInput = z.infer<typeof registerSchema>;

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
    const result = registerSchema.safeParse(body);
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
    
    const { name, email, password, organizationName, organizationSize, industry } = result.data;
    
    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    // Generate username from email (before @ symbol)
    const baseUsername = email.split('@')[0];
    let username = baseUsername;
    
    // Check if username exists and generate a unique one if needed
    let usernameExists = await prisma.user.findUnique({ where: { username } });
    let counter = 1;
    
    while (usernameExists) {
      username = `${baseUsername}${counter}`;
      usernameExists = await prisma.user.findUnique({ where: { username } });
      counter++;
    }
    
    // Generate verification token
    const { token: verificationToken, expires: verificationTokenExpires } = generateVerificationToken();
    
    // Hash the password
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    // Create the user with verification token
    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        password: hashedPassword,
        organizationName,
        organizationSize,
        industry,
        verificationToken,
        verificationTokenExpires,
      }
    });
    
    // Calculate trial end date (1 day from now)
    const trialEndDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    
    // Create a free trial subscription for the user
    await prisma.subscription.create({
      data: {
        userId: user.id,
        tier: SubscriptionTier.FREE as any,
        duration: SubscriptionDuration.TRIAL as any,
        status: 'TRIAL',
        startDate: new Date(),
        endDate: trialEndDate,
        trialEndDate,
        maxMedia: 5,
        maxEmails: 5,
        maxVideoDuration: 10,
        maxDays: 1,
        videoAccess: true,
      }
    });
    
    // Prepare verification URL
    const verificationUrl = `${request.nextUrl.origin}/verify-email?token=${verificationToken}`;
    
    // Send verification email
    await sendEmail({
      to: email,
      subject: "Verify your BoothBuddy account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to BoothBuddy!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #3B82F6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account, please ignore this email.</p>
          <p>Best regards,<br>The BoothBuddy Team</p>
        </div>
      `,
    });
    
    // Send welcome email with trial information
    await sendEmail({
      to: email,
      subject: "Welcome to BoothBuddy - Get Started with Your Photo Booth",
      html: generateWelcomeEmail({
        name,
        loginUrl: `${request.nextUrl.origin}/login`,
        dashboardUrl: `${request.nextUrl.origin}/admin/dashboard`,
        trialEndDate,
      }),
    });
    
    // Return success without exposing sensitive user data
    return NextResponse.json({
      success: true,
      message: "Registration successful. Please check your email to verify your account.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });
    
  } catch (error) {
    console.error("Registration error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "An error occurred during registration",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 