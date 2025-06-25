import React from 'react';
import { redirect } from 'next/navigation';
import BoothLayout from '@/components/layouts/BoothLayout';
import PhotoBooth from '@/components/booth/PhotoBooth';
import { prisma } from '@/lib/prisma';
import { getThemeSettings } from '@/lib/theme-loader';
import { EventUrl } from '@/types/event-url';
import { processSettingsFromDb, safeParseJson, logSettingsDebug } from '@/lib/data-utils';
import DebugPanelWrapper from '@/components/debug/DebugPanelWrapper';
import Link from 'next/link';

// Disable Next.js caching with the shortest possible revalidation time
export const revalidate = 0;

// Configure page as force-dynamic to prevent caching
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
  lastUpdated?: string;
  requestedAt?: string;
  fetchTimestamp?: number; // Timestamp for when settings were fetched, used for cache busting
  activeJourneyId?: string | null;
};

async function getEventSettings(urlPath: string): Promise<{ settings: Settings, eventUrl: EventUrl | null, isInactive?: boolean }> {
  try {
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    console.log(`[EVENT PAGE] 🔍 Fetching settings for URL path: "${urlPath}" at ${new Date().toISOString()}`);
    
    // First, check if the URL exists at all without the isActive filter
    const urlCheckResults = await prisma.$queryRaw`
      SELECT id, urlPath, isActive, userId, eventName FROM EventUrl WHERE urlPath = ${urlPath.toLowerCase()}
    `;
    
    // If URL doesn't exist at all, return null right away
    if (!Array.isArray(urlCheckResults) || urlCheckResults.length === 0) {
      console.error(`[EVENT PAGE] ❌ Event URL does not exist: "${urlPath}" - WILL REDIRECT TO HOME`);
      return { 
        settings: { 
          countdownTime: 3, 
          resetTime: 60, 
          eventName: 'Photo Booth Event',
          captureMode: 'photo',
          customJourneyEnabled: false,
          journeyConfig: []
        }, 
        eventUrl: null 
      };
    }
    
    // URL exists - check if it's active
    const rawEventUrl = urlCheckResults[0];
    console.log(`[EVENT PAGE] ✅ Found URL: ${rawEventUrl.id}, isActive: ${rawEventUrl.isActive}`);
    
    // If URL exists but is inactive, return it with an isInactive flag
    if (!rawEventUrl.isActive) {
      console.log(`[EVENT PAGE] ⚠️ URL exists but is inactive: ${rawEventUrl.id}`);
      
      // Get basic settings for this URL's owner
      const settingsResults = await prisma.$queryRaw`
        SELECT 
          id, 
          eventName,
          countdownTime, 
          resetTime,
          userId,
          captureMode,
          customJourneyEnabled,
          journeyConfig,
          activeJourneyId
        FROM Settings 
        WHERE userId = ${rawEventUrl.userId}
        ORDER BY updatedAt DESC
        LIMIT 1
      `;
      
      const basicSettings = Array.isArray(settingsResults) && settingsResults.length > 0 
        ? processSettingsFromDb(settingsResults[0])
        : { 
            countdownTime: 3, 
            resetTime: 60, 
            eventName: rawEventUrl.eventName || 'Photo Booth Event',
            userId: rawEventUrl.userId,
            captureMode: 'photo',
            customJourneyEnabled: false,
            journeyConfig: []
          };
      
      return { 
        settings: basicSettings, 
        eventUrl: rawEventUrl as EventUrl,
        isInactive: true
      };
    }
    
    // URL is active - proceed with full settings retrieval
    console.log(`[EVENT PAGE] ✅ Event URL is active: ${rawEventUrl.id}, userId: ${rawEventUrl.userId}`);
    
    // Get settings from API instead of directly from database to ensure we get the latest
    // Use proper URL construction to avoid URL parsing errors
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const apiUrl = new URL('/api/booth/settings', baseUrl || 'http://localhost:3000');
    apiUrl.searchParams.append('urlPath', urlPath);
    apiUrl.searchParams.append('t', timestamp.toString());
    
    console.log(`[EVENT PAGE] 🔍 Fetching settings from API URL: ${apiUrl.toString()}`);
    
    // Use aggressive cache prevention options
    const response = await fetch(apiUrl.toString(), {
      cache: 'no-store',
      next: { revalidate: 0 },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'fetch-force-fresh'
      }
    });
    
    if (!response.ok) {
      console.error(`[EVENT PAGE] ❌ Failed to fetch settings from API: ${response.status} ${response.statusText}`);
      
      // Try 3 more times if the first attempt fails
      console.log(`[EVENT PAGE] ⚠️ First attempt failed - retrying API call...`);
      let retryCount = 0;
      let retrySuccess = false;
      let retryResponse;
      
      while (retryCount < 3 && !retrySuccess) {
        try {
          // Add a small delay between retries
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Add a new timestamp for each retry
          const retryTimestamp = Date.now();
          const retryUrl = new URL('/api/booth/settings', baseUrl || 'http://localhost:3000');
          retryUrl.searchParams.append('urlPath', urlPath);
          retryUrl.searchParams.append('t', retryTimestamp.toString());
          retryUrl.searchParams.append('retry', (retryCount + 1).toString());
          
          console.log(`[EVENT PAGE] 🔄 Retry ${retryCount + 1} - Fetching settings from: ${retryUrl.toString()}`);
          
          retryResponse = await fetch(retryUrl.toString(), {
            cache: 'no-store',
            next: { revalidate: 0 },
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Requested-With': 'fetch-force-fresh'
            }
          });
          
          if (retryResponse.ok) {
            console.log(`[EVENT PAGE] ✅ Retry ${retryCount + 1} successful!`);
            retrySuccess = true;
            break;
          } else {
            console.error(`[EVENT PAGE] ❌ Retry ${retryCount + 1} failed: ${retryResponse.status} ${retryResponse.statusText}`);
          }
        } catch (retryError) {
          console.error(`[EVENT PAGE] ❌ Retry ${retryCount + 1} error:`, retryError);
        }
        
        retryCount++;
      }
      
      // If retries were successful, use that response
      if (retrySuccess && retryResponse) {
        const settingsData = await retryResponse.json();
        console.log(`[EVENT PAGE] ✅ Successfully retrieved settings after ${retryCount + 1} attempts`);
        console.log('[EVENT PAGE] API settings (from retry):');
        logSettingsDebug(settingsData, 'EVENT PAGE - API Settings (Retry)');
        
        // The API already processes settings properly, no need to process again
        return { 
          settings: settingsData, 
          eventUrl: rawEventUrl as EventUrl 
        };
      }
      
      // If all retries failed, fallback to direct database query
      console.log(`[EVENT PAGE] ⚠️ All API attempts failed - falling back to direct database query`);
      
      const fallbackSettings = await prisma.$queryRaw`
        SELECT 
          id, 
          eventName,
          countdownTime, 
          resetTime,
          userId,
          captureMode,
          customJourneyEnabled,
          journeyConfig,
          activeJourneyId,
          splashPageEnabled,
          splashPageTitle,
          splashPageContent,
          splashPageImage,
          splashPageButtonText,
          photoOrientation,
          photoResolution,
          photoEffect,
          printerEnabled,
          aiImageCorrection,
          videoOrientation,
          videoResolution,
          videoEffect,
          videoDuration,
          filtersEnabled,
          enabledFilters,
          updatedAt
        FROM Settings 
        WHERE userId = ${rawEventUrl.userId}
        ORDER BY updatedAt DESC
        LIMIT 1
      `;
      
      const settingsData = Array.isArray(fallbackSettings) && fallbackSettings.length > 0 
        ? processSettingsFromDb(fallbackSettings[0])
        : { 
            countdownTime: 3, 
            resetTime: 60, 
            eventName: rawEventUrl.eventName || 'Photo Booth Event',
            userId: rawEventUrl.userId,
            captureMode: 'photo',
            customJourneyEnabled: false,
            journeyConfig: []
          };
      
      // Add extra fields needed by the frontend
      settingsData.eventName = rawEventUrl.eventName;
      settingsData.lastUpdated = new Date().toISOString();
      settingsData.requestedAt = new Date().toISOString();
      settingsData.fetchTimestamp = Date.now();
      
      console.log('[EVENT PAGE] Fallback settings:');
      logSettingsDebug(settingsData, 'EVENT PAGE - Fallback Settings');
      
      return { 
        settings: settingsData, 
        eventUrl: rawEventUrl as EventUrl 
      };
    }
    
    // If we got here, the first API call was successful
    const settingsData = await response.json();
    console.log('[EVENT PAGE] API settings:');
    logSettingsDebug(settingsData, 'EVENT PAGE - API Settings');
    
    return { 
      settings: settingsData, 
      eventUrl: rawEventUrl as EventUrl 
    };
  } catch (error) {
    console.error('[EVENT PAGE] ❌ Error fetching settings:', error);
    return { 
      settings: { 
        countdownTime: 3, 
        resetTime: 60, 
        eventName: 'Photo Booth Event',
        captureMode: 'photo',
        customJourneyEnabled: false,
        journeyConfig: []
      }, 
      eventUrl: null 
    };
  }
}

export default async function EventPage({ params }: { params: Promise<{ urlPath: string }> }) {
  // 🚨 CRITICAL DEBUGGING SECTION
  const { urlPath } = await params;
  const pageRenderTime = new Date().toISOString();
  const pageRenderTimestamp = Date.now();
  
  console.log(`[EVENT PAGE] 🚨 CRITICAL - PAGE COMPONENT EXECUTED for path: "${urlPath}" at ${pageRenderTime}`);
  console.log(`[EVENT PAGE] Component params:`, params);
  
  // Extra safety checks
  if (!params) {
    console.error(`[EVENT PAGE] ❌❌❌ NO PARAMS OBJECT PROVIDED`);
    return (
      <BoothLayout eventName="Error" showBranding={true}>
        <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 mb-4">
          <h1 className="text-xl font-bold">Critical Routing Error</h1>
          <p>No URL parameters were provided to the page component.</p>
          <p className="mt-2">Please contact support with this error message.</p>
          <div className="mt-4 p-4 bg-gray-100 text-gray-800 rounded overflow-auto">
            <pre>Error: No params object</pre>
            <pre>Timestamp: {pageRenderTime}</pre>
          </div>
        </div>
      </BoothLayout>
    );
  }
  
  const renderTimestamp = new Date().toISOString();
  console.log(`[EVENT PAGE] 🚀 Rendering for URL path: "${urlPath}" at ${renderTimestamp}`);
  
  // Get event settings - wrap in try/catch for additional robustness
  let settings, eventUrl, isInactive;
  try {
    const result = await getEventSettings(urlPath);
    settings = result.settings;
    eventUrl = result.eventUrl;
    isInactive = result.isInactive;
  } catch (error) {
    console.error(`[EVENT PAGE] ❌ CRITICAL ERROR getting event settings:`, error);
    
    return (
      <BoothLayout eventName="Error" showBranding={true}>
        <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 mb-4">
          <h1 className="text-xl font-bold">Server Error</h1>
          <p>An error occurred while fetching event settings.</p>
          <p className="mt-2">Please try again later or contact support.</p>
          <div className="mt-4 p-4 bg-gray-100 text-gray-800 rounded overflow-auto">
            <pre>Error: {error instanceof Error ? error.message : String(error)}</pre>
            <pre>URL path: {urlPath}</pre>
            <pre>Timestamp: {renderTimestamp}</pre>
          </div>
        </div>
      </BoothLayout>
    );
  }
  
  // If event URL not found, display error page instead of redirecting
  if (!eventUrl) {
    console.error(`[EVENT PAGE] ❌ EVENT URL NOT FOUND: "${urlPath}"`);
    
    return (
      <BoothLayout eventName="Not Found" showBranding={true}>
        <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 mb-4">
          <h1 className="text-xl font-bold">Event URL Not Found</h1>
          <p>The event URL "{urlPath}" does not exist.</p>
          <div className="mt-4 p-4 bg-gray-100 text-gray-800 rounded overflow-auto">
            <pre>URL path: {urlPath}</pre>
            <pre>Timestamp: {renderTimestamp}</pre>
          </div>
          <div className="mt-4">
            <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Return to Home
            </a>
          </div>
        </div>
      </BoothLayout>
    );
  }
  
  // If event URL is inactive, show inactive page instead of redirecting
  if (isInactive) {
    console.log(`[EVENT PAGE] ⚠️ Showing inactive page for URL: ${eventUrl.id}`);
    return (
      <BoothLayout 
        eventName={settings.eventName || "Event Unavailable"}
        showBranding={true}
      >
        <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md bg-white p-8 rounded-lg shadow-lg text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Event Unavailable</h1>
            <p className="text-gray-700 mb-6">
              This event URL is currently inactive. Please contact the event organizer
              for more information.
            </p>
            <div className="mb-6 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
              <p>Event ID: {eventUrl.id}</p>
              <p>URL: {urlPath}</p>
              <p>Created: {new Date(eventUrl.createdAt).toLocaleString()}</p>
            </div>
            <a 
              href="/"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </a>
          </div>
        </div>
      </BoothLayout>
    );
  }
  
  console.log(`[EVENT PAGE] ✅ Successfully loaded settings for URL: "${urlPath}" (ID: ${eventUrl.id})`);
  
  // Get theme settings for this user
  const themeSettings = await getThemeSettings();
  
  // Parse journey config from JSON if it exists - use our utility function for consistent handling
  const journeyPages = safeParseJson(settings.journeyConfig, []);
  
  // Log journey pages count
  console.log(`[EVENT PAGE] ✅ Retrieved ${journeyPages.length} journey pages.`);

  // Log important settings for debugging
  console.log('[EVENT PAGE] 🎯 Key booth settings for rendering:', {
    eventName: settings.eventName,
    captureMode: settings.captureMode || 'photo',
    customJourneyEnabled: Boolean(settings.customJourneyEnabled),
    journeyPagesCount: journeyPages.length,
    activeJourneyId: settings.activeJourneyId || 'none'
  });
  
  // Create a development flag to show/hide the debug panel
  const isDevelopment = process.env.NODE_ENV === 'development';

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
        
        {/* Server-side debug panel */}
        <DebugPanelWrapper
          urlPath={urlPath}
          userId={settings.userId || ''}
          eventUrlId={eventUrl.id}
          customJourneyEnabled={!!settings.customJourneyEnabled}
          captureMode={(settings.captureMode || 'photo') as 'photo' | 'video'}
          journeyPagesCount={journeyPages.length}
          activeJourneyId={settings.activeJourneyId || null}
          lastUpdated={settings.lastUpdated}
          renderTimestamp={renderTimestamp}
        />
        
        {/* Pass settings as serialized props */}
        <div id="client-wrapper-container" 
          data-url-path={urlPath}
          data-user-id={settings.userId || ''}
          data-event-url-id={eventUrl.id}
          data-settings={JSON.stringify(settings)}
          data-page-render-time={pageRenderTime}
          data-page-render-timestamp={pageRenderTimestamp}
          data-debug-time-now={Date.now()}
        ></div>
        
        <PhotoBooth
          countdownSeconds={settings.countdownTime || 3}
          resetTimeSeconds={settings.resetTime || 60}
          themeSettings={{
            primaryColor: themeSettings?.primaryColor || settings.primaryColor || '#3B82F6',
            secondaryColor: themeSettings?.secondaryColor || '#1E40AF',
            backgroundColor: themeSettings?.backgroundColor || '#ffffff',
            borderColor: themeSettings?.borderColor || '#e5e7eb',
            buttonColor: themeSettings?.buttonColor || '#3B82F6',
            textColor: themeSettings?.textColor || '#111827',
          }}
          customJourneyEnabled={Boolean(settings.customJourneyEnabled)}
          journeyPages={journeyPages}
          splashPageEnabled={Boolean(settings.splashPageEnabled)}
          splashPageTitle={settings.splashPageTitle || 'Welcome to Our Photo Booth'}
          splashPageContent={settings.splashPageContent || 'Get ready for a fun photo experience!'}
          splashPageImage={settings.splashPageImage}
          splashPageButtonText={settings.splashPageButtonText || 'Start'}
          captureMode={(settings.captureMode || 'photo') as 'photo' | 'video'}
          photoOrientation={settings.photoOrientation || 'portrait-standard'}
          photoResolution={settings.photoResolution || 'medium'}
          photoEffect={settings.photoEffect || 'none'}
          videoOrientation={settings.videoOrientation || 'portrait-standard'}
          videoResolution={settings.videoResolution || 'medium'}
          videoEffect={settings.videoEffect || 'none'}
          videoDuration={settings.videoDuration || 10}
          printerEnabled={Boolean(settings.printerEnabled)}
          aiImageCorrection={Boolean(settings.aiImageCorrection)}
          filtersEnabled={Boolean(settings.filtersEnabled)}
          enabledFilters={settings.enabledFilters}
          eventUrlId={eventUrl.id}
        />
        
        {/* Add hidden debug information for troubleshooting */}
        <div style={{ display: 'none' }} id="debug-info">
          <div>Page Render Time: {pageRenderTime}</div>
          <div>Server captureMode: {settings.captureMode}</div>
          <div>Server customJourneyEnabled: {String(settings.customJourneyEnabled)}</div>
          <div>Data Timestamp: {settings.fetchTimestamp}</div>
        </div>
      </div>
      {process.env.NODE_ENV !== 'production' && (
        <div className="fixed bottom-2 right-2 z-50 opacity-50 hover:opacity-100">
          <Link 
            href={`/e/${urlPath}/debug`}
            className="text-xs bg-gray-800 text-white px-2 py-1 rounded"
          >
            Debug Settings
          </Link>
        </div>
      )}
    </BoothLayout>
  );
} 