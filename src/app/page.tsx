// src/app/page.tsx

import React from 'react';
import BoothLayout from '@/components/layouts/BoothLayout';
import PhotoBooth from '@/components/booth/PhotoBooth';
import { prisma } from '@/lib/prisma';

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

  return (
    <BoothLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-center mb-6">
          {settings.eventName}
        </h1>
        <PhotoBooth 
          countdownSeconds={settings.countdownTime}
          resetTimeSeconds={settings.resetTime}
        />
      </div>
    </BoothLayout>
  );
}