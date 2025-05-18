'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import SettingsForm from '@/components/forms/SettingsForm';
import { useToast } from '@/context/ToastContext';

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
  showBoothBossLogo: boolean;
  customJourneyEnabled: boolean;
  journeyName?: string;
  activeJourneyId?: string | null;
  journeyConfig?: any;
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
  filtersEnabled: boolean;
  enabledFilters?: string | null;
  storageProvider?: string;
  blobVercelEnabled?: boolean;
  localUploadPath?: string;
  storageBaseUrl?: string | null;
  enablePreviewStep?: boolean;
  enableEffectsStep?: boolean;
  enableSocialStep?: boolean;
};

type ThemeOption = 'midnight' | 'pastel' | 'bw' | 'custom';

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    fetchSettings();
  }, [status, router, username]);
  
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/user/settings?username=${username}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      
      setSettings(data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateSettings = async (updatedSettings: Partial<Settings>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/user/settings?username=${username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedSettings,
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

      setSettings(data.settings);
      
      showToast('Booth settings have been updated successfully.', 'success', 5000);

      await fetchSettings();
      
      return data;
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      
      showToast(err instanceof Error ? err.message : 'An unexpected error occurred', 'error', 5000);
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !settings) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }
  
  if (error && !settings) {
    return (
      <div>
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
                  onClick={fetchSettings}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!settings) {
    return (
      <div>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">
            Settings not found for {username}. Please check the account or contact support.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Booth Settings</h1>
        <p className="text-gray-600">
          Configure booth settings for {username}
        </p>
      </div>
      
      <SettingsForm 
        initialSettings={{
          id: settings.id || '',
          eventName: settings.eventName || '',
          adminEmail: settings.adminEmail || '',
          countdownTime: settings.countdownTime || 3,
          resetTime: settings.resetTime || 15,
          emailSubject: settings.emailSubject || '',
          emailTemplate: settings.emailTemplate || '',
          smtpHost: settings.smtpHost || '',
          smtpPort: settings.smtpPort || 587,
          smtpUser: settings.smtpUser || '',
          smtpPassword: settings.smtpPassword || '',
          companyName: settings.companyName || '',
          companyLogo: settings.companyLogo || null,
          primaryColor: settings.primaryColor || '#3B82F6',
          secondaryColor: settings.secondaryColor || '#1E40AF',
          theme: (settings.theme as ThemeOption) || 'custom',
          backgroundColor: settings.backgroundColor || '#FFFFFF',
          borderColor: settings.borderColor || '#E5E7EB',
          buttonColor: settings.buttonColor || '#3B82F6',
          textColor: settings.textColor || '#111827',
          notes: settings.notes || null,
          customJourneyEnabled: settings.customJourneyEnabled || false,
          journeyName: settings.journeyName || 'Default Journey',
          activeJourneyId: settings.activeJourneyId || null,
          journeyPages: settings.journeyPages || [],
          splashPageEnabled: settings.splashPageEnabled || false,
          splashPageTitle: settings.splashPageTitle || '',
          splashPageContent: settings.splashPageContent || '',
          splashPageImage: settings.splashPageImage || null,
          splashPageButtonText: settings.splashPageButtonText || '',
          captureMode: (settings.captureMode as 'photo' | 'video') || 'photo',
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
          filtersEnabled: settings.filtersEnabled || false,
          enabledFilters: settings.enabledFilters || null,
          storageProvider: settings.storageProvider || 'auto',
          blobVercelEnabled: settings.blobVercelEnabled !== undefined ? settings.blobVercelEnabled : true,
          localUploadPath: settings.localUploadPath || 'uploads',
          storageBaseUrl: settings.storageBaseUrl || null,
          showBoothBossLogo: settings.showBoothBossLogo !== undefined ? settings.showBoothBossLogo : true
        }}
        onSubmit={handleUpdateSettings}
        isAdmin={true}
        isLoading={isLoading}
      />
    </div>
  );
} 