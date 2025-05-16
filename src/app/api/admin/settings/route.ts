// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { handleApiError, unauthorizedResponse } from '@/lib/errors';
import { z } from 'zod';

// Helper function to safely parse journey config
function safelyParseJourneyConfig(journeyConfig: any): any[] {
  if (!journeyConfig) return [];
  
  try {
    // If it's already an array, return it
    if (Array.isArray(journeyConfig)) return journeyConfig;
    
    // If it's a string, try to parse it
    if (typeof journeyConfig === 'string') {
      return JSON.parse(journeyConfig);
    }
    
    // Otherwise convert to string and parse
    return JSON.parse(JSON.stringify(journeyConfig));
  } catch (error) {
    console.error('Error parsing journey config:', error);
    return [];
  }
}

// Define validation schema for settings
const settingsSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  adminEmail: z.string().email("Invalid email address"),
  countdownTime: z.number().int().min(1).max(10),
  resetTime: z.number().int().min(10).max(300),
  emailSubject: z.string().min(1, "Email subject is required"),
  emailTemplate: z.string().min(1, "Email template is required"),
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.number().int().min(1).max(65535),
  smtpUser: z.string().min(1, "SMTP username is required"),
  smtpPassword: z.string().min(1, "SMTP password is required"),
  companyName: z.string().min(1, "Company name is required"),
  companyLogo: z.string().optional().nullable(),
  primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color"),
  secondaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color"),
  theme: z.enum(["midnight", "pastel", "bw", "custom"]).default("custom"),
  backgroundColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional(),
  borderColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional(),
  buttonColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional(),
  textColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional(),
  notes: z.string().optional().nullable(),
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

// Create default settings for a user if they don't exist
async function ensureUserSettings(userId: string): Promise<string> {
  // Check if user already has settings
  const existingSettings = await prisma.settings.findUnique({
    where: { userId },
    select: { id: true }
  });
  
  if (existingSettings) {
    return existingSettings.id;
  }
  
  // Get user details for setting up the settings
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Create default settings for the user
  const defaultSettings = await prisma.settings.create({
    data: {
      userId,
      adminEmail: user.email,
      // Add defaults for required fields
      eventName: 'My Event',
      countdownTime: 3,
      resetTime: 30,
      emailSubject: 'Your Booth Photo/Video',
      emailTemplate: 'Thank you for participating!',
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      companyName: 'My Company',
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
    }
  });
  
  return defaultSettings.id;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return unauthorizedResponse();
    }
    
    const isAdmin = session.user.role === 'ADMIN';
    let where: any = {};
    
    // If not admin, filter settings by user ID
    if (!isAdmin) {
      const userId = session.user.id;
      if (!userId) {
        return unauthorizedResponse();
      }
      
      where = { userId };
      console.log(`Getting settings for user ${userId}`);
    } else {
      console.log('Admin user, getting global settings');
    }
    
    // Get settings that match the filter
    const settings = await prisma.settings.findFirst({ where });
    
    // If settings don't exist, create default settings for the user (if not admin)
    if (!settings && !isAdmin) {
      const userId = session.user.id;
      if (!userId) {
        return unauthorizedResponse();
      }
      
      try {
        const settingsId = await ensureUserSettings(userId);
        console.log(`Created default settings for user ${userId} with ID ${settingsId}`);
        
        // Fetch the newly created settings
        const newSettings = await prisma.settings.findFirst({ 
          where: { id: settingsId } 
        });
        
        if (newSettings) {
          // Return the new settings with default journeyPages
          return NextResponse.json({
            ...newSettings,
            customJourneyEnabled: newSettings.customJourneyEnabled || false,
            activeJourneyId: newSettings.activeJourneyId || null,
            journeyPages: []
          });
        }
      } catch (createError) {
        console.error('Error creating default settings:', createError);
      }
    }
    
    // If we still don't have settings
    if (!settings) {
      return NextResponse.json({ 
        error: 'Settings not found' 
      }, { 
        status: 404 
      });
    }

    // Safely parse journey config regardless of its type
    const journeyPages = safelyParseJourneyConfig(settings.journeyConfig);
    
    return NextResponse.json({
      ...settings,
      customJourneyEnabled: settings.customJourneyEnabled || false,
      activeJourneyId: settings.activeJourneyId || null,
      journeyPages,
      // Include debug info
      _meta: {
        isAdmin,
        userId: session.user.id,
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return handleApiError(error, 'Failed to fetch settings');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return unauthorizedResponse();
    }
    
    const isAdmin = session.user.role === 'ADMIN';
    let where: any = {};
    
    // If not admin, filter settings by user ID
    if (!isAdmin) {
      const userId = session.user.id;
      if (!userId) {
        return unauthorizedResponse();
      }
      
      where = { userId };
    }
    
    const data = await request.json();
    
    // Validate settings data
    const validatedData = settingsSchema.parse(data);
    
    // Find existing settings that the user has access to
    const existingSettings = await prisma.settings.findFirst({ where });
    
    if (!existingSettings) {
      // If settings don't exist and user is not admin, create them
      if (!isAdmin) {
        const userId = session.user.id;
        if (!userId) {
          return unauthorizedResponse();
        }
        
        try {
          const settingsId = await ensureUserSettings(userId);
          console.log(`Created default settings for user ${userId} with ID ${settingsId}`);
        } catch (error) {
          console.error('Error creating settings:', error);
          return NextResponse.json({ 
            error: 'Failed to create settings' 
          }, { 
            status: 500 
          });
        }
      } else {
        return NextResponse.json({ 
          error: 'Settings not found' 
        }, { 
          status: 404 
        });
      }
    }
    
    // Get settings ID to update (either existing or newly created)
    const settingsToUpdate = existingSettings || 
      await prisma.settings.findFirst({ where });
    
    if (!settingsToUpdate) {
      return NextResponse.json({ 
        error: 'Failed to locate or create settings' 
      }, { 
        status: 500 
      });
    }
    
    // Ensure journeyConfig is properly serialized as JSON string before saving
    const journeyConfig = validatedData.journeyPages?.length 
      ? JSON.stringify(validatedData.journeyPages)  // Explicitly stringify to ensure it's a JSON string
      : null;
    
    // Make sure adminEmail is set
    const adminEmail = validatedData.adminEmail || session.user.email;
    if (!adminEmail) {
      return NextResponse.json({ 
        error: 'Admin email is required' 
      }, { 
        status: 400 
      });
    }
    
    // Update settings
    const updatedSettings = await prisma.settings.update({
      where: {
        id: settingsToUpdate.id
      },
      data: {
        eventName: validatedData.eventName,
        adminEmail: adminEmail,
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
    
    // Return processed settings with parsed journeyPages for consistent API response
    const processedSettings = {
      ...updatedSettings,
      journeyPages: safelyParseJourneyConfig(updatedSettings.journeyConfig)
    };
    
    return NextResponse.json(processedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return handleApiError(error, 'Failed to update settings');
  }
}