'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AdminProtectionProps {
  children: React.ReactNode;
}

/**
 * Client-side admin route protection component
 * 
 * This component adds a second layer of protection beyond middleware to ensure
 * only ADMIN users can access admin pages. It serves as a fallback in case middleware
 * protection fails for any reason.
 */
export default function AdminProtection({ children }: AdminProtectionProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Check admin access on client side
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        console.log('[AdminProtection] Redirecting non-admin user to forbidden page');
        router.push('/forbidden');
      }
    } else if (status === 'unauthenticated') {
      // Redirect to login if not authenticated
      console.log('[AdminProtection] Redirecting unauthenticated user to login');
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  // Only render children if authenticated and admin
  if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
    return <>{children}</>;
  }

  // Show a temporary loading state for other cases (will redirect soon)
  return <LoadingSpinner />;
} 