'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BoothSession {
  id: string;
  userName: string;
  userEmail: string;
  photoPath: string;
  createdAt: string;
  shared: boolean;
  emailSent: boolean;
  templateUsed?: string;
  eventName?: string;
  mediaType?: string;
  filter?: string;
  eventUrlId?: string;
  eventUrlPath?: string;
  urlPath?: string;
  eventUrlName?: string;
}

interface Pagination {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function UserSessionsPage({ params }: { params: { username: string } }) {
  const { username } = params;
  const [sessions, setSessions] = useState<BoothSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    totalCount: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  
  // Session deletion
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<BoothSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Session preview
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewSession, setPreviewSession] = useState<BoothSession | null>(null);
  
  // Filtering
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [eventUrlIdFilter, setEventUrlIdFilter] = useState<string>('');
  
  // Load sessions on component mount and when filters change
  useEffect(() => {
    fetchSessions(pagination.page);
  }, [pagination.page, mediaTypeFilter, startDate, endDate, eventUrlIdFilter]);
  
  // Fetch sessions from the API
  const fetchSessions = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    
    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      limit: pagination.limit.toString(),
    });
    
    if (mediaTypeFilter) {
      params.append('mediaType', mediaTypeFilter);
    }
    
    if (startDate && endDate) {
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    }
    
    if (eventUrlIdFilter) {
      params.append('eventUrlId', eventUrlIdFilter);
    }
    
    try {
      const response = await fetch(`/api/user/sessions?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.status}`);
      }
      
      setSessions(data.sessions || []);
      setPagination(data.pagination || {
        totalCount: 0,
        page,
        limit: pagination.limit,
        totalPages: 0,
      });
    } catch (err) {
      setError(`Failed to fetch sessions: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a session
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/user/sessions/${sessionToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Error: ${response.status}`);
      }
      
      // Remove the session from the list
      setSessions(sessions.filter(s => s.id !== sessionToDelete.id));
      
      // Close the modal
      setIsDeleteModalOpen(false);
      setSessionToDelete(null);
    } catch (err) {
      setError(`Failed to delete session: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error deleting session:', err);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions(1); // Reset to first page when filters change
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setMediaTypeFilter('');
    setStartDate('');
    setEndDate('');
    setEventUrlIdFilter('');
    fetchSessions(1);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Get media type label
  const getMediaTypeLabel = (mediaType?: string) => {
    if (!mediaType) return 'Photo';
    return mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
  };
  
  // Generate pagination controls
  const renderPagination = () => {
    const pages = [];
    
    // Previous button
    pages.push(
      <button
        key="prev"
        onClick={() => fetchSessions(pagination.page - 1)}
        disabled={pagination.page === 1}
        className={`px-3 py-1 rounded-md ${
          pagination.page === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-blue-600 hover:bg-blue-100'
        }`}
      >
        Previous
      </button>
    );
    
    // Page numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
      // Show first, last, and pages around current page
      if (
        i === 1 ||
        i === pagination.totalPages ||
        (i >= pagination.page - 1 && i <= pagination.page + 1)
      ) {
        pages.push(
          <button
            key={i}
            onClick={() => fetchSessions(i)}
            className={`px-3 py-1 rounded-md ${
              pagination.page === i
                ? 'bg-blue-600 text-white'
                : 'text-blue-600 hover:bg-blue-100'
            }`}
          >
            {i}
          </button>
        );
      } else if (
        (i === 2 && pagination.page > 3) ||
        (i === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)
      ) {
        // Add ellipsis
        pages.push(
          <span key={i} className="px-3 py-1">
            ...
          </span>
        );
      }
    }
    
    // Next button
    pages.push(
      <button
        key="next"
        onClick={() => fetchSessions(pagination.page + 1)}
        disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
        className={`px-3 py-1 rounded-md ${
          pagination.page === pagination.totalPages || pagination.totalPages === 0
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-blue-600 hover:bg-blue-100'
        }`}
      >
        Next
      </button>
    );
    
    return pages;
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Booth Sessions</h1>
        <p className="text-gray-600">View and manage your photo booth sessions</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* Filter Form */}
      <div className="bg-white shadow-md rounded-lg mb-6 p-4">
        <h2 className="text-lg font-medium mb-4">Filter Sessions</h2>
        <form onSubmit={handleFilterChange} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="mediaType" className="block text-sm font-medium text-gray-700 mb-1">
              Media Type
            </label>
            <select
              id="mediaType"
              value={mediaTypeFilter}
              onChange={(e) => setMediaTypeFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="photo">Photos</option>
              <option value="video">Videos</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="flex items-end space-x-2">
            <button
              type="submit"
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-100 focus:outline-none"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900">No Sessions Found</h3>
          <p className="mt-2 text-gray-600">
            No sessions match your current filters.
          </p>
          {(mediaTypeFilter || startDate || endDate || eventUrlIdFilter) && (
            <button
              onClick={handleResetFilters}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Media
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 relative">
                            {session.photoPath && (
                              <div 
                                className="h-10 w-10 bg-gray-200 rounded overflow-hidden cursor-pointer"
                                onClick={() => {
                                  setPreviewSession(session);
                                  setIsPreviewModalOpen(true);
                                }}
                              >
                                <img 
                                  src={session.photoPath} 
                                  alt="Preview" 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {getMediaTypeLabel(session.mediaType)}
                            </div>
                            {session.filter && session.filter !== 'normal' && (
                              <div className="text-xs text-gray-500">
                                Filter: {session.filter}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{session.userName}</div>
                        <div className="text-sm text-gray-500">{session.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(session.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {session.eventUrlName || session.eventName || 'Default Event'}
                        </div>
                        {session.urlPath && (
                          <div className="text-xs text-blue-500">
                            <Link href={`/e/${session.urlPath}`} target="_blank">
                              /e/{session.urlPath}
                            </Link>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${session.emailSent ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {session.emailSent ? 'Email Sent' : 'No Email'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${session.shared ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {session.shared ? 'Shared' : 'Not Shared'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setPreviewSession(session);
                            setIsPreviewModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSessionToDelete(session);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <div className="flex space-x-1">{renderPagination()}</div>
            </div>
          )}
        </>
      )}
      
      {/* Session Preview Modal */}
      {isPreviewModalOpen && previewSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Session Details</h2>
              <button
                onClick={() => {
                  setIsPreviewModalOpen(false);
                  setPreviewSession(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {previewSession.photoPath && (
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={previewSession.photoPath} 
                      alt="Session media" 
                      className="w-full h-auto"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Session Information</h3>
                
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">{formatDate(previewSession.createdAt)}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="text-sm text-gray-900">{getMediaTypeLabel(previewSession.mediaType)}</dd>
                  </div>
                  
                  {previewSession.filter && previewSession.filter !== 'normal' && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Filter</dt>
                      <dd className="text-sm text-gray-900">{previewSession.filter}</dd>
                    </div>
                  )}
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User</dt>
                    <dd className="text-sm text-gray-900">{previewSession.userName}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{previewSession.userEmail}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Event</dt>
                    <dd className="text-sm text-gray-900">{previewSession.eventUrlName || previewSession.eventName || 'Default Event'}</dd>
                  </div>
                  
                  {previewSession.urlPath && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Event URL</dt>
                      <dd className="text-sm text-blue-600">
                        <Link href={`/e/${previewSession.urlPath}`} target="_blank">
                          /e/{previewSession.urlPath}
                        </Link>
                      </dd>
                    </div>
                  )}
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${previewSession.emailSent ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} mr-2`}>
                        {previewSession.emailSent ? 'Email Sent' : 'No Email'}
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${previewSession.shared ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {previewSession.shared ? 'Shared' : 'Not Shared'}
                      </span>
                    </dd>
                  </div>
                </dl>
                
                <div className="mt-6 flex space-x-3">
                  <a
                    href={previewSession.photoPath}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Download
                  </a>
                  
                  <button
                    onClick={() => {
                      setIsPreviewModalOpen(false);
                      setPreviewSession(null);
                      setSessionToDelete(previewSession);
                      setIsDeleteModalOpen(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && sessionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Delete Session</h2>
            <p className="mb-6">
              Are you sure you want to delete this session from {sessionToDelete.userName}? This action cannot be undone, and the media will be permanently removed.
            </p>
            
            <div className="flex justify-end">
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSessionToDelete(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
                onClick={handleDeleteSession}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 