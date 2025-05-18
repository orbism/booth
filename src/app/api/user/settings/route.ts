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
  customJourneyEnabled: z.coerce.boolean().default(false),
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
  splashPageEnabled: z.coerce.boolean().default(false),
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
  printerEnabled: z.coerce.boolean().default(false),
  aiImageCorrection: z.coerce.boolean().default(false),
  
  // Video Mode Settings
  videoOrientation: z.string().default("portrait-standard"),
  videoDevice: z.string().default("ipad"),
  videoResolution: z.string().default("medium"),
  videoEffect: z.string().default("none"),
  videoDuration: z.coerce.number().int().min(5).max(60).default(10),

  // Photo Filters/Effects
  filtersEnabled: z.coerce.boolean().default(false),
  enabledFilters: z.string().optional().nullable(),

  // Storage settings
  storageProvider: z.enum(["auto", "local", "vercel"]).default("auto"),
  blobVercelEnabled: z.coerce.boolean().default(true),
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
 * Fetch user by username or email
 * If a username parameter is provided, it will be used to look up the user
 * If no username is provided, the session user will be used
 */
async function getUserForSettings(session: any, usernameParam?: string | null) {
  // If username is provided in query params and user is an admin, look up that user
  if (usernameParam && (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN')) {
    console.log(`Admin user looking up settings for username: ${usernameParam}`);
    
    // Look up user by username or email (could be either)
    const users = await prisma.$queryRaw`
      SELECT id, name, email, username FROM User 
      WHERE username = ${usernameParam} OR email = ${usernameParam}
      LIMIT 1
    `;
    
    const user = Array.isArray(users) && users.length > 0 ? users[0] : null;
    
    if (!user) {
      console.log(`User with username/email ${usernameParam} not found`);
      return null;
    }
    
    return user;
  }
  
  // Regular case: get the current user by session email
  console.log(`Regular user lookup by session email: ${session?.user?.email}`);
  const users = await prisma.$queryRaw`
    SELECT id, name, email, username FROM User 
    WHERE email = ${session.user.email}
    LIMIT 1
  `;
  
  return Array.isArray(users) && users.length > 0 ? users[0] : null;
}

/**
 * GET /api/user/settings
 * Get booth settings for the current user or a specific user if admin
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get username from query params if provided
    const url = new URL(request.url);
    const usernameParam = url.searchParams.get('username');
    
    // Get the user - either by username param (if admin) or by session email
    const user = await getUserForSettings(session, usernameParam);
    
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
 * Update booth settings for the current user or a specific user if admin
 */
export async function PATCH(request: NextRequest) {
  try {
    console.log('Processing PATCH request to /api/user/settings');
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.email) {
      console.log('Unauthorized: No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`Authenticated user: ${session.user.email}`);
    
    // Get username from query params if provided
    const url = new URL(request.url);
    const usernameParam = url.searchParams.get('username');
    
    // Get the user - either by username param (if admin) or by session email
    const user = await getUserForSettings(session, usernameParam);
    
    if (!user) {
      console.log('User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
      console.log('Request data parsed successfully');
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    
    // Validate settings data
    let validatedData;
    try {
      // Special handling for journeyPages, moving them from the journeyPages property to journeyConfig
      const { journeyPages, ...otherData } = requestData;
      // Convert journeyPages to a string for storage if it exists
      const journeyConfig = journeyPages ? JSON.stringify(journeyPages) : null;
      
      // Validate with zod schema
      validatedData = settingsSchema.parse({
        ...otherData,
        journeyPages: journeyPages || [],
      });
      
      // Update with the parsed journeyConfig
      validatedData.journeyConfig = journeyConfig;
      
      console.log('Settings data validated successfully');
    } catch (error) {
      console.error('Validation error:', error);
      return NextResponse.json(
        { error: 'Invalid settings data', details: error },
        { status: 400 }
      );
    }
    
    // Check if settings exist for this user
    const existingSettings = await prisma.$queryRaw`
      SELECT id FROM Settings WHERE userId = ${user.id} LIMIT 1
    `;
    
    const settingsExist = Array.isArray(existingSettings) && existingSettings.length > 0;
    
    // Convert validated data to the format needed for the database
    const {
      journeyPages, // Remove journeyPages from the data as it's now in journeyConfig
      ...settingsData
    } = validatedData;
    
    // Update or create settings
    let updatedSettings;
    
    try {
      if (settingsExist) {
        // Update existing settings
        await prisma.$executeRaw`
          UPDATE Settings
          SET 
            eventName = ${settingsData.eventName},
            adminEmail = ${settingsData.adminEmail},
            countdownTime = ${settingsData.countdownTime},
            resetTime = ${settingsData.resetTime},
            emailSubject = ${settingsData.emailSubject},
            emailTemplate = ${settingsData.emailTemplate},
            smtpHost = ${settingsData.smtpHost},
            smtpPort = ${settingsData.smtpPort},
            smtpUser = ${settingsData.smtpUser},
            smtpPassword = ${settingsData.smtpPassword},
            companyName = ${settingsData.companyName},
            companyLogo = ${settingsData.companyLogo},
            notes = ${settingsData.notes},
            theme = ${settingsData.theme},
            primaryColor = ${settingsData.primaryColor},
            secondaryColor = ${settingsData.secondaryColor},
            backgroundColor = ${settingsData.backgroundColor},
            borderColor = ${settingsData.borderColor},
            buttonColor = ${settingsData.buttonColor},
            textColor = ${settingsData.textColor},
            customJourneyEnabled = ${settingsData.customJourneyEnabled},
            journeyName = ${settingsData.journeyName},
            journeyConfig = ${settingsData.journeyConfig},
            splashPageEnabled = ${settingsData.splashPageEnabled},
            splashPageTitle = ${settingsData.splashPageTitle},
            splashPageContent = ${settingsData.splashPageContent},
            splashPageImage = ${settingsData.splashPageImage},
            splashPageButtonText = ${settingsData.splashPageButtonText},
            captureMode = ${settingsData.captureMode},
            photoOrientation = ${settingsData.photoOrientation},
            photoDevice = ${settingsData.photoDevice},
            photoResolution = ${settingsData.photoResolution},
            photoEffect = ${settingsData.photoEffect},
            printerEnabled = ${settingsData.printerEnabled},
            aiImageCorrection = ${settingsData.aiImageCorrection},
            videoOrientation = ${settingsData.videoOrientation},
            videoDevice = ${settingsData.videoDevice},
            videoResolution = ${settingsData.videoResolution},
            videoEffect = ${settingsData.videoEffect},
            videoDuration = ${settingsData.videoDuration},
            filtersEnabled = ${settingsData.filtersEnabled},
            enabledFilters = ${settingsData.enabledFilters},
            storageProvider = ${settingsData.storageProvider},
            blobVercelEnabled = ${settingsData.blobVercelEnabled},
            localUploadPath = ${settingsData.localUploadPath},
            storageBaseUrl = ${settingsData.storageBaseUrl},
            updatedAt = CURRENT_TIMESTAMP
          WHERE userId = ${user.id}
        `;
        
        // Fetch the updated settings
        const updatedSettingsResult = await prisma.$queryRaw`
          SELECT * FROM Settings WHERE userId = ${user.id} LIMIT 1
        `;
        
        updatedSettings = Array.isArray(updatedSettingsResult) && updatedSettingsResult.length > 0 
          ? updatedSettingsResult[0] 
          : null;
        
        console.log('Settings updated successfully');
      } else {
        // Create new settings if they don't exist
        updatedSettings = await prisma.settings.create({
          data: {
            userId: user.id,
            ...settingsData
          }
        });
        
        console.log('Settings created successfully');
      }
      
      // Return success response with the updated settings
      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully',
        settings: {
          ...updatedSettings,
          // Add back the journeyPages for the response
          journeyPages,
          // Ensure customJourneyEnabled is a boolean
          customJourneyEnabled: Boolean(updatedSettings.customJourneyEnabled)
        }
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      return NextResponse.json(
        { error: 'Failed to update settings', details: error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in PATCH /api/user/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 