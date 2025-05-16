import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Define validation schema for settings updates
const settingsSchema = z.object({
  eventName: z.string().min(1).max(100).optional(),
  countdownTime: z.number().int().min(1).max(10).optional(),
  resetTime: z.number().int().min(1).max(60).optional(),
  emailSubject: z.string().max(200).optional(),
  emailTemplate: z.string().optional(),
  companyName: z.string().max(100).optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  theme: z.enum(['light', 'dark', 'custom']).optional(),
  splashPageEnabled: z.boolean().optional(),
  splashPageTitle: z.string().max(100).optional(),
  splashPageContent: z.string().optional(),
  splashPageButtonText: z.string().max(50).optional(),
  captureMode: z.enum(['photo', 'video', 'both']).optional(),
  showBoothBossLogo: z.boolean().optional(),
  filtersEnabled: z.boolean().optional(),
  enabledFilters: z.string().optional(),
  adminEmail: z.string().email().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  
  // Custom Journey fields
  customJourneyEnabled: z.boolean().optional(),
  journeyConfig: z.any().optional(),
  activeJourneyId: z.string().optional(),
  
  // Capture Mode fields
  photoDevice: z.string().optional(),
  photoOrientation: z.string().optional(),
  photoResolution: z.string().optional(),
  aiImageCorrection: z.boolean().optional(),
  printerEnabled: z.boolean().optional(),
  photoEffect: z.string().optional(),
  
  // Video mode settings
  videoDevice: z.string().optional(),
  videoDuration: z.number().int().min(5).max(60).optional(),
  videoOrientation: z.string().optional(),
  videoResolution: z.string().optional(),
  videoEffect: z.string().optional(),
  
  // Storage Settings
  storageProvider: z.string().optional(),
  blobVercelEnabled: z.boolean().optional(),
  localUploadPath: z.string().optional(),
  storageBaseUrl: z.string().optional(),
});

/**
 * GET /api/user/settings
 * Get booth settings for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get user settings
    let settings = await prisma.settings.findFirst({
      where: { userId: user.id },
    });
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId: user.id,
          eventName: 'My Event',
          countdownTime: 3,
          resetTime: 15,
          emailSubject: 'Your Photos from {{eventName}}',
          emailTemplate: 'Hello {{userName}},\n\nThank you for using our photo booth at {{eventName}}!\n\nYou can view and download your photos here: {{photoUrl}}\n\nBest regards,\nBooth Boss Team',
          companyName: user.name || 'My Company',
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          backgroundColor: '#FFFFFF',
          theme: 'light',
          splashPageEnabled: true,
          splashPageTitle: 'Welcome to Our Photo Booth!',
          splashPageContent: 'Capture your memories from this special event.',
          splashPageButtonText: 'Start Taking Photos',
          captureMode: 'photo',
          showBoothBossLogo: true,
          filtersEnabled: true,
          enabledFilters: 'grayscale,sepia,vintage',
          adminEmail: session.user.email,
          isDefault: true,
          smtpHost: '',
          smtpPort: 587,
          smtpUser: '',
          smtpPassword: '',
          
          // Set defaults for new fields
          customJourneyEnabled: false,
          photoDevice: 'ipad',
          photoOrientation: 'portrait-standard',
          photoResolution: 'medium',
          aiImageCorrection: false,
          printerEnabled: false,
          photoEffect: 'none',
          videoDevice: 'ipad',
          videoDuration: 10,
          videoOrientation: 'portrait-standard',
          videoResolution: 'medium',
          videoEffect: 'none',
          storageProvider: 'auto',
          blobVercelEnabled: true,
          localUploadPath: 'uploads',
        },
      });
    }
    
    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/settings
 * Update booth settings for the current user
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = settingsSchema.parse(body);
    
    // Ensure adminEmail is present if being updated
    if (validatedData.adminEmail === undefined) {
      validatedData.adminEmail = session.user.email;
    }
    
    // Get existing settings
    const existingSettings = await prisma.settings.findFirst({
      where: { userId: user.id },
    });
    
    let settings;
    
    // If settings exist, update them; otherwise, create new settings
    if (existingSettings) {
      settings = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: validatedData,
      });
    } else {
      // Create default settings with the provided values
      const defaultSettings = {
        userId: user.id,
        eventName: validatedData.eventName || 'My Event',
        countdownTime: validatedData.countdownTime || 3,
        resetTime: validatedData.resetTime || 15,
        emailSubject: validatedData.emailSubject || 'Your Photos from {{eventName}}',
        emailTemplate: validatedData.emailTemplate || 'Hello {{userName}},\n\nThank you for using our photo booth at {{eventName}}!\n\nYou can view and download your photos here: {{photoUrl}}\n\nBest regards,\nBooth Boss Team',
        companyName: validatedData.companyName || user.name || 'My Company',
        primaryColor: validatedData.primaryColor || '#3B82F6',
        secondaryColor: validatedData.secondaryColor || '#1E40AF',
        backgroundColor: validatedData.backgroundColor || '#FFFFFF',
        theme: validatedData.theme || 'light',
        splashPageEnabled: validatedData.splashPageEnabled ?? true,
        splashPageTitle: validatedData.splashPageTitle || 'Welcome to Our Photo Booth!',
        splashPageContent: validatedData.splashPageContent || 'Capture your memories from this special event.',
        splashPageButtonText: validatedData.splashPageButtonText || 'Start Taking Photos',
        captureMode: validatedData.captureMode || 'photo',
        showBoothBossLogo: validatedData.showBoothBossLogo ?? true,
        filtersEnabled: validatedData.filtersEnabled ?? true,
        enabledFilters: validatedData.enabledFilters || 'grayscale,sepia,vintage',
        adminEmail: validatedData.adminEmail || session.user.email,
        isDefault: true,
        smtpHost: validatedData.smtpHost || '',
        smtpPort: validatedData.smtpPort || 587,
        smtpUser: validatedData.smtpUser || '',
        smtpPassword: validatedData.smtpPassword || '',
        
        // Set defaults for new fields if not provided
        customJourneyEnabled: validatedData.customJourneyEnabled ?? false,
        photoDevice: validatedData.photoDevice || 'ipad',
        photoOrientation: validatedData.photoOrientation || 'portrait-standard',
        photoResolution: validatedData.photoResolution || 'medium',
        aiImageCorrection: validatedData.aiImageCorrection ?? false,
        printerEnabled: validatedData.printerEnabled ?? false,
        photoEffect: validatedData.photoEffect || 'none',
        videoDevice: validatedData.videoDevice || 'ipad',
        videoDuration: validatedData.videoDuration || 10,
        videoOrientation: validatedData.videoOrientation || 'portrait-standard',
        videoResolution: validatedData.videoResolution || 'medium',
        videoEffect: validatedData.videoEffect || 'none',
        storageProvider: validatedData.storageProvider || 'auto',
        blobVercelEnabled: validatedData.blobVercelEnabled ?? true,
        localUploadPath: validatedData.localUploadPath || 'uploads',
        storageBaseUrl: validatedData.storageBaseUrl,
      };

      settings = await prisma.settings.create({
        data: defaultSettings,
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully', 
      settings 
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating settings:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid settings data', 
        details: error.errors 
      }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
} 