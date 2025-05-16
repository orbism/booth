import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

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
}

export default async function UserAdminDashboard({ 
  params 
}: { 
  params: { username: string } 
}) {
  const { username } = params;
  
  // Get the user session
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>Not authenticated</p>
      </div>
    );
  }
  
  // Get user profile
  const userResult = await prisma.$queryRaw`
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.username, 
      u.role,
      s.tier as subscriptionTier,
      s.status as subscriptionStatus
    FROM User u
    LEFT JOIN Subscription s ON u.id = s.userId
    WHERE u.email = ${session.user.email}
    LIMIT 1
  `;
  
  const profile = Array.isArray(userResult) && userResult.length > 0 
    ? {
        ...userResult[0],
        subscription: {
          tier: userResult[0].subscriptionTier || 'FREE',
          status: userResult[0].subscriptionStatus || 'Active'
        }
      }
    : null;
  
  if (!profile) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>User profile not found</p>
      </div>
    );
  }
  
  // Get session count
  const sessionCountResult = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM BoothSession WHERE userId = ${profile.id}
  `;
  const totalSessions = Array.isArray(sessionCountResult) && sessionCountResult.length > 0 
    ? Number(sessionCountResult[0].count)
    : 0;
  
  // Get event URL count
  const eventUrlCountResult = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM EventUrl WHERE userId = ${profile.id}
  `;
  const totalEventUrls = Array.isArray(eventUrlCountResult) && eventUrlCountResult.length > 0 
    ? Number(eventUrlCountResult[0].count)
    : 0;
  
  // Get recent sessions
  const recentSessionsResult = await prisma.$queryRaw`
    SELECT 
      id, 
      userName, 
      createdAt, 
      mediaType,
      photoPath
    FROM BoothSession 
    WHERE userId = ${profile.id} 
    ORDER BY createdAt DESC 
    LIMIT 3
  `;
  
  const recentSessions = Array.isArray(recentSessionsResult) 
    ? recentSessionsResult.map((session: any) => ({
        id: session.id,
        userName: session.userName,
        photoPath: session.photoPath || 'https://placehold.co/100x100',
        createdAt: session.createdAt,
        mediaType: session.mediaType || 'photo',
      }))
    : [];
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your booth sessions and event URLs</p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sessions</p>
              <h3 className="text-3xl font-bold">{totalSessions}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href={`/u/${username}/admin/sessions`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all sessions →
            </Link>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Event URLs</p>
              <h3 className="text-3xl font-bold">{totalEventUrls}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href={`/u/${username}/admin/event-urls`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Manage event URLs →
            </Link>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Subscription</p>
              <h3 className="text-xl font-bold">{profile.subscription.tier}</h3>
              <p className="text-sm text-gray-500">{profile.subscription.status}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/pricing" className="text-sm text-blue-600 hover:text-blue-800">
              Upgrade plan →
            </Link>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href={`/u/${username}/admin/event-urls`}
            className="p-4 border border-gray-200 rounded-lg flex items-center hover:bg-gray-50"
          >
            <div className="mr-3 p-2 bg-blue-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium">New Event URL</p>
            </div>
          </Link>
          
          <Link 
            href={`/u/${username}/admin/settings`}
            className="p-4 border border-gray-200 rounded-lg flex items-center hover:bg-gray-50"
          >
            <div className="mr-3 p-2 bg-green-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Settings</p>
            </div>
          </Link>
          
          <Link 
            href={`/api/auth/signout`}
            className="p-4 border border-gray-200 rounded-lg flex items-center hover:bg-gray-50"
          >
            <div className="mr-3 p-2 bg-red-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 2.414A1 1 0 0010.707 2H4a1 1 0 00-1 1zm9 2.5a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v7a.5.5 0 01-.5.5h-4a.5.5 0 01-.5-.5v-7zm-7 7a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-4a.5.5 0 01-.5-.5v-2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Sign Out</p>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Sessions</h2>
            <Link 
              href={`/u/${username}/admin/sessions`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>
          
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
                        href={`/u/${username}/admin/sessions`}
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
        </div>
      )}
    </div>
  );
} 