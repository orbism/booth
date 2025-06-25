'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { FiDownload, FiMail, FiTrash, FiEye } from 'react-icons/fi';
import { useToast } from '@/context/ToastContext';
import { getUserRoute } from '@/lib/route-utils';

type BoothSession = {
  id: string;
  userName: string;
  userEmail: string;
  photoPath: string; // This corresponds to mediaUrl
  createdAt: string;
  shared: boolean;
  emailSent: boolean; // This determines the status
  templateUsed: string | null;
  eventName: string | null;
  mediaType: string | null;
  filter: string | null;
  eventUrlId: string | null;
  eventUrlPath: string | null;
  urlPath: string | null; // From joined EventUrl table
  eventUrlName: string | null; // From joined EventUrl table
};

export default function AdminSessionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<BoothSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<'delete' | 'email' | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    fetchSessions();
  }, [status, router, page, limit, username]);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use the username from the route for admin to filter sessions for a specific user
      const response = await fetch(`/api/user/sessions?page=${page}&limit=${limit}&username=${encodeURIComponent(username)}`);

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check for specific error types and provide helpful messages
        if (response.status === 401) {
          throw new Error('You need to be logged in to view sessions');
        } else if (response.status === 403) {
          throw new Error(errorData.error || 'You do not have permission to view these sessions');
        } else if (response.status === 404) {
          throw new Error('User not found');
        } else {
          throw new Error(errorData.error || 'Failed to fetch booth sessions');
        }
      }

      const data = await response.json();
      
      // Check if we got valid data structure
      if (!data.success) {
        throw new Error(data.error || 'Invalid response from server');
      }
      
      // Update state with the fetched sessions
      setSessions(data.sessions || []);
      
      // Calculate total pages from pagination data
      const totalCount = data.pagination?.totalCount || 0;
      setTotalPages(Math.ceil(totalCount / limit) || 1);
    } catch (err) {
      console.error('Error fetching booth sessions:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      setSelectedSessionId(id);
      setActionInProgress('delete');
      setError(null);

      const response = await fetch(`/api/user/sessions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete session');
      }

      await fetchSessions();
      showToast('Session deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting session:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      showToast(err instanceof Error ? err.message : 'Failed to delete session', 'error');
    } finally {
      setSelectedSessionId(null);
      setActionInProgress(null);
    }
  };

  const resendEmail = async (id: string) => {
    try {
      setSelectedSessionId(id);
      setActionInProgress('email');
      setError(null);

      const response = await fetch(`/api/user/sessions/${id}/email`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend email');
      }

      await fetchSessions();
      showToast('Email sent successfully', 'success');
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      showToast(err instanceof Error ? err.message : 'Failed to send email', 'error');
    } finally {
      setSelectedSessionId(null);
      setActionInProgress(null);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSessionStatus = (session: BoothSession): 'complete' | 'incomplete' | 'error' => {
    if (session.emailSent) return 'complete';
    return 'incomplete';
  };

  // Helper function to determine the media type from file path
  const getMediaType = (path: string | null): 'photo' | 'video' | 'unknown' => {
    if (!path) return 'unknown';
    const lowerPath = path.toLowerCase();
    if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg') || lowerPath.endsWith('.png')) {
      return 'photo';
    }
    if (lowerPath.endsWith('.mp4') || lowerPath.endsWith('.webm')) {
      return 'video';
    }
    return 'unknown';
  };

  // Add a function to render content based on state
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          <span className="ml-2">Loading sessions...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                <button 
                  onClick={fetchSessions} 
                  className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-xs"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (sessions.length === 0) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <svg className="h-12 w-12 text-blue-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-blue-900 mb-2">No sessions found</h3>
          <p className="text-blue-600 mb-4">
            There are no booth sessions available for this user yet.
          </p>
          <p className="text-blue-500 text-sm">
            Sessions will appear here after users interact with your booth.
          </p>
        </div>
      );
    }

    // Return the sessions table when we have data
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event URL
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((boothSession) => (
                <tr key={boothSession.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {boothSession.urlPath || boothSession.eventUrlPath || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(boothSession.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      boothSession.emailSent 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {boothSession.emailSent ? 'complete' : 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {boothSession.userEmail ? (
                      <div>
                        <span className="block">{boothSession.userEmail}</span>
                        <span className="text-xs text-gray-500">
                          {boothSession.emailSent ? 'Email sent' : 'Not sent yet'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {boothSession.photoPath && (
                        <a
                          href={boothSession.photoPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Media"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </a>
                      )}
                      
                      {boothSession.photoPath && (
                        <a
                          href={boothSession.photoPath}
                          download
                          className="text-green-600 hover:text-green-900"
                          title="Download Media"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      )}
                      
                      {boothSession.userEmail && (
                        <button
                          onClick={() => resendEmail(boothSession.id)}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          title="Resend Email"
                          disabled={actionInProgress === 'email' && selectedSessionId === boothSession.id}
                        >
                          {actionInProgress === 'email' && selectedSessionId === boothSession.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteSession(boothSession.id)}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Delete Session"
                        disabled={actionInProgress === 'delete' && selectedSessionId === boothSession.id}
                      >
                        {actionInProgress === 'delete' && selectedSessionId === boothSession.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination controls */}
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{sessions.length}</span> of{' '}
                <span className="font-medium">{totalPages * limit}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    page === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    page === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Booth Sessions</h1>
      
      {renderContent()}
      
      {/* Only show pagination when we have sessions */}
      {sessions.length > 0 && (
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className={`px-4 py-2 rounded ${
              page === 1
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Previous
          </button>
          <span className="self-center">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={page >= totalPages}
            className={`px-4 py-2 rounded ${
              page >= totalPages
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
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