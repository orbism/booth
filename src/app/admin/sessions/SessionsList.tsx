// src/app/admin/sessions/SessionsList.tsx
'use client';

import React, { useState } from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface PhotoSession {
  id: string;
  photoPath: string;
  userName: string;
  userEmail: string;
  createdAt: Date;
  emailSent: boolean;
  mediaType?: string;
}

interface SessionsListProps {
  sessions: PhotoSession[];
  totalCount: number;
  currentPage: number;
  limit: number;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: { mediaType?: string; dateRange?: [Date, Date] }) => void;
}

export default function SessionsListComponent({ 
  sessions, 
  totalCount, 
  currentPage, 
  limit,
  onPageChange = () => {}, 
  onFilterChange = () => {}
}: SessionsListProps) {
  const totalPages = Math.ceil(totalCount / limit);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Media rendering function to properly handle photos vs videos
  const renderMedia = (item: PhotoSession, size: 'small' | 'large' = 'large') => {
    // Determine media type, either from mediaType field or by file extension
    const isVideo = item.mediaType === 'video' || 
                   item.photoPath?.endsWith('.webm') || 
                   item.photoPath?.endsWith('.mp4');
    
    if (isVideo) {
      return (
        <video
          src={item.photoPath}
          className={`object-cover w-full h-full rounded ${size === 'small' ? 'max-w-[80px] max-h-[80px]' : ''}`}
          controls
          muted
          preload="metadata"
        />
      );
    } else {
      return (
        <div className="relative w-full h-full">
          <OptimizedImage
            src={item.photoPath}
            alt={`Photo by ${item.userName}`}
            fill
            className="object-cover rounded"
          />
        </div>
      );
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Sessions</h1>
        <div className="flex items-center gap-4">
          <div className="bg-gray-100 p-1 rounded-md">
            <button 
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <span className="text-sm text-gray-500">
            Total: {totalCount} sessions
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label htmlFor="mediaTypeFilter" className="block text-sm text-gray-500 mb-1">Media Type</label>
          <select 
            id="mediaTypeFilter" 
            className="px-3 py-2 border border-gray-300 rounded-md"
            onChange={(e) => onFilterChange({ mediaType: e.target.value || undefined })}
          >
            <option value="">All Types</option>
            <option value="photo">Photos</option>
            <option value="video">Videos</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="startDate" className="block text-sm text-gray-500 mb-1">Date Range</label>
          <div className="flex gap-2 items-center">
            <input 
              type="date" 
              id="startDate" 
              className="px-3 py-2 border border-gray-300 rounded-md"
              onChange={(e) => {
                const startDate = e.target.value ? new Date(e.target.value) : undefined;
                const endDate = document.getElementById('endDate') as HTMLInputElement;
                if (startDate && endDate.value) {
                  onFilterChange({ 
                    dateRange: [startDate, new Date(endDate.value)]
                  });
                }
              }}
            />
            <span>to</span>
            <input 
              type="date" 
              id="endDate" 
              className="px-3 py-2 border border-gray-300 rounded-md"
              onChange={(e) => {
                const endDate = e.target.value ? new Date(e.target.value) : undefined;
                const startDate = document.getElementById('startDate') as HTMLInputElement;
                if (endDate && startDate.value) {
                  onFilterChange({ 
                    dateRange: [new Date(startDate.value), endDate]
                  });
                }
              }}
            />
          </div>
        </div>
      </div>
      
      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <p className="text-gray-500">No sessions found.</p>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sessions.map((item: PhotoSession) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-video relative">
                {renderMedia(item)}
              </div>
              <div className="p-3">
                <div className="font-medium text-sm">{item.userName}</div>
                <div className="text-xs text-gray-500">{item.userEmail}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.emailSent
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.emailSent ? 'Email Sent' : 'Email Pending'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.mediaType === 'video'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {item.mediaType === 'video' ? 'Video' : 'Photo'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Media
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
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
                      {renderMedia(item, 'small')}
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
                      item.mediaType === 'video'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {item.mediaType === 'video' ? 'Video' : 'Photo'}
                    </span>
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
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 mt-4 bg-white border border-gray-200 rounded-lg flex justify-between items-center">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => onPageChange(index + 1)}
                className={`w-8 h-8 flex items-center justify-center rounded ${
                  currentPage === index + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            )).slice(
              Math.max(0, Math.min(currentPage - 3, totalPages - 5)),
              Math.min(totalPages, Math.max(5, currentPage + 2))
            )}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="text-gray-500">...</span>
            )}
          </div>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}