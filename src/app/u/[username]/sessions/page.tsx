'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiDownload, FiMail, FiTrash, FiEye } from 'react-icons/fi';
import { useToast } from '@/context/ToastContext';

type BoothSession = {
  id: string;
  eventUrl: string | null;
  createdAt: string;
  mediaUrl: string | null;
  emailedTo: string | null;
  emailedAt: string | null;
  status: 'complete' | 'incomplete' | 'error';
};

export default function CustomerSessionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
  }, [status, router, page, limit]);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/user/sessions?page=${page}&limit=${limit}`);

      if (!response.ok) {
        throw new Error('Failed to fetch booth sessions');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
      setTotalPages(Math.ceil(data.total / limit) || 1);
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

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Booth Sessions</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No booth sessions found.</p>
          <p className="mt-2 text-sm text-gray-400">
            When attendees use your photo booth, their sessions will appear here.
          </p>
        </div>
      ) : (
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
                      {boothSession.eventUrl || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatDate(boothSession.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        boothSession.status === 'complete' 
                          ? 'bg-green-100 text-green-800' 
                          : boothSession.status === 'error' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {boothSession.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {boothSession.emailedTo ? (
                        <div>
                          <span className="block">{boothSession.emailedTo}</span>
                          <span className="text-xs text-gray-500">
                            {boothSession.emailedAt ? `Sent: ${formatDate(boothSession.emailedAt)}` : 'Not sent yet'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {boothSession.mediaUrl && (
                          <>
                            <a
                              href={boothSession.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-500 hover:text-blue-600"
                              title="Preview"
                            >
                              <FiEye className="h-5 w-5" />
                            </a>
                            <a
                              href={boothSession.mediaUrl}
                              download
                              className="p-2 text-gray-500 hover:text-green-600"
                              title="Download"
                            >
                              <FiDownload className="h-5 w-5" />
                            </a>
                          </>
                        )}
                        {boothSession.status === 'complete' && (
                          <button
                            onClick={() => resendEmail(boothSession.id)}
                            className="p-2 text-gray-500 hover:text-blue-600"
                            title="Resend Email"
                            disabled={actionInProgress === 'email' && selectedSessionId === boothSession.id}
                          >
                            {actionInProgress === 'email' && selectedSessionId === boothSession.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            ) : (
                              <FiMail className="h-5 w-5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => deleteSession(boothSession.id)}
                          className="p-2 text-gray-500 hover:text-red-600"
                          title="Delete Session"
                          disabled={actionInProgress === 'delete' && selectedSessionId === boothSession.id}
                        >
                          {actionInProgress === 'delete' && selectedSessionId === boothSession.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                          ) : (
                            <FiTrash className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  page === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * limit, sessions.length + (page - 1) * limit)}</span> of{' '}
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                        pageNum === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
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
      )}
    </div>
  );
} 