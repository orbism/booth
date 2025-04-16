// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { handleApiError, unauthorizedResponse } from '@/lib/errors';
import { z } from 'zod';

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
  journeyPages: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      backgroundImage: z.string().nullable(),
      buttonText: z.string(),
      buttonImage: z.string().nullable()
    })
  ).default([]),
  journeyId: z.string().optional(),

});

export async function GET(_request: NextRequest) {
  if (_request.url) {
    // Do nothing but this prevents the unused variable warning
  }
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }
    
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      return NextResponse.json({ 
        error: 'Settings not found' 
      }, { 
        status: 404 
      });
    }

    // Parse journey config from JSON if it exists
    const journeyPages = settings.journeyConfig 
    ? JSON.parse(settings.journeyConfig as string) 
    : [];
    
    return NextResponse.json({
      ...settings,
      customJourneyEnabled: settings.customJourneyEnabled || false,
      activeJourneyId: settings.activeJourneyId || null,
      journeyPages
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch settings');
  }
}

export async function PUT(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }
    
    const data = await _request.json();

    console.log('Updating settings with:', {
      theme: data.theme,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor
    });
    
    // Validate settings data
    const validatedData = settingsSchema.parse(data);
    
    // Find existing settings
    const existingSettings = await prisma.settings.findFirst();
    
    if (!existingSettings) {
      return NextResponse.json({ 
        error: 'Settings not found' 
      }, { 
        status: 404 
      });
    }
    
    // Update settings
    const updatedSettings = await prisma.settings.update({
      where: {
        id: existingSettings.id
      },
      data: {
        eventName: validatedData.eventName,
        adminEmail: validatedData.adminEmail,
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
        journeyConfig: validatedData.journeyPages?.length 
          ? JSON.stringify(validatedData.journeyPages)
          : null
      }
    });
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    return handleApiError(error, 'Failed to update settings');
  }
}