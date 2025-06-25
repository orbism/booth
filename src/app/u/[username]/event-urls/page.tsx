'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiPlusCircle, FiTrash, FiLink, FiEye } from 'react-icons/fi';
import { useToast } from '@/context/ToastContext';

type EventUrl = {
  id: string;
  urlPath: string;
  userId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  sessionsCount?: number;
};

export default function CustomerEventUrlsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [eventUrls, setEventUrls] = useState<EventUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [eventName, setEventName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedUrlId, setSelectedUrlId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    fetchEventUrls();
  }, [status, router]);

  const fetchEventUrls = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user/event-urls');

      if (!response.ok) {
        throw new Error('Failed to fetch event URLs');
      }

      const data = await response.json();
      setEventUrls(Array.isArray(data) ? data : (data.eventUrls || []));
    } catch (err) {
      console.error('Error fetching event URLs:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const createEventUrl = async () => {
    if (!newUrl.trim()) {
      showToast('Please enter a URL path', 'error');
      return;
    }

    if (!eventName.trim()) {
      showToast('Please enter an event name', 'error');
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
          urlPath: newUrl.trim().toLowerCase(), 
          eventName: eventName.trim(),
          isActive: true 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event URL');
      }

      await fetchEventUrls();
      setNewUrl('');
      setEventName('');
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

      const response = await fetch(`/api/user/event-urls/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event URL');
      }

      await fetchEventUrls();
      showToast('Event URL deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting event URL:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      showToast(err instanceof Error ? err.message : 'Failed to delete event URL', 'error');
    } finally {
      setIsDeleting(false);
      setSelectedUrlId(null);
    }
  };

  const copyUrlToClipboard = (url: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/booth/${url}`);
    showToast('URL copied to clipboard', 'success');
  };

  const previewBooth = (url: string) => {
    window.open(`/booth/${url}`, '_blank');
  };

  if (isLoading && eventUrls.length === 0) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Event URLs</h1>
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
        
        <div className="mb-4">
          <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
          <input
            id="event-name"
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Annual Company Retreat 2023"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isCreating}
          />
          <p className="text-xs text-gray-500 mt-1">
            This is the display name for your event
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="url-path" className="block text-sm font-medium text-gray-700 mb-1">URL Path</label>
            <div className="flex items-center">
              <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-md px-3 py-2 text-gray-500">
                {window.location.origin}/e/
              </span>
              <input
                id="url-path"
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value.replace(/[^a-z0-9-]/g, '-').toLowerCase())}
                placeholder="your-event-name"
                className="w-full px-4 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isCreating}
                pattern="[a-z0-9-]+"
                title="Only lowercase letters, numbers, and hyphens are allowed"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={createEventUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-blue-600"
              disabled={isCreating || !newUrl.trim() || !eventName.trim()}
            >
              {isCreating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <FiPlusCircle className="h-5 w-5" />
              )}
              Create URL
            </button>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            <strong>Requirements:</strong> Only lowercase letters, numbers, and hyphens. No spaces or special characters.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Example: "company-event-2023" will create a booth at {window.location.origin}/e/company-event-2023
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Your Event URLs</h2>
        </div>

        {eventUrls.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">You haven't created any event URLs yet.</p>
            <p className="mt-2 text-sm text-gray-400">
              Create a unique URL to share your photo booth with your event attendees.
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