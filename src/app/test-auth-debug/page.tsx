'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthDebugPage() {
  const { data: session, status, update } = useSession();
  const [isClient, setIsClient] = useState(false);
  const [middlewareLog, setMiddlewareLog] = useState<any[]>([]);
  const [isDevMode, setIsDevMode] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Only run in client
  useEffect(() => {
    setIsClient(true);
    setIsDevMode(process.env.NODE_ENV === 'development');
    
    // Check for middleware logs in local storage (if previously stored)
    const storedLogs = localStorage.getItem('middlewareDebugLogs');
    if (storedLogs) {
      try {
        setMiddlewareLog(JSON.parse(storedLogs));
      } catch (e) {
        console.error('Failed to parse stored middleware logs');
      }
    }
  }, []);

  // Production mode warning
  if (isClient && !isDevMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-red-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-center mb-4">Debug Page Not Available</h1>
          <p className="text-gray-600 mb-6">This debugging tool is only available in development mode for security reasons.</p>
          <div className="flex justify-center">
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Testing the middleware with different routes
  const testMiddleware = async (route: string) => {
    try {
      // Use fetch to trigger the middleware
      const response = await fetch(route, { 
        method: 'HEAD',
        redirect: 'manual'
      });
      
      // Add this test to the middleware log
      const logEntry = {
        timestamp: new Date().toISOString(),
        route,
        status: response.status,
        redirected: response.redirected,
        responseURL: response.url || 'No redirect',
        userRole: session?.user?.role || 'Not authenticated'
      };
      
      const updatedLogs = [logEntry, ...middlewareLog.slice(0, 9)]; // Keep last 10 entries
      setMiddlewareLog(updatedLogs);
      
      // Store in localStorage for persistence
      localStorage.setItem('middlewareDebugLogs', JSON.stringify(updatedLogs));
      
      // Open the route in a new tab
      window.open(route, '_blank');
    } catch (error) {
      console.error(`Error testing middleware for route ${route}:`, error);
    }
  };

  // Loading state
  if (status === 'loading' || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This is a debugging tool for development only. It helps diagnose authentication and middleware issues.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Authentication Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Authentication Status</h2>
            <div className="space-y-2">
              <p>
                <span className="font-semibold">Status:</span> 
                <span className={`ml-2 ${status === 'authenticated' ? 'text-green-600' : 'text-red-600'}`}>
                  {status}
                </span>
              </p>
              {session?.user && (
                <>
                  <p><span className="font-semibold">Email:</span> <span className="ml-2">{session.user.email}</span></p>
                  <p><span className="font-semibold">Role:</span> <span className="ml-2 font-mono bg-gray-100 px-1 rounded">{session.user.role}</span></p>
                  {session.user.name && (
                    <p><span className="font-semibold">Name:</span> <span className="ml-2">{session.user.name}</span></p>
                  )}
                  {session.user.id && (
                    <p><span className="font-semibold">ID:</span> <span className="ml-2 font-mono text-xs">{session.user.id}</span></p>
                  )}
                </>
              )}
            </div>
            <div className="mt-6 flex space-x-3">
              {status === 'authenticated' ? (
                <button 
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Sign Out
                </button>
              ) : (
                <button 
                  onClick={() => router.push('/login')}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Sign In
                </button>
              )}
              
              <button 
                onClick={() => update()}
                className="px-3 py-2 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300"
              >
                Refresh Session
              </button>
            </div>
          </div>
          
          {/* Middleware Test Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Test Middleware Routes</h2>
            <p className="text-sm text-gray-600 mb-4">
              Click on these routes to test if the middleware correctly handles authentication and authorization.
            </p>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => testMiddleware('/admin')}
                  className="px-3 py-2 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200"
                >
                  Admin Dashboard
                </button>
                <button 
                  onClick={() => testMiddleware('/admin/users')}
                  className="px-3 py-2 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200"
                >
                  Admin Users
                </button>
                <button 
                  onClick={() => testMiddleware('/admin/settings')}
                  className="px-3 py-2 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200"
                >
                  Admin Settings
                </button>
                <button 
                  onClick={() => testMiddleware('/api/admin/users')}
                  className="px-3 py-2 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200"
                >
                  API Admin Users
                </button>
                {/* Only show user admin button if we can determine a username */}
                {session?.user?.email && (
                  <button 
                    onClick={async () => {
                      try {
                        // Get username from email if available
                        const email = session.user.email || '';
                        const response = await fetch(`/api/auth/get-username?email=${encodeURIComponent(email)}`);
                        const data = await response.json();
                        if (data.username) {
                          testMiddleware(`/u/${data.username}/admin`);
                        } else {
                          alert('No username found for your account');
                        }
                      } catch (error) {
                        console.error('Error getting username:', error);
                        alert('Error getting username');
                      }
                    }}
                    className="px-3 py-2 bg-green-100 text-green-800 text-sm rounded hover:bg-green-200"
                  >
                    Your User Admin
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Current Route Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Current Route Information</h2>
            <div className="space-y-2">
              <p><span className="font-semibold">Current Path:</span> <code className="ml-2 bg-gray-100 px-1 py-0.5 rounded text-sm">{pathname}</code></p>
              <p><span className="font-semibold">Development Mode:</span> <span className="ml-2">{isDevMode ? 'Yes' : 'No'}</span></p>
              <p><span className="font-semibold">Middleware Debugging:</span> <span className="ml-2">{process.env.NEXT_PUBLIC_DEBUG_MIDDLEWARE === 'true' ? 'Enabled' : 'Disabled'}</span></p>
            </div>
          </div>
          
          {/* Middleware Test Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Middleware Test Results</h2>
            {middlewareLog.length === 0 ? (
              <p className="text-gray-500 italic">No middleware tests run yet. Click on the test buttons to see results.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2">Route</th>
                      <th className="text-left pb-2">Status</th>
                      <th className="text-left pb-2">Redirected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {middlewareLog.map((log, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 pr-4">
                          <code className="text-xs">{log.route}</code>
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            log.status >= 200 && log.status < 300 ? 'bg-green-100 text-green-800' : 
                            log.status >= 300 && log.status < 400 ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2">
                          {log.redirected ? (
                            <span className="text-xs font-mono text-blue-600 break-all">{log.responseURL}</span>
                          ) : (
                            <span className="text-xs text-gray-500">No redirect</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4">
              <button
                onClick={() => {
                  setMiddlewareLog([]);
                  localStorage.removeItem('middlewareDebugLogs');
                }}
                className="px-3 py-1 text-xs text-gray-600 hover:text-red-600"
              >
                Clear Results
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 