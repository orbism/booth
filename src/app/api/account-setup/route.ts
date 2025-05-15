import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Setup validation schema
const setupSchema = z.object({
  customUrl: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .max(30, "URL cannot exceed 30 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens are allowed"),
  eventName: z.string().min(2, "Event name is required"),
  companyName: z.string().min(2, "Company name is required"),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color"),
  logoUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get form data from request
    const body = await request.json();
    
    // Validate input
    const result = setupSchema.safeParse(body);
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
    
    const { customUrl, eventName, companyName, primaryColor, logoUrl } = result.data;
    
    // Check if URL is already in use
    const existingUrl = await prisma.eventUrl.findUnique({
      where: { urlPath: customUrl.toLowerCase() }
    });
    
    if (existingUrl) {
      return NextResponse.json(
        { success: false, error: 'This URL is already taken' },
        { status: 400 }
      );
    }
    
    // Start a transaction to update multiple tables
    const userId = session.user.id;
    
    // Create the event URL
    const eventUrl = await prisma.eventUrl.create({
      data: {
        userId,
        urlPath: customUrl.toLowerCase(),
        eventName,
        isActive: true,
      }
    });
    
    // Create or update settings with branding information
    const settings = await prisma.settings.upsert({
      where: { userId },
      update: {
        companyName,
        primaryColor,
        companyLogo: logoUrl || null,
      },
      create: {
        userId,
        adminEmail: session.user.email as string,
        companyName,
        primaryColor,
        companyLogo: logoUrl || null,
        smtpHost: '',  // These will be set up later
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
      }
    });
    
    // Mark user as having completed onboarding
    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
      }
    });
    
    // Return success with created resources
    return NextResponse.json({
      success: true,
      eventUrl,
      settings,
    });
    
  } catch (error) {
    console.error('Error in account setup:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to complete account setup',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 