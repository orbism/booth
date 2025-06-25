'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { FiPlusCircle, FiTrash, FiLink, FiEye } from 'react-icons/fi';
import { useToast } from '@/context/ToastContext';

type EventUrl = {
  id: string;
  urlPath: string;
  userId: string;
  eventName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sessionsCount?: number;
};

export default function AdminEventUrlsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { showToast } = useToast();
  const [eventUrls, setEventUrls] = useState<EventUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedUrlId, setSelectedUrlId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    fetchEventUrls();
  }, [status, router, username]);

  const fetchEventUrls = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // For admin view, fetch specific user event URLs by username
      const response = await fetch(`/api/user/event-urls?username=${encodeURIComponent(username)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch event URLs');
      }

      const data = await response.json();
      
      // Check if we got valid data structure
      if (!data.success) {
        throw new Error(data.error || 'Invalid response from server');
      }
      
      setEventUrls(data.eventUrls || []);
    } catch (err) {
      console.error('Error fetching event URLs:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const createEventUrl = async () => {
    if (!newUrl.trim()) {
      showToast('Please enter a URL', 'error');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch('/api/user/event-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          urlPath: newUrl.trim(), 
          eventName: newUrl.trim(),
          isActive: true 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event URL');
      }

      await fetchEventUrls();
      setNewUrl('');
      showToast('Event URL created successfully', 'success');
    } catch (err) {
      console.error('Error creating event URL:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      showToast(err instanceof Error ? err.message : 'Failed to create event URL', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteEventUrl = async (id: string) => {
    try {
      setIsDeleting(true);
      setSelectedUrlId(id);
      setError(null);

      console.log(`[CLIENT] Starting deletion of event URL ${id} for username ${username}`);
      
      // Add a delay to ensure any database operations have time to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // First attempt - try with username param first since that's the most likely to work
      console.log(`[CLIENT] First attempt - with username param: ${username}`);
      let response = await fetch(`/api/user/event-urls/${id}?username=${username}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        console.error('[CLIENT] Failed to parse JSON response:', e);
      }

      // If first attempt fails, try without username param
      if (!response.ok) {
        console.error('[CLIENT] First deletion attempt failed:', responseData);
        
        // Try again without username parameter
        console.log(`[CLIENT] Second attempt - without username parameter`);
        response = await fetch(`/api/user/event-urls/${id}`, {
          method: 'DELETE',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        try {
          responseData = await response.json();
        } catch (e) {
          console.error('[CLIENT] Failed to parse JSON response (second attempt):', e);
        }
      }

      if (!response.ok) {
        console.error('[CLIENT] Second deletion attempt failed:', responseData);
        
        // Final attempt - try the direct endpoint
        console.log(`[CLIENT] Final attempt - using direct endpoint`);
        response = await fetch(`/api/event-urls/${id}`, {
          method: 'DELETE',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        try {
          responseData = await response.json();
        } catch (e) {
          console.error('[CLIENT] Failed to parse JSON response (final attempt):', e);
        }
        
        if (!response.ok) {
          console.error('[CLIENT] All deletion attempts failed. Final error:', responseData);
          throw new Error(responseData?.error || `Failed to delete event URL: ${response.status} ${response.statusText}`);
        }
      }

      console.log('[CLIENT] Event URL deleted successfully');
      await fetchEventUrls();
      showToast('Event URL deleted successfully', 'success');
    } catch (err) {
      console.error('[CLIENT] Error deleting event URL:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      showToast(err instanceof Error ? err.message : 'Failed to delete event URL', 'error');
    } finally {
      setIsDeleting(false);
      setSelectedUrlId(null);
    }
  };

  const copyUrlToClipboard = (urlPath: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/e/${urlPath}`);
    showToast('URL copied to clipboard', 'success');
  };

  const previewBooth = (urlPath: string) => {
    window.open(`/e/${urlPath}`, '_blank');
  };

  if (isLoading && eventUrls.length === 0) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event URLs</h1>
          <p className="text-gray-600">
            Manage custom event URLs for {username}
          </p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <a 
            href="/api/debug/test-url-routing"
            target="_blank"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <path d="M20.8 14.2L16 19.5H4a2 2 0 0 1-2-2v-7.8L8.5 13l4.1-3.1 8.2 4.3z"></path>
            </svg>
            Test URL Routing
          </a>
        </div>
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

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Create New Event URL</h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Enter a unique event name (e.g., company-event-2023)"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isCreating}
            />
          </div>
          <button
            onClick={createEventUrl}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-blue-600"
            disabled={isCreating || !newUrl.trim()}
          >
            {isCreating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FiPlusCircle className="h-5 w-5" />
            )}
            Create URL
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Note: URLs can only contain lowercase letters, numbers, and hyphens. No spaces or special characters.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Event URLs for {username}</h2>
        </div>

        {eventUrls.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No event URLs have been created yet.</p>
            <p className="mt-2 text-sm text-gray-400">
              Create a unique URL to share the photo booth with event attendees.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {eventUrls.map((eventUrl) => (
              <li key={eventUrl.id} className="flex items-center justify-between p-6 hover:bg-gray-50">
                <div>
                  <h3 className="font-medium">{eventUrl.urlPath}</h3>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(eventUrl.createdAt).toLocaleDateString()}
                    {eventUrl.sessionsCount !== undefined && (
                      <span className="ml-3">
                        Sessions: <span className="font-medium">{eventUrl.sessionsCount}</span>
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyUrlToClipboard(eventUrl.urlPath)}
                    className="p-2 text-gray-500 hover:text-blue-600"
                    title="Copy URL"
                  >
                    <FiLink className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => previewBooth(eventUrl.urlPath)}
                    className="p-2 text-gray-500 hover:text-green-600"
                    title="Preview Booth"
                  >
                    <FiEye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => window.open(`/api/debug/url-check?urlPath=${eventUrl.urlPath}`, '_blank')}
                    className="p-2 text-gray-500 hover:text-purple-600"
                    title="Test URL Access"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <path d="M15 3h6v6"></path>
                      <path d="M10 14L21 3"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteEventUrl(eventUrl.id)}
                    className="p-2 text-gray-500 hover:text-red-600"
                    title="Delete URL"
                    disabled={isDeleting && selectedUrlId === eventUrl.id}
                  >
                    {isDeleting && selectedUrlId === eventUrl.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                    ) : (
                      <FiTrash className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 