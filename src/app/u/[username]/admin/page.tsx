import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { checkUsernameAccess } from "@/lib/auth-utils";
import { getUserRoute, getAdminRoute } from "@/lib/route-utils";

interface DashboardStats {
  totalSessions: number;
  totalEventUrls: number;
  recentSessions: {
    id: string;
    userName: string;
    photoPath: string;
    createdAt: string;
    mediaType: string;
  }[];
  sessionCount: number;
  maxSessions: number;
  eventUrlCount: number;
  maxEventUrls: number;
  emailSentCount: number;
  maxEmails: number;
  firstEventUrl: { urlPath: string } | null;
}

export default async function UserAdminDashboard({ 
  params 
}: { 
  params: Promise<{ username: string }> 
}) {
  const awaitedParams = await params;
  const username = awaitedParams.username;
  
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/api/auth/signin');
  }
  
  // Check if the current user has access to the requested username
  const hasAccess = await checkUsernameAccess(username);
  
  if (!hasAccess) {
    redirect('/api/auth/signin');
  }
  
  // Get the user profile using raw SQL since we're using Prisma in this project
  const userResult = await prisma.$queryRaw`
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.username, 
      u.role,
      u.emailsSent,
      s.tier as subscriptionTier,
      s.status as subscriptionStatus,
      s.maxMedia as maxSessions,
      s.maxEmails
    FROM User u
    LEFT JOIN Subscription s ON u.id = s.userId
    WHERE u.username = ${username}
    LIMIT 1
  `;
  
  const profile = Array.isArray(userResult) && userResult.length > 0 
    ? {
        ...userResult[0],
        subscription: {
          tier: userResult[0].subscriptionTier || 'FREE',
          status: userResult[0].subscriptionStatus || 'Active',
          maxEventUrls: 5, // Hardcoded default value since this field doesn't exist in the database
          maxSessions: userResult[0].maxSessions || 100,
          maxEmails: userResult[0].maxEmails || 1000
        }
      }
    : null;
  
  if (!profile) {
    redirect('/api/auth/signin');
  }
  
  // Count the total number of sessions
  const sessionCountResult = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM BoothSession WHERE userId = ${profile.id}
  `;
  
  const totalSessions = Array.isArray(sessionCountResult) && sessionCountResult.length > 0 
    ? Number(sessionCountResult[0].count)
    : 0;
  
  // Count the total number of event URLs
  const eventUrlCountResult = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM EventUrl WHERE userId = ${profile.id}
  `;
  
  const totalEventUrls = Array.isArray(eventUrlCountResult) && eventUrlCountResult.length > 0 
    ? Number(eventUrlCountResult[0].count)
    : 0;
  
  // Get recent sessions
  const recentSessionsData = await prisma.$queryRaw`
    SELECT 
      id, 
      userId,
      userName,
      photoPath,
      createdAt,
      mediaType
    FROM BoothSession
    WHERE userId = ${profile.id}
    ORDER BY createdAt DESC
    LIMIT 5
  `;
  
  // Format sessions data for display
  const recentSessions = Array.isArray(recentSessionsData) 
    ? recentSessionsData.map((session: any) => ({
        id: session.id,
        userName: session.userName || 'Anonymous',
        photoPath: session.photoPath || '/placeholder.jpg',
        createdAt: session.createdAt.toISOString(),
        mediaType: session.mediaType || 'photo',
      }))
    : [];

  // Get subscription limits
  const maxSessions = profile.subscription.maxSessions || 100;
  const maxEventUrls = profile.subscription.maxEventUrls || 5;
  const maxEmails = profile.subscription.maxEmails || 1000;
  const emailSentCount = profile.emailsSent || 0;

  // Get first event URL for preview booth feature
  const firstEventUrlResult = await prisma.$queryRaw`
    SELECT id, urlPath FROM EventUrl 
    WHERE userId = ${profile.id}
    ORDER BY createdAt DESC
    LIMIT 1
  `;
  
  const firstEventUrl = Array.isArray(firstEventUrlResult) && firstEventUrlResult.length > 0 
    ? firstEventUrlResult[0]
    : null;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your booth sessions and event URLs</p>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href={getAdminRoute(username, 'event-urls/new')}
            className="block p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">New Event URL</h3>
                <p className="text-sm text-gray-500">Create a new booth URL</p>
              </div>
            </div>
          </Link>
          
          <Link 
            href={getAdminRoute(username, 'sessions')}
            className="block p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Booth Sessions</h3>
                <p className="text-sm text-gray-500">View all captured booth sessions</p>
              </div>
            </div>
          </Link>
          
          <Link 
            href={firstEventUrl ? `/booth/${firstEventUrl.urlPath}` : `#`}
            target="_blank"
            rel="noopener noreferrer"
            className={`block p-4 bg-white border border-gray-100 rounded-lg shadow-sm ${firstEventUrl ? 'hover:shadow' : 'opacity-50 cursor-not-allowed'} transition-all`}
          >
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Preview Booth</h3>
                <p className="text-sm text-gray-500">{firstEventUrl ? 'See how your booth looks' : 'Create an event URL first'}</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Usage stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Event URLs</h3>
            <div className="p-2 bg-blue-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div className="text-3xl font-bold mb-2">{formatNumber(totalEventUrls)}</div>
          <div className="text-sm text-gray-500 mb-4">of {formatNumber(maxEventUrls)} available</div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: `${Math.min((totalEventUrls / maxEventUrls) * 100, 100)}%` }}
            ></div>
          </div>
          
          <Link 
            href={getAdminRoute(username, 'event-urls')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Manage event URLs →
          </Link>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Booth Sessions</h3>
            <div className="p-2 bg-green-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div className="text-3xl font-bold mb-2">{formatNumber(totalSessions)}</div>
          <div className="text-sm text-gray-500 mb-4">of {formatNumber(maxSessions)} available</div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="h-full bg-green-500 rounded-full" 
              style={{ width: `${Math.min((totalSessions / maxSessions) * 100, 100)}%` }}
            ></div>
          </div>
          
          <Link 
            href={getAdminRoute(username, 'sessions')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View booth sessions →
          </Link>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Emails Sent</h3>
            <div className="p-2 bg-purple-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
          </div>
          
          <div className="text-3xl font-bold mb-2">{formatNumber(emailSentCount)}</div>
          <div className="text-sm text-gray-500 mb-4">of {formatNumber(maxEmails)} available</div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="h-full bg-purple-500 rounded-full" 
              style={{ width: `${Math.min((emailSentCount / maxEmails) * 100, 100)}%` }}
            ></div>
          </div>
          
          <Link 
            href={getAdminRoute(username, 'settings')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Configure email settings →
          </Link>
        </div>
      </div>
      
      {/* Recent activity and promotion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Sessions</h2>
            <Link 
              href={getAdminRoute(username, 'sessions')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>
          
          {recentSessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentSessions.map((session) => (
                    <tr key={session.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full" 
                              src={session.photoPath} 
                              alt="" 
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {session.userName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${session.mediaType === 'photo' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {session.mediaType.charAt(0).toUpperCase() + session.mediaType.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(session.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          href={getAdminRoute(username, `sessions/${session.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-600 mb-2">No booth sessions yet</p>
              <p className="text-gray-500 text-sm mb-4">Create an event URL to get started</p>
              <Link 
                href={getAdminRoute(username, 'event-urls/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Event URL
              </Link>
            </div>
          )}
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 shadow rounded-lg p-6 text-white">
          <h2 className="text-lg font-semibold mb-6">Upgrade Your Plan</h2>
          <p className="mb-4">Unlock premium features and increase your limits.</p>
          
          <ul className="space-y-2 mb-6">
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>More event URLs</span>
            </li>
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Premium filters</span>
            </li>
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Custom journey builder</span>
            </li>
          </ul>
          
          <Link 
            href="/pricing"
            className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
          >
            View Plans
          </Link>
        </div>
      </div>
    </div>
  );
} 