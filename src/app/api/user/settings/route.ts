import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Define validation schema for settings - matching the admin schema
const settingsSchema = z.object({
  // General Settings
  eventName: z.string().min(1, "Event name is required"),
  adminEmail: z.string().email("Invalid email address"),
  countdownTime: z.coerce.number().int().min(1).max(10),
  resetTime: z.coerce.number().int().min(10).max(300),

  // Email Setup Settings
  emailSubject: z.string().min(1, "Email subject is required"),
  emailTemplate: z.string().min(1, "Email template is required"),
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.coerce.number().int().min(1).max(65535),
  smtpUser: z.string().min(1, "SMTP username is required"),
  smtpPassword: z.string().min(1, "SMTP password is required"),

  // Brand Personalization Settings
  companyName: z.string().min(1, "Company name is required"),
  companyLogo: z.string().optional().nullable(),

  // Advanced Settings
  notes: z.string().optional().nullable(),

  // Generic Theme Settings
  theme: z.enum(["midnight", "pastel", "bw", "custom"]).default("custom"),
  primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color"),
  secondaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color"),
  backgroundColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional().nullable(),
  borderColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional().nullable(),
  buttonColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional().nullable(),
  textColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional().nullable(),

  // Custom Journey Settings
  customJourneyEnabled: z.boolean().default(false),
  journeyName: z.string().optional(),
  journeyId: z.string().optional(),
  journeyPages: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      backgroundImage: z.string().nullable(),
      buttonText: z.string(),
      buttonImage: z.string().nullable()
    })
  ).optional().default([]),

  // Splash Page settings
  splashPageEnabled: z.boolean().default(false),
  splashPageTitle: z.string().optional(),
  splashPageContent: z.string().optional(),
  splashPageImage: z.string().optional().nullable(),
  splashPageButtonText: z.string().optional(),

  // Capture Mode Settings
  captureMode: z.enum(["photo", "video"]).default("photo"),

  // Photo Mode Settings
  photoOrientation: z.string().default("portrait-standard"),
  photoDevice: z.string().default("ipad"),
  photoResolution: z.string().default("medium"),
  photoEffect: z.string().default("none"),
  printerEnabled: z.boolean().default(false),
  aiImageCorrection: z.boolean().default(false),
  
  // Video Mode Settings
  videoOrientation: z.string().default("portrait-standard"),
  videoDevice: z.string().default("ipad"),
  videoResolution: z.string().default("medium"),
  videoEffect: z.string().default("none"),
  videoDuration: z.coerce.number().int().min(5).max(60).default(10),

  // Photo Filters/Effects
  filtersEnabled: z.boolean().default(false),
  enabledFilters: z.string().optional().nullable(),

  // Storage settings
  storageProvider: z.enum(["auto", "local", "vercel"]).default("auto"),
  blobVercelEnabled: z.boolean().default(true),
  localUploadPath: z.string().default("uploads"),
  storageBaseUrl: z.string().optional().nullable(),
});

// Helper function to safely parse journey config data
function safelyParseJourneyConfig(journeyConfig: any): any[] {
  // If it's already an array, return it directly
  if (Array.isArray(journeyConfig)) {
    return journeyConfig;
  }
  
  // If it's null or undefined, return empty array
  if (!journeyConfig) {
    return [];
  }
  
  // If it's a string (serialized JSON), try to parse it
  if (typeof journeyConfig === 'string') {
    try {
      return JSON.parse(journeyConfig);
    } catch (error) {
      console.error('Error parsing journeyConfig JSON:', error);
      return [];
    }
  }
  
  // If it's an object, return it in an array
  if (typeof journeyConfig === 'object') {
    return [journeyConfig];
  }
  
  // Default fallback
  return [];
}

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
    
    // Get user by email using raw query to avoid TypeScript issues
    const users = await prisma.$queryRaw`
      SELECT id, name, email FROM User WHERE email = ${session.user.email} LIMIT 1
    `;
    
    const user = Array.isArray(users) && users.length > 0 ? users[0] : null;
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get user settings using raw query
    const settingsResult = await prisma.$queryRaw`
      SELECT * FROM Settings WHERE userId = ${user.id} LIMIT 1
    `;
    
    let settings = Array.isArray(settingsResult) && settingsResult.length > 0 ? settingsResult[0] : null;
    
    if (!settings) {
      // Create default settings if not found
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
          theme: 'custom',
          splashPageEnabled: true,
          splashPageTitle: 'Welcome to Our Photo Booth!',
          splashPageContent: 'Capture your memories from this special event.',
          splashPageButtonText: 'Start Taking Photos',
          captureMode: 'photo',
          filtersEnabled: true,
          enabledFilters: 'grayscale,sepia,vintage',
          adminEmail: session.user.email,
          smtpHost: '',
          smtpPort: 587,
          smtpUser: '',
          smtpPassword: '',
          borderColor: '#E5E7EB',
          buttonColor: '#3B82F6',
          textColor: '#111827',
          customJourneyEnabled: false,
          journeyName: 'Default Journey',
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
          localUploadPath: 'uploads'
        }
      });
    }
    
    // Safely parse journey config regardless of its type
    const journeyPages = safelyParseJourneyConfig(settings.journeyConfig);
    
    // Return the settings with journeyPages directly without nesting
    return NextResponse.json({
      ...settings,
      customJourneyEnabled: settings.customJourneyEnabled || false,
      activeJourneyId: settings.activeJourneyId || null,
      journeyPages,
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    );
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
    
    // Get user by email using raw query
    const users = await prisma.$queryRaw`
      SELECT id, name, email FROM User WHERE email = ${session.user.email} LIMIT 1
    `;
    
    const user = Array.isArray(users) && users.length > 0 ? users[0] : null;
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = settingsSchema.parse(body);
    
    // Check if the user already has settings
    const existingSettings = await prisma.$queryRaw`
      SELECT id FROM Settings WHERE userId = ${user.id} LIMIT 1
    `;
    
    const settingsExists = Array.isArray(existingSettings) && existingSettings.length > 0;
    
    // Ensure journeyConfig is properly serialized as JSON string before saving
    const journeyConfig = validatedData.journeyPages?.length 
      ? JSON.stringify(validatedData.journeyPages)  // Explicitly stringify to ensure it's a JSON string
      : null;
    
    let updatedSettings;
    
    if (settingsExists) {
      // Update existing settings
      updatedSettings = await prisma.settings.update({
        where: {
          userId: user.id,
        },
        data: {
          eventName: validatedData.eventName,
          adminEmail: validatedData.adminEmail || session.user.email,
          countdownTime: validatedData.countdownTime,
          resetTime: validatedData.resetTime,
          emailSubject: validatedData.emailSubject,
          emailTemplate: validatedData.emailTemplate,
          smtpHost: validatedData.smtpHost,
          smtpPort: validatedData.smtpPort,
          smtpUser: validatedData.smtpUser,
          smtpPassword: validatedData.smtpPassword,
          companyName: validatedData.companyName,
          companyLogo: validatedData.companyLogo,
          primaryColor: validatedData.primaryColor,
          secondaryColor: validatedData.secondaryColor,
          theme: validatedData.theme,
          backgroundColor: validatedData.backgroundColor,
          borderColor: validatedData.borderColor,
          buttonColor: validatedData.buttonColor,
          textColor: validatedData.textColor,
          notes: validatedData.notes,
          customJourneyEnabled: validatedData.customJourneyEnabled,
          activeJourneyId: validatedData.journeyId || null,
          journeyConfig, // Use our explicitly stringified value
          splashPageEnabled: validatedData.splashPageEnabled,
          splashPageTitle: validatedData.splashPageTitle,
          splashPageContent: validatedData.splashPageContent,
          splashPageImage: validatedData.splashPageImage,
          splashPageButtonText: validatedData.splashPageButtonText,
          captureMode: validatedData.captureMode,
          photoOrientation: validatedData.photoOrientation,
          photoDevice: validatedData.photoDevice,
          photoResolution: validatedData.photoResolution,
          photoEffect: validatedData.photoEffect,
          printerEnabled: validatedData.printerEnabled,
          aiImageCorrection: validatedData.aiImageCorrection,
          videoOrientation: validatedData.videoOrientation,
          videoDevice: validatedData.videoDevice,
          videoResolution: validatedData.videoResolution,
          videoEffect: validatedData.videoEffect,
          videoDuration: validatedData.videoDuration,
          filtersEnabled: validatedData.filtersEnabled,
          enabledFilters: validatedData.enabledFilters,
          storageProvider: validatedData.storageProvider,
          blobVercelEnabled: validatedData.blobVercelEnabled,
          localUploadPath: validatedData.localUploadPath,
          storageBaseUrl: validatedData.storageBaseUrl,
        }
      });
    } else {
      // Create new settings
      updatedSettings = await prisma.settings.create({
        data: {
          userId: user.id,
          eventName: validatedData.eventName,
          adminEmail: validatedData.adminEmail || session.user.email,
          countdownTime: validatedData.countdownTime,
          resetTime: validatedData.resetTime,
          emailSubject: validatedData.emailSubject,
          emailTemplate: validatedData.emailTemplate,
          smtpHost: validatedData.smtpHost,
          smtpPort: validatedData.smtpPort,
          smtpUser: validatedData.smtpUser,
          smtpPassword: validatedData.smtpPassword,
          companyName: validatedData.companyName,
          companyLogo: validatedData.companyLogo,
          primaryColor: validatedData.primaryColor,
          secondaryColor: validatedData.secondaryColor,
          theme: validatedData.theme,
          backgroundColor: validatedData.backgroundColor,
          borderColor: validatedData.borderColor,
          buttonColor: validatedData.buttonColor,
          textColor: validatedData.textColor,
          notes: validatedData.notes,
          customJourneyEnabled: validatedData.customJourneyEnabled,
          activeJourneyId: validatedData.journeyId || null,
          journeyConfig, // Use our explicitly stringified value
          splashPageEnabled: validatedData.splashPageEnabled,
          splashPageTitle: validatedData.splashPageTitle,
          splashPageContent: validatedData.splashPageContent,
          splashPageImage: validatedData.splashPageImage,
          splashPageButtonText: validatedData.splashPageButtonText,
          captureMode: validatedData.captureMode,
          photoOrientation: validatedData.photoOrientation,
          photoDevice: validatedData.photoDevice,
          photoResolution: validatedData.photoResolution,
          photoEffect: validatedData.photoEffect,
          printerEnabled: validatedData.printerEnabled,
          aiImageCorrection: validatedData.aiImageCorrection,
          videoOrientation: validatedData.videoOrientation,
          videoDevice: validatedData.videoDevice,
          videoResolution: validatedData.videoResolution,
          videoEffect: validatedData.videoEffect,
          videoDuration: validatedData.videoDuration,
          filtersEnabled: validatedData.filtersEnabled,
          enabledFilters: validatedData.enabledFilters,
          storageProvider: validatedData.storageProvider,
          blobVercelEnabled: validatedData.blobVercelEnabled,
          localUploadPath: validatedData.localUploadPath,
          storageBaseUrl: validatedData.storageBaseUrl,
        }
      });
    }
    
    // Process settings to include journeyPages for client
    const processedSettings = {
      ...updatedSettings,
      journeyPages: safelyParseJourneyConfig(updatedSettings.journeyConfig)
    };
    
    // Return directly without nesting
    return NextResponse.json(processedSettings);
  } catch (error) {
    console.error('Error updating user settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
} 