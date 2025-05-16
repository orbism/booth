import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

interface SettingsLayoutProps {
  children: React.ReactNode;
  params: { username: string };
}

export default async function SettingsLayout({
  children,
  params,
}: SettingsLayoutProps) {
  const username = params.username;
  
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
    <div className="flex min-h-screen bg-gray-100">
      {/* Settings Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold text-gray-800">
            User Settings
          </h1>
        </div>
        
        <nav className="mt-4">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Settings
          </div>
          
          <Link 
            href={`/u/${username}/settings`} 
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            <span className="mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </span>
            Settings
          </Link>
          
          <Link 
            href={`/u/${username}/admin`} 
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            <span className="mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </span>
            Admin Dashboard
          </Link>
          
          <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Navigation
          </div>
          
          <Link 
            href="/pricing" 
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            <span className="mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </span>
            Subscription Plans
          </Link>
          
          <Link 
            href="/support" 
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            <span className="mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </span>
            Support
          </Link>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
} 