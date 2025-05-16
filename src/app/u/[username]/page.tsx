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
      s.maxEventUrls as maxEventUrls,
      s.maxSessions as maxSessions,
      s.maxEmails as maxEmails,
      s.expiresAt as subscriptionExpires
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
              style={{ width: `${Math.min((eventUrlCount / maxEventUrls) * 100, 100)}%` }}
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
              style={{ width: `${Math.min((sessionCount / maxSessions) * 100, 100)}%` }}
            ></div>
          </div>
          
          <Link 
            href={`/u/${params.username}/admin/sessions`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View sessions →
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
            href={`/u/${params.username}/admin/settings`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Email settings →
          </Link>
        </div>
      </div>
      
      {/* Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href={`/u/${params.username}/admin`}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 flex items-center"
          >
            <div className="mr-3 p-2 bg-blue-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            </div>
            <div>
              <div className="font-medium">Admin Dashboard</div>
              <div className="text-sm text-gray-500">View booth stats and analytics</div>
            </div>
          </Link>
          
          <Link 
            href={`/u/${params.username}/admin/event-urls`}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 flex items-center"
          >
            <div className="mr-3 p-2 bg-green-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="font-medium">Create Event URL</div>
              <div className="text-sm text-gray-500">Set up a new photo booth</div>
            </div>
          </Link>
          
          <Link 
            href={`/u/${params.username}/admin/settings`}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 flex items-center"
          >
            <div className="mr-3 p-2 bg-purple-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="font-medium">Booth Settings</div>
              <div className="text-sm text-gray-500">Customize your photo booth</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 