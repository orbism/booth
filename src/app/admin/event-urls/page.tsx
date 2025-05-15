'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EventUrl {
  id: string;
  urlPath: string;
  eventName: string;
  isActive: boolean;
  createdAt: string;
  eventStartDate: string | null;
  eventEndDate: string | null;
}

export default function EventUrlsPage() {
  const router = useRouter();
  const [eventUrls, setEventUrls] = useState<EventUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [urlToDelete, setUrlToDelete] = useState<EventUrl | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [newUrl, setNewUrl] = useState({
    urlPath: '',
    eventName: '',
    isActive: true,
    eventStartDate: '',
    eventEndDate: '',
  });

  // Fetch event URLs
  const fetchEventUrls = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/event-urls');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setEventUrls(data.eventUrls || []);
    } catch (err) {
      setError(`Failed to fetch event URLs: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error fetching event URLs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchEventUrls();
  }, []);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setNewUrl({
      ...newUrl,
      [name]: val,
    });
  };

  // Handle form submission for new event URL
  const handleCreateUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      const response = await fetch('/api/event-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUrl),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setFormError(data.error || `Error: ${response.status}`);
        return;
      }
      
      // Success - close modal and refresh the list
      setIsCreateModalOpen(false);
      setNewUrl({
        urlPath: '',
        eventName: '',
        isActive: true,
        eventStartDate: '',
        eventEndDate: '',
      });
      
      fetchEventUrls();
    } catch (err) {
      setFormError(`Failed to create event URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error creating event URL:', err);
    }
  };

  // Handle delete confirmation
  const handleDeleteUrl = async () => {
    if (!urlToDelete) return;
    
    try {
      const response = await fetch(`/api/event-urls/${urlToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error: ${response.status}`);
      }
      
      // Remove the deleted URL from the list
      setEventUrls(eventUrls.filter(url => url.id !== urlToDelete.id));
      
      // Close the modal
      setIsDeleteModalOpen(false);
      setUrlToDelete(null);
    } catch (err) {
      setError(`Failed to delete event URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error deleting event URL:', err);
    }
  };

  // Handle toggling active status
  const handleToggleActive = async (url: EventUrl) => {
    try {
      const response = await fetch(`/api/event-urls/${url.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !url.isActive,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error: ${response.status}`);
      }
      
      // Update the URL status in the list
      setEventUrls(eventUrls.map(u => 
        u.id === url.id ? { ...u, isActive: !url.isActive } : u
      ));
    } catch (err) {
      setError(`Failed to update event URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error updating event URL:', err);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Event URLs</h1>
          <p className="text-gray-500">
            Manage your custom event URLs
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add New URL
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Event URLs Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {eventUrls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg 
                className="w-16 h-16 text-gray-400 mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="1.5" 
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="1.5" 
                  d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101"
                />
              </svg>
              <h2 className="text-xl font-semibold mb-2">No Event URLs Found</h2>
              <p className="text-gray-500 mb-6 text-center max-w-md">
                You haven't created any custom event URLs yet. Create one to get started.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Event URL
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL Path
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {eventUrls.map((url) => (
                    <tr key={url.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {url.eventName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <a 
                            href={`/e/${url.urlPath}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            /e/{url.urlPath}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            url.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {url.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(url.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(url)}
                            className={`${
                              url.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {url.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => {
                              setUrlToDelete(url);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                          <Link
                            href={`/admin/event-urls/${url.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create URL Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Create New Event URL</h3>
            
            {formError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{formError}</p>
              </div>
            )}
            
            <form onSubmit={handleCreateUrl}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Event Name *</label>
                <input
                  type="text"
                  name="eventName"
                  value={newUrl.eventName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Wedding Photo Booth"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">URL Path *</label>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-1">/e/</span>
                  <input
                    type="text"
                    name="urlPath"
                    value={newUrl.urlPath}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="my-event"
                    pattern="[a-z0-9-]+"
                    title="Only lowercase letters, numbers, and hyphens are allowed"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Only lowercase letters, numbers, and hyphens are allowed
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  name="eventStartDate"
                  value={newUrl.eventStartDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  name="eventEndDate"
                  value={newUrl.eventEndDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={newUrl.isActive}
                  onChange={(e) => setNewUrl({ ...newUrl, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label className="ml-2 text-sm font-medium">Active</label>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create URL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && urlToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete the event URL <strong>/e/{urlToDelete.urlPath}</strong>? This action cannot be undone.
            </p>
            <p className="mb-4 text-sm bg-yellow-50 p-2 rounded">
              Note: Any links to this URL will stop working and visitors will be redirected to your main booth.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUrlToDelete(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUrl}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 