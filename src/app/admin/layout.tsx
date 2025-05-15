// src/app/admin/layout.tsx
import React from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/auth.config';
import { Session } from 'next-auth';
import SessionProviderWrapper from '@/components/providers/SessionProviderWrapper';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check for session directly in the server component
  const session = await getServerSession(authOptions) as Session | null;

  // Redirect to login if no session is found
  if (!session) {
    redirect('/login');
  }
  
  return (
    <SessionProviderWrapper>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <div className="w-64 bg-blue-800 text-white p-6">
          <h1 className="text-xl font-bold mb-8">BoothBoss Admin</h1>
          
          <nav className="space-y-2">
            <Link href="/admin" className="block py-2 px-4 rounded hover:bg-blue-700">
              Dashboard
            </Link>
            <Link href="/admin/analytics" className="block py-2 px-4 rounded hover:bg-blue-700">
              Analytics
            </Link>
            <Link href="/admin/settings" className="block py-2 px-4 rounded hover:bg-blue-700">
              Settings
            </Link>
            <Link href="/admin/sessions" className="block py-2 px-4 rounded hover:bg-blue-700">
              All Sessions
            </Link>
            <Link href="/admin/users" className="block py-2 px-4 rounded hover:bg-blue-700">
              User Management
            </Link>
            <Link href="/admin/event-urls" className="block py-2 px-4 rounded hover:bg-blue-700">
              Event URLs
            </Link>
            
            {process.env.NODE_ENV === 'development' && (
              <Link href="/admin/email-preview" className="block py-2 px-4 rounded hover:bg-blue-700">
                Email Preview
              </Link>
            )}
            
            <div className="pt-4 mt-4 border-t border-blue-700">
              <Link href="/api/auth/signout" className="block py-2 px-4 rounded hover:bg-blue-700">
                Sign Out
              </Link>
            </div>
          </nav>
        </div>
        
        {/* Main content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </SessionProviderWrapper>
  );
}