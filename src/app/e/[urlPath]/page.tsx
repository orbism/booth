import React from 'react';
import { redirect } from 'next/navigation';
import BoothLayout from '@/components/layouts/BoothLayout';
import PhotoBooth from '@/components/booth/PhotoBooth';
import { prisma } from '@/lib/prisma';
import { getThemeSettings } from '@/lib/theme-loader';

export const revalidate = 0; // Disable caching for this page

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

type EventUrl = {
  id: string;
  urlPath: string;
  eventName: string;
  isActive: boolean;
  userId: string;
};

async function getEventSettings(urlPath: string): Promise<{ settings: Settings, eventUrl: EventUrl | null }> {
  try {
    // Find the event URL
    const eventUrl = await prisma.eventUrl.findUnique({
      where: { urlPath: urlPath.toLowerCase() },
    });
    
    // If not found or not active, return null
    if (!eventUrl || !eventUrl.isActive) {
      return { settings: { countdownTime: 3, resetTime: 60, eventName: 'Photo Booth Event' }, eventUrl: null };
    }
    
    // Get settings for this user
    const settings = await prisma.settings.findFirst({
      where: { userId: eventUrl.userId },
    });
    
    if (!settings) {
      // Use default settings but with event name from the URL
      return { 
        settings: { 
          countdownTime: 3, 
          resetTime: 60, 
          eventName: eventUrl.eventName,
          userId: eventUrl.userId
        }, 
        eventUrl 
      };
    }
    
    // Return both settings and event URL info
    return { 
      settings: {
        ...settings,
        // Override event name with the one from the URL
        eventName: eventUrl.eventName
      }, 
      eventUrl 
    };
  } catch (error) {
    console.error('Failed to fetch event settings:', error);
    
    // Return default settings
    return { 
      settings: { 
        countdownTime: 3, 
        resetTime: 60, 
        eventName: 'Photo Booth Event'
      }, 
      eventUrl: null 
    };
  }
}

export default async function EventPage({ params }: { params: { urlPath: string } }) {
  const { settings, eventUrl } = await getEventSettings(params.urlPath);
  
  // If event URL not found or not active, redirect to home
  if (!eventUrl) {
    redirect('/');
  }
  
  const themeSettings = await getThemeSettings(settings.userId);
  
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