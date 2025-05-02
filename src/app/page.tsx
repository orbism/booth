// src/app/page.tsx (updated)
import React from 'react';
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
};

async function getBoothSettings(): Promise<Settings> {
  try {
    const settings = await prisma.settings.findFirst();
    return settings || {
      countdownTime: 3,
      resetTime: 60,
      eventName: 'Photo Booth Event',
    };
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return {
      countdownTime: 3,
      resetTime: 60,
      eventName: 'Photo Booth Event',
    };
  }
}

export default async function Home() {
  const settings = await getBoothSettings();
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

  return (
    <BoothLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-center mb-6">
          {settings.eventName}
        </h1>
        <PhotoBooth 
          countdownSeconds={settings.countdownTime}
          resetTimeSeconds={settings.resetTime}
          themeSettings={{
            primaryColor: themeSettings?.primaryColor || '#3B82F6',
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
        />
      </div>
    </BoothLayout>
  );
}