// src/app/page.tsx (updated)
import React from 'react';
import BoothLayout from '@/components/layouts/BoothLayout';
import PhotoBooth from '@/components/booth/PhotoBooth';
import { prisma } from '@/lib/prisma';
import { getThemeSettings } from '@/lib/theme-loader';
import { EventUrl } from '@/types/event-url';
import { redirect } from 'next/navigation';

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
  companyName?: string;
  companyLogo?: string | null;
  primaryColor?: string;
  showBoothBossLogo?: boolean;
};

async function getBoothSettings(): Promise<Settings> {
  try {
    // Using raw query to avoid TypeScript issues
    const settingsResults = await prisma.$queryRaw`
      SELECT * FROM Settings LIMIT 1
    `;
    
    const settings = Array.isArray(settingsResults) && settingsResults.length > 0 
      ? settingsResults[0] as Settings
      : null;
      
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

// Get event URL data if an ID is provided
async function getEventUrl(eventUrlId: string): Promise<EventUrl | null> {
  try {
    if (!eventUrlId) return null;
    
    // Using raw query to avoid TypeScript issues
    const eventUrlResults = await prisma.$queryRaw`
      SELECT * FROM EventUrl WHERE id = ${eventUrlId} AND isActive = 1
    `;
    
    return Array.isArray(eventUrlResults) && eventUrlResults.length > 0 
      ? eventUrlResults[0] as EventUrl
      : null;
  } catch (error) {
    console.error('Failed to fetch event URL:', error);
    return null;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const settings = await getBoothSettings();
  const themeSettings = await getThemeSettings();
  
  // Check if we have an eventUrlId in the URL
  const eventUrlId = searchParams?.eventUrlId as string | undefined;
  
  let eventUrl = null;
  if (eventUrlId) {
    eventUrl = await getEventUrl(eventUrlId);
    // If event URL ID was provided but not found or not active, redirect to home
    if (!eventUrl) {
      redirect('/');
    }
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

  return (
    <BoothLayout
      eventName={eventUrl?.eventName || settings.eventName}
      companyName={settings.companyName}
      companyLogo={settings.companyLogo}
      primaryColor={settings.primaryColor}
      showBranding={settings.showBoothBossLogo !== false}
      eventUrlId={eventUrlId}
    >
      <div className="p-4">
        <h1 className="text-2xl font-bold text-center mb-6">
          {eventUrl?.eventName || settings.eventName}
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
          eventUrlId={eventUrlId}
        />
      </div>
    </BoothLayout>
  );
}