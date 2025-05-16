import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
  params: { username: string };
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const username = params.username;
  
  // Get the current user session
  const session = await getServerSession(authOptions);
  
  // If user is not authenticated, redirect to login
  if (!session?.user) {
    return redirect(`/login?callbackUrl=/u/${username}/admin`);
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
      {/* Admin Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <Link href={`/u/${username}`} className="text-lg font-semibold text-blue-600">
            Account Dashboard
          </Link>
        </div>
        
        <nav className="mt-4">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Admin
          </div>
          
          <Link 
            href={`/u/${username}/admin`} 
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            <span className="mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </span>
            Dashboard
          </Link>
          
          <Link 
            href={`/u/${username}/admin/event-urls`} 
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            <span className="mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
            </span>
            Event URLs
          </Link>
          
          <Link 
            href={`/u/${username}/admin/sessions`} 
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            <span className="mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </span>
            Sessions
          </Link>
          
          <Link 
            href={`/u/${username}/admin/settings`} 
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            <span className="mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </span>
            Settings
          </Link>
          
          {(authUser.role === 'ADMIN' || authUser.role === 'SUPER_ADMIN') && (
            <>
              <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Global Admin
              </div>
              
              <Link 
                href="/admin/users" 
                className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100"
              >
                <span className="mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </span>
                Users
              </Link>
              
              <Link 
                href="/admin/analytics" 
                className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100"
              >
                <span className="mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </span>
                Analytics
              </Link>
            </>
          )}
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
} 