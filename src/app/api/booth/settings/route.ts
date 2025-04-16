// src/app/api/booth/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/errors';

export async function GET() {
  try {
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
    
    // Only return public-facing settings
    return NextResponse.json({
      eventName: settings.eventName,
      countdownTime: settings.countdownTime,
      resetTime: settings.resetTime,
      companyName: settings.companyName,
      companyLogo: settings.companyLogo,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      backgroundColor: settings.backgroundColor,
      borderColor: settings.borderColor,
      buttonColor: settings.buttonColor,
      textColor: settings.textColor,
      theme: settings.theme,
      customJourneyEnabled: settings.customJourneyEnabled,
      journeyPages,
      splashPageEnabled: settings.splashPageEnabled,
      splashPageTitle: settings.splashPageTitle,
      splashPageContent: settings.splashPageContent,
      splashPageImage: settings.splashPageImage,
      splashPageButtonText: settings.splashPageButtonText,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch booth settings');
  }
}