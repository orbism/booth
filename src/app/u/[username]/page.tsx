import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

// Disable caching for this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getUserDetails(username: string) {
  try {
    // Using raw SQL to avoid TypeScript issues
    const users = await prisma.$queryRaw`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.username, 
        u.role,
        u.organizationName,
        u.onboardingCompleted,
        u.createdAt,
        u.emailVerified,
        s.tier as subscriptionTier,
        s.status as subscriptionStatus,
        s.endDate as subscriptionEndDate,
        s.maxMedia,
        s.maxEmails,
        s.customDomain,
        s.analyticsAccess,
        s.filterAccess,
        s.videoAccess,
        s.brandingRemoval,
        COUNT(e.id) as eventUrlCount,
        COUNT(b.id) as boothSessionCount
      FROM User u
      LEFT JOIN Subscription s ON u.id = s.userId
      LEFT JOIN EventUrl e ON u.id = e.userId
      LEFT JOIN BoothSession b ON u.id = b.userId
      WHERE u.username = ${username}
      GROUP BY u.id, s.id
      LIMIT 1
    `;
    
    if (!Array.isArray(users) || users.length === 0) {
      return null;
    }
    
    return users[0];
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
}

export default async function UserAccountPage({ params }: { params: { username: string } }) {
  // Get the current user session
  const session = await getServerSession(authOptions);
  
  // Redirect to login if not authenticated
  if (!session?.user) {
    return redirect('/login?callbackUrl=/u/' + params.username);
  }
  
  // Get the authenticated user's details from the database
  const userResult = await prisma.$queryRaw`
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.username, 
      u.role,
      s.tier as subscriptionTier,
      s.status as subscriptionStatus,
      3 as maxEventUrls,
      1000 as maxSessions,
      s.maxEmails as maxEmails,
      s.endDate as subscriptionExpires
    FROM User u
    LEFT JOIN Subscription s ON u.id = s.userId
    WHERE u.email = ${session.user.email}
    LIMIT 1
  `;
  
  const user = Array.isArray(userResult) && userResult.length > 0 
    ? {
        ...userResult[0],
        subscription: {
          tier: userResult[0].subscriptionTier || 'FREE',
          status: userResult[0].subscriptionStatus || 'Active',
          expiresAt: userResult[0].subscriptionExpires
        }
      }
    : null;
  
  // If user not found in database, redirect to login
  if (!user) {
    return redirect('/login');
  }
  
  // Check if the URL username matches the authenticated user's username
  // or if the user is an admin (can access any user's pages)
  const isAuthorized = 
    params.username === user.username || 
    user.role === 'ADMIN' || 
    user.role === 'SUPER_ADMIN';
  
  // If not authorized to view this user's page, redirect to forbidden
  if (!isAuthorized) {
    return redirect('/forbidden');
  }
  
  // Get usage statistics for the user
  const sessionCountResult = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM BoothSession WHERE userId = ${user.id}
  `;
  const sessionCount = Array.isArray(sessionCountResult) && sessionCountResult.length > 0 
    ? Number(sessionCountResult[0].count)
    : 0;
  
  const eventUrlCountResult = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM EventUrl WHERE userId = ${user.id}
  `;
  const eventUrlCount = Array.isArray(eventUrlCountResult) && eventUrlCountResult.length > 0 
    ? Number(eventUrlCountResult[0].count)
    : 0;
  
  const emailSentCountResult = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM BoothSession WHERE userId = ${user.id} AND emailSent = true
  `;
  const emailSentCount = Array.isArray(emailSentCountResult) && emailSentCountResult.length > 0 
    ? Number(emailSentCountResult[0].count)
    : 0;
  
  // Get event URLs for the user to allow previewing the booth
  const eventUrlsResult = await prisma.$queryRaw`
    SELECT id, urlPath FROM EventUrl 
    WHERE userId = ${user.id}
    ORDER BY createdAt DESC
    LIMIT 1
  `;
  
  const firstEventUrl = Array.isArray(eventUrlsResult) && eventUrlsResult.length > 0 
    ? eventUrlsResult[0]
    : null;
  
  // Format numbers for display
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  
  // Calculate limits
  const maxEventUrls = user.maxEventUrls || 3;
  const maxSessions = user.maxSessions || 1000;
  const maxEmails = user.maxEmails || 100;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Account Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome, {user.name}!</p>
      </div>
      
      {/* Account overview */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Account Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">Username</div>
            <div className="font-medium">{user.username}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-500 mb-1">Email</div>
            <div className="font-medium">{user.email}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-500 mb-1">Role</div>
            <div className="font-medium">{user.role.replace('_', ' ')}</div>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between mb-2">
            <div className="text-sm text-gray-500">Subscription</div>
            <div className="text-sm">
              <span className={`px-2 py-1 rounded-full text-xs ${
                user.subscription.tier === 'PRO' 
                  ? 'bg-green-100 text-green-800'
                  : user.subscription.tier === 'PREMIUM' 
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user.subscription.tier}
              </span>
            </div>
          </div>
          
          {user.subscription.tier !== 'FREE' && user.subscription.expiresAt && (
            <div className="text-sm mb-2">
              Expires on {new Date(user.subscription.expiresAt).toLocaleDateString()}
            </div>
          )}
          
          <div className="mt-4">
            <Link 
              href="/pricing"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {user.subscription.tier === 'FREE' ? 'Upgrade your plan' : 'Manage subscription'}
            </Link>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <h2 className="text-xl font-semibold text-blue-800">Quick Actions</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href={`/u/${params.username}/admin/settings`}
            className="block p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Booth Settings</h3>
                <p className="text-sm text-gray-500">Configure your booth appearance</p>
              </div>
            </div>
          </a>
          
          <a
            href={`/u/${params.username}/admin/event-urls`}
            className="block p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Event URLs</h3>
                <p className="text-sm text-gray-500">Manage your booth URLs</p>
              </div>
            </div>
          </a>
          
          <a
            href={`/u/${params.username}/admin/sessions`}
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
          </a>
          
          <a
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
          </a>
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
          
          <div className="text-3xl font-bold mb-2">{formatNumber(eventUrlCount)}</div>
          <div className="text-sm text-gray-500 mb-4">of {formatNumber(maxEventUrls)} available</div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: `${Math.min((Number(eventUrlCount) / Number(maxEventUrls)) * 100, 100)}%` }}
            ></div>
          </div>
          
          <Link 
            href={`/u/${params.username}/admin/event-urls`}
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
          
          <div className="text-3xl font-bold mb-2">{formatNumber(sessionCount)}</div>
          <div className="text-sm text-gray-500 mb-4">of {formatNumber(maxSessions)} available</div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="h-full bg-green-500 rounded-full" 
              style={{ width: `${Math.min((Number(sessionCount) / Number(maxSessions)) * 100, 100)}%` }}
            ></div>
          </div>
          
          <Link 
            href={`/u/${params.username}/admin/sessions`}
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
              style={{ width: `${Math.min((Number(emailSentCount) / Number(maxEmails)) * 100, 100)}%` }}
            ></div>
          </div>
          
          <Link 
            href={`/u/${params.username}/admin/settings`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Configure email settings →
          </Link>
        </div>
      </div>
      
      {/* Recent activity and promotion for features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          
          {sessionCount > 0 ? (
            <div className="space-y-4">
              <p className="text-gray-500">You have {sessionCount} recorded photo/video sessions.</p>
              <Link 
                href={`/u/${params.username}/admin/sessions`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all sessions →
              </Link>
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
                href={`/u/${params.username}/admin/event-urls/new`}
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