import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

interface SettingsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}

export default async function SettingsLayout({
  children,
  params,
}: SettingsLayoutProps) {
  // Await params to get the username
  const { username } = await params;
  
  // Get the current user session
  const session = await getServerSession(authOptions);
  
  // If user is not authenticated, redirect to login
  if (!session?.user) {
    return redirect(`/login?callbackUrl=/u/${username}/settings`);
  }
  
  // Get the authenticated user's details from the database
  const user = await prisma.$queryRaw`
    SELECT id, username, email, role
    FROM User
    WHERE email = ${session.user.email}
  `;
  
  const authUser = Array.isArray(user) && user.length > 0 
    ? user[0] 
    : null;
  
  // If user not found in database, redirect to login
  if (!authUser) {
    return redirect('/login');
  }
  
  // Check if the URL username matches the authenticated user's username
  // or if the user is an admin (can access any user's pages)
  const isAuthorized = 
    username === authUser.username || 
    authUser.role === 'ADMIN' || 
    authUser.role === 'SUPER_ADMIN';
  
  // If not authorized to view this user's page, redirect to forbidden
  if (!isAuthorized) {
    return redirect('/forbidden');
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account preferences</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings navigation sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <nav className="p-3">
              <div className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Profile Settings
              </div>
              
              <Link 
                href={`/u/${username}/settings/profile`}
                className="flex items-center px-3 py-2 text-sm rounded-md mt-1 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <span className="mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </span>
                Account Details
              </Link>
              
              <Link 
                href={`/u/${username}/settings/security`}
                className="flex items-center px-3 py-2 text-sm rounded-md mt-1 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <span className="mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
                Security
              </Link>
              
              <div className="py-2 px-3 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Booth Settings
              </div>
              
              <Link 
                href={`/u/${username}/admin/settings`}
                className="flex items-center px-3 py-2 text-sm rounded-md mt-1 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <span className="mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </span>
                Booth Settings
              </Link>
              
              <Link 
                href={`/u/${username}/admin/event-urls`}
                className="flex items-center px-3 py-2 text-sm rounded-md mt-1 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <span className="mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                </span>
                Event URLs
              </Link>
            </nav>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          <div className="bg-white shadow-md rounded-lg p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 