'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserData {
  id: string;
  name: string;
  email: string;
  username: string;
  organizationName?: string;
  role: string;
  isAdmin: boolean;
}

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [refreshData, setRefreshData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/auth/user')
        .then(res => {
          if (!res.ok) throw new Error(`API returned ${res.status}`);
          return res.json();
        })
        .then(data => {
          setUserData(data.user);
          setApiResponse(JSON.stringify(data, null, 2));
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching user data:', err);
          setError(err.message || 'Failed to fetch user data');
          setIsLoading(false);
        });
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status]);

  const testRouteAccess = (route: string) => {
    router.push(route);
  };
  
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const checkAccess = (route: string) => {
    fetch(route, { method: 'HEAD' })
      .then(res => {
        if (res.redirected) {
          alert(`Redirected to: ${res.url}`);
        } else if (res.ok) {
          alert(`Access granted to ${route}`);
        } else {
          alert(`Access denied to ${route} - Status: ${res.status}`);
        }
      })
      .catch(err => {
        alert(`Error checking access: ${err.message}`);
      });
  };

  const refreshSession = async () => {
    try {
      const res = await fetch('/api/auth/refresh-session');
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      setRefreshData(data);
    } catch (err) {
      console.error('Error refreshing session:', err);
      alert(`Error refreshing session: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
        
        <div className="mb-6 p-4 bg-gray-100 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Session Status</h2>
          <p className="text-gray-700">
            Authentication Status: <span className="font-mono">{status}</span>
          </p>
          
          {session && (
            <div className="mt-2">
              <p className="text-gray-700">Session ID: <span className="font-mono">{session.user?.id}</span></p>
              <p className="text-gray-700">Session Role: <span className="font-mono">{session.user?.role}</span></p>
              <p className="text-gray-700">Session User: <span className="font-mono">{JSON.stringify(session.user, null, 2)}</span></p>
            </div>
          )}
          
          {refreshData && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
              <h3 className="font-medium text-yellow-800">Session vs Database Comparison</h3>
              <p className="mt-2 text-sm text-yellow-700">
                <strong>Current Session Role:</strong> {refreshData.currentSession.role}
              </p>
              <p className="mt-1 text-sm text-yellow-700">
                <strong>Database Role:</strong> {refreshData.databaseValue.role}
              </p>
              {refreshData.currentSession.role !== refreshData.databaseValue.role && (
                <div className="mt-2 p-2 bg-red-100 text-red-700 text-sm rounded">
                  <p><strong>Note:</strong> {refreshData.instructions}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex space-x-2 mt-4">
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </button>
            <button
              onClick={refreshSession}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Check Session vs Database
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-100 rounded-md">
          <h2 className="text-lg font-semibold mb-2">User Data</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : userData ? (
            <div className="space-y-2">
              <p className="text-gray-700">ID: <span className="font-mono">{userData.id}</span></p>
              <p className="text-gray-700">Name: <span className="font-mono">{userData.name}</span></p>
              <p className="text-gray-700">Email: <span className="font-mono">{userData.email}</span></p>
              <p className="text-gray-700">Username: <span className="font-mono">{userData.username}</span></p>
              {userData.organizationName && (
                <p className="text-gray-700">Organization: <span className="font-mono">{userData.organizationName}</span></p>
              )}
              <p className="text-gray-700">Role: <span className="font-mono">{userData.role}</span></p>
              <p className="text-gray-700">Is Admin: <span className="font-mono">{userData.isAdmin ? 'Yes' : 'No'}</span></p>
            </div>
          ) : (
            <p className="text-gray-700">No user data available. Please log in.</p>
          )}
          
          {apiResponse && (
            <div className="mt-4">
              <h3 className="text-md font-semibold">Full API Response:</h3>
              <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto mt-2 text-xs">
                {apiResponse}
              </pre>
            </div>
          )}
        </div>

        <div className="mb-6 p-4 bg-gray-100 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Test Route Protection</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <button
              onClick={() => testRouteAccess('/admin')}
              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test /admin access
            </button>
            
            <button
              onClick={() => testRouteAccess('/admin/settings')}
              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test /admin/settings access
            </button>
            
            <button
              onClick={() => checkAccess('/admin')}
              className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Check /admin access
            </button>
            
            <button
              onClick={() => checkAccess('/admin/settings')}
              className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Check /admin/settings access
            </button>
            
            {userData?.username && (
              <>
                <button
                  onClick={() => testRouteAccess(`/u/${userData.username}/admin`)}
                  className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Test your user admin access
                </button>
                
                <button
                  onClick={() => testRouteAccess(`/u/${userData.username}/admin/settings`)}
                  className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Test your user settings access
                </button>
                
                <button
                  onClick={() => checkAccess(`/u/${userData.username}/admin`)}
                  className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Check user admin access
                </button>
                
                <button
                  onClick={() => checkAccess(`/u/${userData.username}/admin/settings`)}
                  className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Check user settings access
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="text-sm text-gray-500 mt-6">
          <p>This page is for testing authentication status and route protection. Use the buttons above to test different routes.</p>
          <p className="mt-2"><strong>Blue buttons</strong>: Navigate to the route directly. <strong>Green buttons</strong>: Check access without navigating.</p>
        </div>
      </div>
    </div>
  );
} 