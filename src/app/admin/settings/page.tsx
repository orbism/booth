// src/app/admin/settings/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SettingsForm from '@/components/forms/SettingsForm';

type Settings = {
  id: string;
  eventName: string;
  adminEmail: string;
  countdownTime: number;
  resetTime: number;
  emailSubject: string;
  emailTemplate: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  companyName: string;
  companyLogo: string | null;
  primaryColor: string;
  secondaryColor: string;
  theme?: string;
  backgroundColor?: string | null;
  borderColor?: string | null;
  buttonColor?: string | null;
  textColor?: string | null;
  notes?: string | null;
  // Add these new fields
  customJourneyEnabled: boolean;
  activeJourneyId?: string | null;
  journeyPages?: Array<{
    id: string;
    title: string;
    content: string;
    backgroundImage: string | null;
    buttonText: string;
    buttonImage: string | null;
  }>;
  splashPageEnabled: boolean;
  splashPageTitle: string;
  splashPageContent: string;
  splashPageImage: string | null;
  splashPageButtonText: string;
  captureMode?: string;
  photoOrientation?: string;
  photoDevice?: string;
  photoResolution?: string;
  photoEffect?: string;
  printerEnabled?: boolean;
  aiImageCorrection?: boolean;
  videoOrientation?: string;
  videoDevice?: string;
  videoResolution?: string;
  videoEffect?: string;
  videoDuration?: number;
  // Storage-related fields
  filtersEnabled: boolean;
  enabledFilters?: string | null;
  storageProvider: string;
  blobVercelEnabled: boolean;
  localUploadPath: string;
  storageBaseUrl: string | null;
};

type ThemeOption = 'midnight' | 'pastel' | 'bw' | 'custom';


export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    async function fetchSettings() {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/admin/settings');
        
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        
        const data = await response.json();
        
        // Log the journey-related settings to debug
        console.log('Fetched settings:', {
          customJourneyEnabled: data.customJourneyEnabled,
          activeJourneyId: data.activeJourneyId,
          journeyPagesCount: data.journeyPages?.length || 0
        });
        
        // Make sure we're properly setting the initial values
        setSettings(data);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSettings();
  }, [status, router]);
  
  const handleUpdateSettings = async (updatedSettings: Partial<Settings>) => {
    try {
      // Show loading UI
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedSettings,
          // Ensure theme-related fields are included with defaults if not provided
          theme: updatedSettings.theme || 'custom',
          backgroundColor: updatedSettings.backgroundColor || '#ffffff',
          borderColor: updatedSettings.borderColor || '#e5e7eb',
          buttonColor: updatedSettings.buttonColor || updatedSettings.primaryColor,
          textColor: updatedSettings.textColor || '#111827',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update settings');
      }
      
      const data = await response.json();

      // Update local state with new settings
      setSettings(data);

      await refreshSettings();
      
      return data;
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      console.error('Error refreshing settings:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!settings) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-700">
          Settings not found. Please run the database seed script to create default settings.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Booth Settings</h1>
      <SettingsForm 
        initialSettings={{
          id: settings.id,
          eventName: settings.eventName,
          adminEmail: settings.adminEmail,
          countdownTime: settings.countdownTime,
          resetTime: settings.resetTime,
          emailSubject: settings.emailSubject,
          emailTemplate: settings.emailTemplate,
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort,
          smtpUser: settings.smtpUser,
          smtpPassword: settings.smtpPassword,
          companyName: settings.companyName,
          companyLogo: settings.companyLogo || null,
          primaryColor: settings.primaryColor,
          secondaryColor: settings.secondaryColor,
          theme: (settings.theme as ThemeOption) || 'custom',
          backgroundColor: settings.backgroundColor ?? null,
          borderColor: settings.borderColor ?? null,
          buttonColor: settings.buttonColor ?? null,
          textColor: settings.textColor ?? null,
          notes: settings.notes ?? null,
          customJourneyEnabled: settings.customJourneyEnabled || false,
          activeJourneyId: settings.activeJourneyId || null,
          journeyPages: settings.journeyPages || [],
          splashPageEnabled: settings.splashPageEnabled || false,
          splashPageTitle: settings.splashPageTitle || '',
          splashPageContent: settings.splashPageContent || '',
          splashPageImage: settings.splashPageImage || null,
          splashPageButtonText: settings.splashPageButtonText || 'Start',
          captureMode: settings.captureMode as 'photo' | 'video' || 'photo',
          photoOrientation: settings.photoOrientation || 'portrait-standard',
          photoDevice: settings.photoDevice || 'ipad',
          photoResolution: settings.photoResolution || 'medium',
          photoEffect: settings.photoEffect || 'none',
          printerEnabled: settings.printerEnabled || false,
          aiImageCorrection: settings.aiImageCorrection || false,
          videoOrientation: settings.videoOrientation || 'portrait-standard',
          videoDevice: settings.videoDevice || 'ipad',
          videoResolution: settings.videoResolution || 'medium',
          videoEffect: settings.videoEffect || 'none',
          videoDuration: settings.videoDuration || 10,
          // Add storage-related fields
          filtersEnabled: settings.filtersEnabled || false,
          enabledFilters: settings.enabledFilters || null,
          storageProvider: settings.storageProvider || 'auto',
          blobVercelEnabled: settings.blobVercelEnabled || true,
          localUploadPath: settings.localUploadPath || 'uploads',
          storageBaseUrl: settings.storageBaseUrl || null,
        }}
        onSubmit={handleUpdateSettings}
      />
    </div>
  );
}