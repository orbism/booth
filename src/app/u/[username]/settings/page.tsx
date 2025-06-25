'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SettingsForm from '@/components/forms/SettingsForm';
import EventUrlSelector from '@/components/EventUrlSelector';
import { useToast } from '@/context/ToastContext';
import { invalidateSettingsCache } from '@/lib/client-settings';
import { EventUrl } from '@prisma/client';

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
  // Add these new fields
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
  // Storage-related fields
  filtersEnabled: boolean;
  enabledFilters?: string | null;
  storageProvider?: string;
  blobVercelEnabled?: boolean;
  localUploadPath?: string;
  storageBaseUrl?: string | null;
  // User Journey Steps
  enablePreviewStep?: boolean;
  enableEffectsStep?: boolean;
  enableSocialStep?: boolean;
};



type ThemeOption = 'midnight' | 'pastel' | 'bw' | 'custom';

export default function CustomerSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [settings, setSettings] = useState<Settings | null>(null);
  const [eventUrls, setEventUrls] = useState<EventUrl[]>([]);
  const [selectedEventUrlId, setSelectedEventUrlId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEventUrls, setIsLoadingEventUrls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    fetchEventUrls();
    fetchSettings(selectedEventUrlId);
  }, [status, router, selectedEventUrlId]);
  
  const fetchEventUrls = async () => {
    try {
      setIsLoadingEventUrls(true);
      
      const response = await fetch('/api/user/event-urls');
      
      if (!response.ok) {
        throw new Error('Failed to fetch event URLs');
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setEventUrls(data);
        console.log(`[CUSTOMER_SETTINGS] Fetched ${data.length} event URLs`);
        
        // If we have event URLs but no selected one, select the first one
        if (data.length > 0 && !selectedEventUrlId) {
          // We'll set this in the useEffect in the EventUrlSelector component
          // to avoid the loop from dependencies
        }
      }
    } catch (err) {
      console.error('Error fetching event URLs:', err);
      // Don't block the entire page for event URL loading failures
    } finally {
      setIsLoadingEventUrls(false);
    }
  };
  
  const fetchSettings = async (eventUrlId: string | null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const url = eventUrlId 
        ? `/api/user/settings?eventUrlId=${eventUrlId}`
        : '/api/user/settings';
      
      console.log(`[CUSTOMER_SETTINGS] Fetching settings from: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      
      // Make sure we're properly setting the initial values
      setSettings(data);
      console.log('[CUSTOMER_SETTINGS] Settings loaded:', { id: data.id, eventUrlId });
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEventUrlChange = (eventUrlId: string | null) => {
    console.log(`[CUSTOMER_SETTINGS] Selected event URL changed to: ${eventUrlId || 'default'}`);
    setSelectedEventUrlId(eventUrlId);
    // Settings will be loaded via the useEffect dependency on selectedEventUrlId
  };
  
  const handleUpdateSettings = async (updatedSettings: Partial<Settings>) => {
    try {
      // Show loading UI
      setIsLoading(true);
      setError(null);
      
      console.log(`[CUSTOMER_SETTINGS] Updating settings for${selectedEventUrlId ? ` event URL ${selectedEventUrlId}` : ' general user'}:`, {
        captureMode: updatedSettings.captureMode,
        customJourneyEnabled: updatedSettings.customJourneyEnabled
      });
      
      const url = selectedEventUrlId 
        ? `/api/user/settings?eventUrlId=${selectedEventUrlId}`
        : '/api/user/settings';
      
      const response = await fetch(url, {
        method: 'PATCH',
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
      
      // Immediately invalidate all caches for this user's booths
      try {
        // Find the event URL path if we have an ID
        const eventUrlPath = selectedEventUrlId 
          ? eventUrls.find(u => u.id === selectedEventUrlId)?.urlPath
          : undefined;
        
        // Invalidate the specific URL cache if applicable
        if (eventUrlPath) {
          await invalidateSettingsCache('booth-settings', eventUrlPath, true);
          console.log(`[CUSTOMER_SETTINGS] Invalidated booth-settings cache for ${eventUrlPath}`);
        } else {
          // If no specific URL or it's general settings, invalidate all URL caches
          await invalidateSettingsCache('booth-settings', undefined, true);
          console.log('[CUSTOMER_SETTINGS] Invalidated general booth-settings cache');
          
          // Invalidate each URL's cache
          for (const url of eventUrls) {
            await invalidateSettingsCache('booth-settings', url.urlPath, true);
            console.log(`[CUSTOMER_SETTINGS] Invalidated cache for URL: ${url.urlPath}`);
          }
        }
      } catch (cacheError) {
        console.error('[CUSTOMER_SETTINGS] Failed to invalidate cache:', cacheError);
        // Don't fail the whole operation just because cache invalidation failed
      }
      
      // Show success message
      showToast('Your booth settings have been updated successfully.', 'success', 5000);

      // Refetch to make sure we have the latest data
      await fetchSettings(selectedEventUrlId);
      
      return data;
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      
      // Show error message
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
      <div className="p-6">
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
                  onClick={() => fetchSettings(selectedEventUrlId)}
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
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">
            Settings not found. Please check your account or contact support.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Booth Settings</h1>
      
      {/* Event URL Selector */}
      <EventUrlSelector
        eventUrls={eventUrls}
        selectedEventUrlId={selectedEventUrlId}
        onEventUrlChange={handleEventUrlChange}
        isLoading={isLoadingEventUrls}
      />
      
      {/* Settings Form */}
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
          filtersEnabled: settings.filtersEnabled || false,
          enabledFilters: settings.enabledFilters || null,
          storageProvider: settings.storageProvider as 'auto' | 'local' | 'vercel' || 'auto',
          blobVercelEnabled: settings.blobVercelEnabled || true,
          localUploadPath: settings.localUploadPath || 'uploads',
          storageBaseUrl: settings.storageBaseUrl || null,
          enablePreviewStep: settings.enablePreviewStep || true,
          enableEffectsStep: settings.enableEffectsStep || false,
          enableSocialStep: settings.enableSocialStep || false,
        }}
        onSubmit={handleUpdateSettings}
      />
    </div>
  );
} 