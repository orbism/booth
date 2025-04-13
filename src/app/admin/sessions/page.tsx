// src/app/admin/sessions/page.tsx

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'All Sessions - BoothBoss Admin',
  description: 'View all photo booth sessions',
};

interface PageProps {
  searchParams: {
    page?: string;
    limit?: string;
  };
}

// Define the expected structure of a photo session.
// Adjust the types if your underlying schema uses different types.
interface PhotoSession {
  id: string; // or number if that's how your Prisma model is defined
  photoPath: string;
  userName: string;
  userEmail: string;
  createdAt: Date;
  emailSent: boolean;
}

export default async function SessionsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  const currentPage = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 20;
  const skip = (currentPage - 1) * limit;
  
  // Tell TypeScript that the returned sessions match the PhotoSession interface.
  const sessions: PhotoSession[] = await prisma.boothSession.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: limit,
  });
  
  const totalCount = await prisma.boothSession.count();
  const totalPages = Math.ceil(totalCount / limit);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Photo Sessions</h1>
        <span className="text-sm text-gray-500">
          Total: {totalCount} sessions
        </span>
      </div>
      
      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <p className="text-gray-500">No photo sessions found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Photo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((item: PhotoSession) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-20 h-20 relative">
                      <img
                        src={item.photoPath}
                        alt={`Photo by ${item.userName}`}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.userName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.userEmail}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.emailSent
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.emailSent ? 'Email Sent' : 'Email Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <button
                className={`px-3 py-1 rounded ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
