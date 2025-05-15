"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    async function verifyEmail() {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setStatus('error');
          setErrorMessage('Verification token is missing');
          return;
        }
        
        // Call the verify-email API
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        
        // Parse the JSON response
        const data = await response.json();
        
        if (response.ok && data.success) {
          setStatus('success');
          
          // Use setTimeout to give users a moment to see the success message
          setTimeout(() => {
            // Navigate to the success page
            router.push(data.redirectUrl || '/verify-success');
          }, 1000);
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Email verification failed');
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred');
      }
    }
    
    verifyEmail();
  }, [searchParams, router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
            <h1 className="text-2xl font-bold mb-4">Verifying your email...</h1>
            <p className="text-gray-600">
              Please wait while we verify your email address.
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-green-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4">Email Verified!</h1>
            <p className="text-gray-600 mb-6">
              Your email has been successfully verified. Redirecting you to continue...
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4">Verification Failed</h1>
            <p className="text-red-600 mb-6">
              {errorMessage || 'There was an error verifying your email address.'}
            </p>
            <div className="mb-4 space-y-3">
              <Link
                href="/login"
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
              >
                Go to Login
              </Link>
              <Link
                href="/register"
                className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition duration-200"
              >
                Register Again
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 