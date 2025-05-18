// src/app/api/booth/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/errors';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    console.log('Booth settings API call received');
    
    // Get urlPath from query parameters
    const urlPath = request.nextUrl.searchParams.get('urlPath');
    console.log('Requested urlPath:', urlPath);
    
    let userId: string | null = null;
    
    // If urlPath is provided, find the associated event URL and user
    if (urlPath) {
      const eventUrl = await prisma.eventUrl.findFirst({
        where: { urlPath: urlPath }
      });
      
      console.log('Found eventUrl:', JSON.stringify(eventUrl));
      
      if (eventUrl && eventUrl.userId) {
        userId = eventUrl.userId;
        console.log('Using userId from eventUrl:', userId);
      }
    }
    
    // Use different query approaches based on whether we have a userId
    let settingsResults;
    if (userId) {
      console.log('Querying settings for specific userId:', userId);
      settingsResults = await prisma.$queryRaw`
        SELECT 
          id, 
          eventName, 
          countdownTime, 
          resetTime, 
          companyName, 
          companyLogo, 
          primaryColor,
          secondaryColor,
          backgroundColor,
          borderColor,
          buttonColor,
          textColor,
          theme,
          customJourneyEnabled,
          journeyConfig,
          splashPageEnabled,
          splashPageTitle,
          splashPageContent,
          splashPageImage,
          splashPageButtonText,
          captureMode,
          photoOrientation,
          photoDevice,
          photoResolution,
          photoEffect,
          printerEnabled,
          aiImageCorrection,
          videoOrientation,
          videoDevice,
          videoResolution,
          videoEffect,
          videoDuration,
          filtersEnabled,
          enabledFilters,
          storageProvider,
          blobVercelEnabled,
          localUploadPath,
          storageBaseUrl,
          userId
        FROM Settings 
        WHERE userId = ${userId}
        ORDER BY updatedAt DESC
        LIMIT 1
      `;
    } else {
      console.log('No userId found, falling back to most recent settings');
      settingsResults = await prisma.$queryRaw`
        SELECT 
          id, 
          eventName, 
          countdownTime, 
          resetTime, 
          companyName, 
          companyLogo, 
          primaryColor,
          secondaryColor,
          backgroundColor,
          borderColor,
          buttonColor,
          textColor,
          theme,
          customJourneyEnabled,
          journeyConfig,
          splashPageEnabled,
          splashPageTitle,
          splashPageContent,
          splashPageImage,
          splashPageButtonText,
          captureMode,
          photoOrientation,
          photoDevice,
          photoResolution,
          photoEffect,
          printerEnabled,
          aiImageCorrection,
          videoOrientation,
          videoDevice,
          videoResolution,
          videoEffect,
          videoDuration,
          filtersEnabled,
          enabledFilters,
          storageProvider,
          blobVercelEnabled,
          localUploadPath,
          storageBaseUrl,
          userId
        FROM Settings 
        ORDER BY updatedAt DESC
        LIMIT 1
      `;
    }
    
    // Log raw data from database for debugging
    console.log('Raw SQL result for booth settings:', 
      JSON.stringify(settingsResults, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value, 2)
    );
    
    const settings = Array.isArray(settingsResults) && settingsResults.length > 0 
      ? settingsResults[0]
      : null;
    
    if (!settings) {
      console.log('No settings found for userId:', userId);
      
      // Try to find any settings as a fallback
      const fallbackSettings = await prisma.settings.findFirst({
        orderBy: {
          updatedAt: 'desc'
        }
      });
      
      if (!fallbackSettings) {
        console.log('No fallback settings found in the database');
        return NextResponse.json({ 
          error: 'Settings not found' 
        }, { 
          status: 404 
        });
      }
      
      console.log('Using fallback settings:', fallbackSettings.id);
      
      // Convert fallbackSettings to the same format as settings
      const settingsObj: any = { ...fallbackSettings };
      if (typeof settingsObj.journeyConfig === 'string') {
        try {
          settingsObj.journeyConfig = JSON.parse(settingsObj.journeyConfig);
        } catch (e) {
          console.error('Error parsing journeyConfig:', e);
          settingsObj.journeyConfig = [];
        }
      }
      
      // Process fallback settings into the response format
      const response: any = {
        // Basic settings
        eventName: settingsObj.eventName,
        countdownTime: settingsObj.countdownTime,
        resetTime: settingsObj.resetTime,
        companyName: settingsObj.companyName,
        companyLogo: settingsObj.companyLogo,
        
        // Theme settings
        primaryColor: settingsObj.primaryColor,
        secondaryColor: settingsObj.secondaryColor,
        backgroundColor: settingsObj.backgroundColor,
        borderColor: settingsObj.borderColor,
        buttonColor: settingsObj.buttonColor,
        textColor: settingsObj.textColor,
        theme: settingsObj.theme,
        
        // Journey settings
        customJourneyEnabled: Boolean(settingsObj.customJourneyEnabled),
        journeyPages: settingsObj.journeyConfig || [],
        
        // Splash page settings
        splashPageEnabled: Boolean(settingsObj.splashPageEnabled),
        splashPageTitle: settingsObj.splashPageTitle,
        splashPageContent: settingsObj.splashPageContent,
        splashPageImage: settingsObj.splashPageImage,
        splashPageButtonText: settingsObj.splashPageButtonText,
        
        // Capture settings
        captureMode: settingsObj.captureMode,
        
        // Photo mode settings
        photoOrientation: settingsObj.photoOrientation,
        photoDevice: settingsObj.photoDevice,
        photoResolution: settingsObj.photoResolution,
        photoEffect: settingsObj.photoEffect,
        printerEnabled: Boolean(settingsObj.printerEnabled),
        aiImageCorrection: Boolean(settingsObj.aiImageCorrection),
        
        // Video mode settings
        videoOrientation: settingsObj.videoOrientation,
        videoDevice: settingsObj.videoDevice,
        videoResolution: settingsObj.videoResolution,
        videoEffect: settingsObj.videoEffect,
        videoDuration: settingsObj.videoDuration,
        
        // Filter settings
        filtersEnabled: Boolean(settingsObj.filtersEnabled),
        enabledFilters: settingsObj.enabledFilters,
        
        // Storage settings
        storageProvider: settingsObj.storageProvider,
        blobVercelEnabled: Boolean(settingsObj.blobVercelEnabled),
        localUploadPath: settingsObj.localUploadPath,
        storageBaseUrl: settingsObj.storageBaseUrl,
        
        // Meta information
        lastUpdated: new Date().toISOString(),
        isFallbackSettings: true,
        originalUserId: settingsObj.userId
      };
      
      console.log('Using fallback settings with critical fields:', {
        captureMode: response.captureMode,
        customJourneyEnabled: response.customJourneyEnabled,
        splashPageEnabled: response.splashPageEnabled,
        isFallbackSettings: response.isFallbackSettings
      });
      
      return NextResponse.json(response);
    }

    // Parse journey config from JSON if it exists
    let journeyPages = [];
    if (settings.journeyConfig) {
      try {
        // If it's already a JSON object, use it directly
        if (typeof settings.journeyConfig === 'object') {
          journeyPages = settings.journeyConfig;
        } else {
          // Otherwise, try to parse it as a JSON string
          journeyPages = JSON.parse(settings.journeyConfig as string);
        }
      } catch (error) {
        console.error('Error parsing journey config:', error);
      }
    }
    
    // Process settings for API response
    const response: any = {
      // Basic settings
      eventName: settings.eventName,
      countdownTime: settings.countdownTime,
      resetTime: settings.resetTime,
      companyName: settings.companyName,
      companyLogo: settings.companyLogo,
      
      // Theme settings
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      backgroundColor: settings.backgroundColor,
      borderColor: settings.borderColor,
      buttonColor: settings.buttonColor,
      textColor: settings.textColor,
      theme: settings.theme,
      
      // Journey settings
      customJourneyEnabled: Boolean(settings.customJourneyEnabled),
      journeyPages,
      
      // Splash page settings
      splashPageEnabled: Boolean(settings.splashPageEnabled),
      splashPageTitle: settings.splashPageTitle,
      splashPageContent: settings.splashPageContent,
      splashPageImage: settings.splashPageImage,
      splashPageButtonText: settings.splashPageButtonText,
      
      // Capture settings - critical for user's toggle to video mode
      captureMode: settings.captureMode,
      
      // Photo mode settings
      photoOrientation: settings.photoOrientation,
      photoDevice: settings.photoDevice,
      photoResolution: settings.photoResolution,
      photoEffect: settings.photoEffect,
      printerEnabled: Boolean(settings.printerEnabled),
      aiImageCorrection: Boolean(settings.aiImageCorrection),
      
      // Video mode settings
      videoOrientation: settings.videoOrientation,
      videoDevice: settings.videoDevice,
      videoResolution: settings.videoResolution,
      videoEffect: settings.videoEffect,
      videoDuration: settings.videoDuration,
      
      // Filter settings
      filtersEnabled: Boolean(settings.filtersEnabled),
      enabledFilters: settings.enabledFilters,
      
      // Storage settings
      storageProvider: settings.storageProvider,
      blobVercelEnabled: Boolean(settings.blobVercelEnabled),
      localUploadPath: settings.localUploadPath,
      storageBaseUrl: settings.storageBaseUrl,
      
      // Meta information
      userId: settings.userId,
      settingsId: settings.id,
      lastUpdated: new Date().toISOString(),
      isFallbackSettings: false
    };
    
    // Log processed settings for debugging
    console.log('Critical fields in booth API response:', {
      captureMode: response.captureMode,
      customJourneyEnabled: response.customJourneyEnabled,
      splashPageEnabled: response.splashPageEnabled,
      userId: response.userId,
      isFallbackSettings: response.isFallbackSettings
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch booth settings:', error);
    return handleApiError(error, 'Failed to fetch booth settings');
  }
}