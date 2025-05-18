import React from 'react';
import { redirect } from 'next/navigation';
import BoothLayout from '@/components/layouts/BoothLayout';
import PhotoBooth from '@/components/booth/PhotoBooth';
import { prisma } from '@/lib/prisma';
import { getThemeSettings } from '@/lib/theme-loader';
import { EventUrl } from '@/types/event-url';

// Disable Next.js caching with the shortest possible revalidation time
export const revalidate = 0; // Disable caching for this page
export const fetchCache = 'force-no-store';
export const dynamic = 'force-dynamic';

// Define a type for the settings to ensure we handle journeyConfig correctly
type Settings = {
  id?: string;
  countdownTime: number;
  resetTime: number;
  eventName: string;
  customJourneyEnabled?: boolean;
  journeyConfig?: any; // Could be a JSON string or a JSON object
  splashPageEnabled?: boolean;
  splashPageTitle?: string | null;
  splashPageContent?: string | null;
  splashPageImage?: string | null;
  splashPageButtonText?: string | null;
  captureMode?: string;
  photoOrientation?: string;
  photoResolution?: string;
  photoEffect?: string;
  printerEnabled?: boolean;
  aiImageCorrection?: boolean;
  videoOrientation?: string;
  videoResolution?: string;
  videoEffect?: string;
  videoDuration?: number;
  filtersEnabled?: boolean;
  enabledFilters?: string | null;
  userId?: string;
  companyName?: string;
  companyLogo?: string | null;
  primaryColor?: string;
  showBoothBossLogo?: boolean;
};

async function getEventSettings(urlPath: string): Promise<{ settings: Settings, eventUrl: EventUrl | null }> {
  try {
    console.log(`Fetching event settings for URL path: ${urlPath}`);
    
    // Find the event URL using raw query
    const eventUrlResults = await prisma.$queryRaw`
      SELECT * FROM EventUrl WHERE urlPath = ${urlPath.toLowerCase()} AND isActive = 1
    `;
    
    const eventUrl = Array.isArray(eventUrlResults) && eventUrlResults.length > 0 
      ? eventUrlResults[0] as EventUrl
      : null;
    
    // If not found or not active, return null
    if (!eventUrl) {
      console.log(`Event URL not found or not active for path: ${urlPath}`);
      return { 
        settings: { 
          countdownTime: 3, 
          resetTime: 60, 
          eventName: 'Photo Booth Event' 
        }, 
        eventUrl: null 
      };
    }
    
    console.log(`Event URL found: ${eventUrl.id}, fetching settings for userId: ${eventUrl.userId}`);
    
    // Get settings for this user using raw query with explicit field selection
    const settingsResults = await prisma.$queryRaw`
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
        showBoothBossLogo,
        userId
      FROM Settings 
      WHERE userId = ${eventUrl.userId}
      LIMIT 1
    `;
    
    // Log raw database results for debugging
    console.log('Raw settings query results:', 
      JSON.stringify(settingsResults, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value, 2)
    );
    
    const settings = Array.isArray(settingsResults) && settingsResults.length > 0 
      ? settingsResults[0] as Settings
      : null;
    
    if (!settings) {
      console.log(`No settings found for userId: ${eventUrl.userId}, using defaults`);
      // Use default settings but with event name from the URL
      return { 
        settings: { 
          countdownTime: 3, 
          resetTime: 60, 
          eventName: eventUrl.eventName,
          userId: eventUrl.userId,
          captureMode: 'photo',  // Default capture mode
          customJourneyEnabled: false  // Default journey setting
        }, 
        eventUrl 
      };
    }
    
    // Log specific field values for debugging - check type as well
    console.log('Critical settings fields from database:', {
      captureMode: `${settings.captureMode} (${typeof settings.captureMode})`,
      customJourneyEnabled: `${settings.customJourneyEnabled} (${typeof settings.customJourneyEnabled})`,
      videoOrientation: settings.videoOrientation,
      videoDuration: settings.videoDuration
    });
    
    // Ensure boolean values are properly handled
    let processedSettings = {
      ...settings,
      // Override event name with the one from the URL
      eventName: eventUrl.eventName,
      // Explicitly handle boolean values from raw SQL query (which may return 0/1 as numbers)
      customJourneyEnabled: Boolean(settings.customJourneyEnabled),
      splashPageEnabled: Boolean(settings.splashPageEnabled),
      printerEnabled: Boolean(settings.printerEnabled),
      aiImageCorrection: Boolean(settings.aiImageCorrection),
      filtersEnabled: Boolean(settings.filtersEnabled),
      // Ensure capture mode is a string
      captureMode: settings.captureMode ? String(settings.captureMode) : 'photo',
    };
    
    // After processing, log the final settings values
    console.log('Final processed settings:', {
      customJourneyEnabled: processedSettings.customJourneyEnabled,
      captureMode: processedSettings.captureMode,
      splashPageEnabled: processedSettings.splashPageEnabled
    });
    
    // Return both settings and event URL info
    return { 
      settings: processedSettings, 
      eventUrl 
    };
  } catch (error) {
    console.error('Failed to fetch event settings:', error);
    
    // Return default settings
    return { 
      settings: { 
        countdownTime: 3, 
        resetTime: 60, 
        eventName: 'Photo Booth Event',
        captureMode: 'photo',  // Default capture mode
        customJourneyEnabled: false  // Default journey setting
      }, 
      eventUrl: null 
    };
  }
}

export default async function EventPage({ params }: { params: { urlPath: string } }) {
  const renderTimestamp = new Date().toISOString();
  console.log(`Rendering event page for URL path: ${params.urlPath} at ${renderTimestamp}`);
  
  const { settings, eventUrl } = await getEventSettings(params.urlPath);
  
  // If event URL not found or not active, redirect to home
  if (!eventUrl) {
    redirect('/');
  }
  
  // Get theme settings for this user
  const themeSettings = await getThemeSettings();
  
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

  // Log important settings for debugging
  console.log('Key booth settings for rendering:', {
    eventName: settings.eventName,
    captureMode: settings.captureMode || 'photo',
    customJourneyEnabled: settings.customJourneyEnabled || false,
  });

  return (
    <BoothLayout 
      eventName={settings.eventName}
      companyName={settings.companyName}
      companyLogo={settings.companyLogo}
      primaryColor={settings.primaryColor}
      showBranding={settings.showBoothBossLogo !== false}
      eventUrlId={eventUrl.id}
    >
      <div className="p-4">
        <h1 className="text-2xl font-bold text-center mb-6">
          {settings.eventName}
        </h1>
        
        {/* Debug info - remove in production */}
        <div className="mb-4 text-xs bg-gray-100 p-2 rounded">
          <p>Debug Info - Page rendered at: {renderTimestamp}</p>
          <p>Capture Mode: <strong className="text-blue-600">{settings.captureMode || 'photo'}</strong></p>
          <p>Custom Journey: <strong className="text-blue-600">{settings.customJourneyEnabled ? 'Enabled' : 'Disabled'}</strong></p>
          <p>User ID: <strong className="text-blue-600">{settings.userId || 'None'}</strong></p>
          <p>EventURL ID: <strong className="text-blue-600">{eventUrl.id}</strong></p>
          <p className="mt-2">
            <a 
              href={`?t=${new Date().getTime()}`} 
              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Force Refresh
            </a>
          </p>
        </div>
        
        <PhotoBooth 
          countdownSeconds={settings.countdownTime}
          resetTimeSeconds={settings.resetTime}
          themeSettings={{
            primaryColor: themeSettings?.primaryColor || settings.primaryColor || '#3B82F6',
            secondaryColor: themeSettings?.secondaryColor || '#1E40AF',
            backgroundColor: themeSettings?.backgroundColor || '#ffffff',
            borderColor: themeSettings?.borderColor || '#e5e7eb', 
            buttonColor: themeSettings?.buttonColor || '#3B82F6',
            textColor: themeSettings?.textColor || '#111827',
          }}
          customJourneyEnabled={settings.customJourneyEnabled || false}
          journeyPages={journeyPages}
          splashPageEnabled={settings.splashPageEnabled || false}
          splashPageTitle={settings.splashPageTitle || 'Welcome to Our Photo Booth'}
          splashPageContent={settings.splashPageContent || 'Get ready for a fun photo experience!'}
          splashPageImage={settings.splashPageImage}
          splashPageButtonText={settings.splashPageButtonText || 'Start'}
          captureMode={settings.captureMode as 'photo' | 'video' || 'photo'}
          photoOrientation={settings.photoOrientation}
          photoResolution={settings.photoResolution}
          photoEffect={settings.photoEffect}
          printerEnabled={settings.printerEnabled}
          aiImageCorrection={settings.aiImageCorrection}
          videoOrientation={settings.videoOrientation}
          videoResolution={settings.videoResolution}
          videoEffect={settings.videoEffect}
          videoDuration={settings.videoDuration}
          filtersEnabled={settings.filtersEnabled || false}
          enabledFilters={settings.enabledFilters || null}
          eventUrlId={eventUrl.id}
        />
      </div>
    </BoothLayout>
  );
} 