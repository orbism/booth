import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from '@/auth.config';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import ErrorComponent from '@/components/ErrorComponent';
import { prisma } from '@/lib/prisma';

export default async function CustomerAnalyticsDashboard({
  params
}: {
  params: Promise<{ username: string }>
}) {
  // Get the current session
  const session = await getServerSession(authOptions);
  
  // If not logged in, redirect to login
  if (!session || !session.user) {
    redirect('/login');
  }
  
  // Await the params object to access the username property
  const { username } = await params;
  
  try {
    // Get the customer user record by username or email
    const user = await prisma.user.findFirst({
      where: { 
        // Use email as fallback for finding users
        email: username
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    // If the user doesn't exist, show error
    if (!user) {
      return <ErrorComponent message="User not found" />;
    }
    
    // If the logged-in user is not the customer user, show error
    if (session.user.email !== user.email) {
      return <ErrorComponent message="You don't have permission to view this analytics dashboard" />;
    }
    
    // Render the analytics dashboard component with the user ID
    return (
      <div className="bg-white shadow-md rounded-md p-6 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Analyze session engagement and user behavior for your events
          </p>
        </div>
        
        <div className="mb-6 flex items-center space-x-4">
          <Link
            href={`/u/${username}/sessions`}
            className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
          >
            <span>View Booth Sessions</span>
          </Link>
        </div>
        
        {/* Pass the customer user ID to the analytics dashboard */}
        <AnalyticsDashboard userId={user.id} isCustomerView={true} />
      </div>
    );
  } catch (error) {
    console.error("Error loading customer analytics dashboard:", error);
    return <ErrorComponent message="Failed to load analytics dashboard" />;
  }
} 