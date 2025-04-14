// src/app/admin/sessions/SessionsList.tsx
'use client';

import React from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface PhotoSession {
  id: string;
  photoPath: string;
  userName: string;
  userEmail: string;
  createdAt: Date;
  emailSent: boolean;
}

interface SessionsListProps {
  sessions: PhotoSession[];
  totalCount: number;
  currentPage: number;
  limit: number;
}

export default function SessionsListComponent({ 
  sessions, 
  totalCount, 
  currentPage, 
  limit 
}: SessionsListProps) {
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
                      <div className="relative w-full h-full">
                        <OptimizedImage
                          src={item.photoPath}
                          alt={`Photo by ${item.userName}`}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
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