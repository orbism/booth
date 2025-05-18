import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

export default async function UserLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  // Get the current user session
  const session = await getServerSession(authOptions);
  
  // Await the params to get the username
  const { username } = await params;
  
  // If user is not authenticated, redirect to login
  if (!session?.user) {
    return redirect('/login?callbackUrl=/u/' + username);
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
    <div>
      {/* User-specific layout wrapper */}
      {children}
    </div>
  );
} 