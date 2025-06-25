import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { getSettingsByUrlPath } from '@/lib/settings-service';

export default async function BoothDebugPage({ params }: { params: { urlPath: string } }) {
  const urlPath = params.urlPath;
  
  // Use raw SQL to find the event URL
  const eventUrlResults = await prisma.$queryRaw`
    SELECT * FROM EventUrl WHERE urlPath = ${urlPath} LIMIT 1
  `;
  
  const eventUrl = Array.isArray(eventUrlResults) && eventUrlResults.length > 0
    ? eventUrlResults[0] as any
    : null;
  
  if (!eventUrl) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Event URL Not Found</h1>
        <p className="text-red-600">No event URL found with path: {urlPath}</p>
        <div className="mt-4">
          <Link href="/test/check-settings" className="text-blue-600 hover:underline">
            Go to Settings Diagnostics
          </Link>
        </div>
      </div>
    );
  }
  
  // Get settings via service
  const settings = await getSettingsByUrlPath(urlPath) as any;
  
  // Look up raw settings with SQL
  const rawSettingsResults = await prisma.$queryRaw`
    SELECT * FROM Settings WHERE userId = ${eventUrl.userId} LIMIT 1
  `;
  
  const rawSettings = Array.isArray(rawSettingsResults) && rawSettingsResults.length > 0
    ? rawSettingsResults[0] as any
    : null;
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Booth Debug View: {urlPath}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Event URL</h2>
          <div className="bg-gray-50 p-4 rounded border">
            <div><strong>ID:</strong> {eventUrl.id}</div>
            <div><strong>URL Path:</strong> {eventUrl.urlPath}</div>
            <div><strong>User ID:</strong> {eventUrl.userId}</div>
            <div><strong>Event Name:</strong> {eventUrl.eventName}</div>
            <div><strong>Is Active:</strong> {eventUrl.isActive ? 'Yes' : 'No'}</div>
            <div><strong>Created:</strong> {new Date(eventUrl.createdAt).toLocaleString()}</div>
          </div>
          
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Diagnostic Tools</h2>
            <div className="space-y-2">
              <Link 
                href={`/test/diagnose?urlPath=${urlPath}`}
                className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
              >
                Run Settings Diagnostics
              </Link>
              <Link 
                href={`/test/check-settings?urlPath=${urlPath}`}
                className="block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center"
              >
                Check Database Settings
              </Link>
              <Link 
                href={`/e/${urlPath}`}
                className="block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-center"
              >
                Back to Booth
              </Link>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Settings via API
            {settings?.id?.startsWith('fallback') && (
              <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded">FALLBACK</span>
            )}
          </h2>
          
          {settings ? (
            <div className="bg-gray-50 p-4 rounded border">
              <div><strong>ID:</strong> {settings.id}</div>
              <div><strong>Event Name:</strong> {settings.eventName}</div>
              <div><strong>Capture Mode:</strong> {settings.captureMode}</div>
              <div>
                <strong>Custom Journey:</strong> {String(settings.customJourneyEnabled)} 
                <span className="text-gray-500 text-xs ml-1">({typeof settings.customJourneyEnabled})</span>
              </div>
              <div>
                <strong>Splash Page:</strong> {String(settings.splashPageEnabled)}
                <span className="text-gray-500 text-xs ml-1">({typeof settings.splashPageEnabled})</span>
              </div>
              <div>
                <strong>Show Booth Boss Logo:</strong> {String(settings.showBoothBossLogo)}
              </div>
              <div>
                <strong>Primary Color:</strong> <span style={{ color: settings.primaryColor }}>■</span> {settings.primaryColor}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded border border-red-200 text-red-600">
              No settings found via API
            </div>
          )}
          
          <h2 className="text-xl font-semibold mb-2 mt-6">Raw Database Settings</h2>
          {rawSettings ? (
            <div className="bg-gray-50 p-4 rounded border overflow-auto max-h-64">
              <pre className="text-xs">{JSON.stringify(rawSettings, null, 2)}</pre>
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded border border-red-200 text-red-600">
              No settings found in database
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">What to do when settings are missing</h2>
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <p>If you're seeing "Settings not found" errors:</p>
          <ol className="list-decimal ml-6 mt-2 space-y-2">
            <li>Go to the <Link href={`/test/check-settings?urlPath=${urlPath}`} className="text-blue-600 hover:underline">Check Settings</Link> page and verify if settings exist for this URL's owner.</li>
            <li>If settings don't exist, use the "Create Default Settings" button if you're an admin.</li>
            <li>If you're not an admin, ask the Customer to log in and configure settings from their dashboard.</li>
            <li>After creating settings, invalidate the cache and reload the booth page.</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 