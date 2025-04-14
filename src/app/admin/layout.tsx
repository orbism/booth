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
  const session = await getServerSession(authOptions) as Session | null;

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
            <div className="pt-4 mt-4 border-t border-blue-700">
              <Link href="/api/auth/signout" className="block py-2 px-4 rounded hover:bg-blue-700">
                Sign Out
              </Link>
            </div>
          </nav>
        </div>
        
        {/* Main content */}
        <div className="flex-1 bg-gray-50">
          <header className="bg-white shadow-sm p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Admin Panel</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {session.user?.name || session.user?.email}
              </span>
            </div>
          </header>
          
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </SessionProviderWrapper>
  );
}