import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { getAnalyticsSummary } from '@/lib/analytics';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';

export const metadata = {
  title: 'Admin Dashboard - BoothBoss',
  description: 'Manage your photo booth sessions',
};

// Define an interface that reflects the schema of your boothSession model.
// Adjust the property types if your database schema differs.
interface PhotoSession {
  id: string;
  photoPath: string;
  userName: string;
  userEmail: string;
  createdAt: Date;
  emailSent: boolean;
  mediaType: string | null;
  filter: string | null;
  shared: boolean;
  templateUsed: string | null;
  eventName: string | null;
  userId: string | null;
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  // Explicitly type recentSessions as an array of PhotoSession objects.
  const recentSessions: PhotoSession[] = await prisma.boothSession.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  // TODO - pass number of days for analytics summary here, eg. `(7)` for a week.
  const analytics = await getAnalyticsSummary();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Photo Sessions</h2>
        
        {recentSessions.length === 0 ? (
          <p className="text-gray-500">No photo sessions yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSessions.map((item: PhotoSession) => (
              <div key={item.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="aspect-video relative">
                  <div className="relative w-full h-full">
                    {item.mediaType === 'video' ? (
                      <video 
                        src={item.photoPath} 
                        className="object-cover w-full h-full rounded"
                        controls
                        muted
                        playsInline
                      />
                    ) : (
                      <OptimizedImage 
                        src={item.photoPath} 
                        alt={`Media by ${item.userName}`}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-medium">{item.userName}</p>
                  <p className="text-gray-600 text-sm">{item.userEmail}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.emailSent ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.emailSent ? 'Email Sent' : 'Email Pending'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Analytics Overview</h2>
          <Link href="/admin/analytics" className="text-blue-600 hover:underline text-sm">
            View Full Analytics →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-500 text-sm">Total Sessions</p>
            <p className="text-2xl font-semibold">{analytics?.totalSessions || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-500 text-sm">Completed</p>
            <p className="text-2xl font-semibold">{analytics?.completedSessions || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-500 text-sm">Completion Rate</p>
            <p className="text-2xl font-semibold">{analytics?.completionRate || 0}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-500 text-sm">Avg. Time</p>
            <p className="text-2xl font-semibold">
              {((analytics?.averageCompletionTimeMs || 0) / 1000).toFixed(1)}s
            </p>
          </div>
        </div>
      </section>
      
    </div>
  );
}
