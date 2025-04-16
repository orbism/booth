// src/app/page.tsx (updated)
import React from 'react';
import BoothLayout from '@/components/layouts/BoothLayout';
import PhotoBooth from '@/components/booth/PhotoBooth';
import { prisma } from '@/lib/prisma';
import { getThemeSettings } from '@/lib/theme-loader';

export const revalidate = 0; // Disable caching for this page

async function getBoothSettings() {
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
  const journeyPages = settings.journeyConfig 
    ? JSON.parse(settings.journeyConfig as string) 
    : [];

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
        />
      </div>
    </BoothLayout>
  );
}