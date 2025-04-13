import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Admin Dashboard - BoothBoss',
  description: 'Manage your photo booth sessions',
};

// Define an interface that reflects the schema of your boothSession model.
// Adjust the property types if your database schema differs.
interface PhotoSession {
  id: string; // or number, depending on your Prisma model
  photoPath: string;
  userName: string;
  userEmail: string;
  createdAt: Date;
  emailSent: boolean;
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
                  <img 
                    src={item.photoPath} 
                    alt={`Photo by ${item.userName}`}
                    className="w-full h-full object-cover"
                  />
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
    </div>
  );
}
