// src/app/not-found.tsx
"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';

export default function NotFound() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const session = await getSession();
        // If not logged in as admin, redirect to home
        if (!session) {
          router.push('/');
        }
        setIsChecking(false);
      } catch (error) {
        console.error('Error checking session:', error);
        setIsChecking(false);
      }
    }

    checkSession();
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <h2 className="text-2xl font-bold text-gray-700 mt-4">Page Not Found</h2>
        <p className="text-gray-500 mt-2">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 space-y-3">
          <Link href="/" className="block w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Go back to app
          </Link>
          <Link href="/admin" className="block w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}