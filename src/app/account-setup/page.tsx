"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AccountSetupWizard from '@/components/onboarding/AccountSetupWizard';

export default function AccountSetupPage() {
  const { data: session, status } = useSession();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    // If user is authenticated, check if email is verified
    if (status === 'authenticated' && session?.user) {
      // Check if email is verified by fetching user data
      async function checkEmailVerification() {
        try {
          const response = await fetch('/api/auth/user');
          const data = await response.json();
          
          if (response.ok) {
            // If email is verified and onboarding is already completed, redirect to dashboard
            if (data.emailVerified && data.onboardingCompleted) {
              router.push('/admin/dashboard');
              return;
            }
            
            // If email is verified but onboarding is not completed, allow setup
            if (data.emailVerified) {
              setIsVerified(true);
            } else {
              setIsVerified(false);
            }
          } else {
            console.error('Failed to fetch user data:', data.error);
            setIsVerified(false);
          }
        } catch (error) {
          console.error('Error checking email verification:', error);
          setIsVerified(false);
        } finally {
          setIsLoading(false);
        }
      }
      
      checkEmailVerification();
    }
  }, [session, status, router]);
  
  // Show loading state
  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="ml-2">Loading...</p>
      </div>
    );
  }
  
  // If email is not verified, show a message
  if (isVerified === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Email Verification Required</h1>
          
          <p className="text-gray-600 mb-6">
            Please verify your email before continuing with account setup. Check your inbox for a verification email.
          </p>
          
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }
  
  // If everything is good, show the account setup wizard
  return <AccountSetupWizard />;
} 