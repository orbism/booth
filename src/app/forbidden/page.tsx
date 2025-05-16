'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ForbiddenPage() {
  const router = useRouter();

  useEffect(() => {
    // Log the unauthorized access attempt (optional)
    console.error('Forbidden access attempt');
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-full p-4 w-20 h-20 flex items-center justify-center mx-auto">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-10 w-10 text-red-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>
        
        <p className="text-lg text-gray-600">
          You don't have permission to access this page. Please log in with the appropriate account or contact your administrator.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button 
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            onClick={() => router.push('/')}
          >
            Return Home
          </button>
          
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={() => router.push('/login')}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
} 