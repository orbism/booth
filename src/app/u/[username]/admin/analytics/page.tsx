import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from '@/auth.config';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import ErrorComponent from '@/components/ErrorComponent';
import { getUserByIdentifier, hasUserAccess } from '@/lib/user-utils';

export default async function UserAdminAnalyticsDashboard({
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
    // Get user by username using our utility function
    const user = await getUserByIdentifier(username);
    
    // If the user doesn't exist, show error
    if (!user) {
      return <ErrorComponent message="User not found" />;
    }
    
    // Check if the logged-in user is authorized to view this dashboard
    const hasAccess = await hasUserAccess(
      session.user.id,
      user.id,
      session.user.role
    );
    
    if (!hasAccess) {
      return <ErrorComponent message="You don't have permission to view this analytics dashboard" />;
    }
    
    // Render the analytics dashboard component with the user ID
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Analyze booth session data, event engagement, and user interactions
          </p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Session Analytics</h2>
              <p className="text-gray-600">
                Track performance and engagement metrics for your booth sessions
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href={`/u/${username}/admin/sessions`}
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
              >
                <span>View Booth Sessions</span>
              </Link>
              
              <Link
                href={`/u/${username}/admin/event-urls`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                <span>Manage Event URLs</span>
              </Link>
            </div>
          </div>
          
          {/* Pass the user ID to the analytics dashboard */}
          <AnalyticsDashboard 
            userId={user.id} 
            isCustomerView={user.role !== 'ADMIN'} 
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading analytics dashboard:", error);
    return <ErrorComponent message="Failed to load analytics dashboard" />;
  }
} 