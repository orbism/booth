import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SettingsSyncTest from '@/components/tests/SettingsSyncTest';

/**
 * Settings Sync Test Page
 * This page is used for testing the settings synchronization implementation
 */
export default async function SettingsSyncTestPage() {
  // Get the current session
  const session = await getServerSession(authOptions);
  
  // Redirect if not authenticated
  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }
  
  // Extract user ID from session
  const userId = session.user.id;
  
  // Get the first active event URL for this user using raw query to avoid linter issues
  const eventUrlResults = await prisma.$queryRaw`
    SELECT urlPath FROM EventUrl 
    WHERE userId = ${userId} AND isActive = 1
    LIMIT 1
  `;
  
  // Extract URL path from results if any
  const urlPath = Array.isArray(eventUrlResults) && eventUrlResults.length > 0
    ? (eventUrlResults[0] as { urlPath: string }).urlPath
    : '';
  
  return (
    <div className="container mx-auto py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-2">Settings Sync Test</h1>
        <p className="text-gray-600 mb-6">
          This page tests the synchronization between user settings and booth settings
        </p>
        
        {/* Test Details */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-700">Test Information</h2>
          <ul className="list-disc ml-5 mt-2">
            <li><strong>User ID:</strong> {userId}</li>
            <li><strong>Event URL:</strong> {urlPath || 'No active event URL found'}</li>
            <li><strong>Role:</strong> {session.user.role}</li>
          </ul>
        </div>
        
        {/* Settings Sync Test Component */}
        <SettingsSyncTest userId={userId} urlPath={urlPath} />
      </div>
    </div>
  );
} 