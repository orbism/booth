'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface EventUrl {
  id: string;
  urlPath: string;
  eventName: string;
  isActive: boolean;
  eventStartDate: string | null;
  eventEndDate: string | null;
  createdAt: string;
}

interface EventUrlFormData {
  urlPath: string;
  eventName: string;
  isActive: boolean;
  eventStartDate: string;
  eventEndDate: string;
}

export default function UserEventUrlsPage({ params }: { params: { username: string } }) {
  const { username } = params;
  const [eventUrls, setEventUrls] = useState<EventUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState<EventUrlFormData>({
    urlPath: '',
    eventName: '',
    isActive: true,
    eventStartDate: '',
    eventEndDate: '',
  });
  const [editingUrl, setEditingUrl] = useState<EventUrl | null>(null);
  const [urlToDelete, setUrlToDelete] = useState<EventUrl | null>(null);
  
  // Fetch event URLs on component mount
  useEffect(() => {
    fetchEventUrls();
  }, []);
  
  // Fetch event URLs from the API
  const fetchEventUrls = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/event-urls');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.status}`);
      }
      
      setEventUrls(data.eventUrls || []);
    } catch (err) {
      setError(`Failed to fetch event URLs: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error fetching event URLs:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form submission for new event URL
  const handleCreateUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      const response = await fetch('/api/user/event-urls', {
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
  
  // Handle form submission for updating an event URL
  const handleUpdateUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!editingUrl) return;
    
    try {
      const response = await fetch(`/api/user/event-urls/${editingUrl.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urlPath: editingUrl.urlPath,
          eventName: editingUrl.eventName,
          isActive: editingUrl.isActive,
          eventStartDate: editingUrl.eventStartDate,
          eventEndDate: editingUrl.eventEndDate,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setFormError(data.error || `Error: ${response.status}`);
        return;
      }
      
      // Success - close modal and refresh the list
      setIsEditModalOpen(false);
      setEditingUrl(null);
      
      fetchEventUrls();
    } catch (err) {
      setFormError(`Failed to update event URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error updating event URL:', err);
    }
  };
  
  // Handle delete confirmation
  const handleDeleteUrl = async () => {
    if (!urlToDelete) return;
    
    try {
      const response = await fetch(`/api/user/event-urls/${urlToDelete.id}`, {
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
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Event URLs</h1>
          <p className="text-gray-600">Create and manage your photo booth event URLs</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          Create New URL
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : eventUrls.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900">No Event URLs Found</h3>
          <p className="mt-2 text-gray-600">
            Create your first custom event URL to get started.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          >
            Create New URL
          </button>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL Path
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Dates
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {eventUrls.map((url) => (
                <tr key={url.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{url.eventName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-blue-600 hover:underline">
                      <Link href={`/e/${url.urlPath}`} target="_blank">
                        {url.urlPath}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${url.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {url.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(url.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {url.eventStartDate ? (
                      <>
                        {formatDate(url.eventStartDate)}
                        {url.eventEndDate ? ` - ${formatDate(url.eventEndDate)}` : ''}
                      </>
                    ) : (
                      'No date restrictions'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditingUrl(url);
                        setIsEditModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create New Event URL</h2>
            
            {formError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{formError}</p>
              </div>
            )}
            
            <form onSubmit={handleCreateUrl}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eventName">
                  Event Name
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="eventName"
                  type="text"
                  placeholder="Enter event name"
                  value={newUrl.eventName}
                  onChange={(e) => setNewUrl({ ...newUrl, eventName: e.target.value })}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="urlPath">
                  URL Path
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">/e/</span>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="urlPath"
                    type="text"
                    placeholder="your-event-url"
                    value={newUrl.urlPath}
                    onChange={(e) => setNewUrl({ ...newUrl, urlPath: e.target.value })}
                    pattern="[a-z0-9-]+"
                    title="Only lowercase letters, numbers, and hyphens are allowed"
                    required
                  />
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  Only lowercase letters, numbers, and hyphens. No spaces or special characters.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Status
                </label>
                <div className="flex items-center">
                  <input
                    id="isActive"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={newUrl.isActive}
                    onChange={(e) => setNewUrl({ ...newUrl, isActive: e.target.checked })}
                  />
                  <label htmlFor="isActive" className="ml-2 block text-gray-700">
                    Active
                  </label>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eventStartDate">
                  Start Date (Optional)
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="eventStartDate"
                  type="date"
                  value={newUrl.eventStartDate}
                  onChange={(e) => setNewUrl({ ...newUrl, eventStartDate: e.target.value })}
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eventEndDate">
                  End Date (Optional)
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="eventEndDate"
                  type="date"
                  value={newUrl.eventEndDate}
                  onChange={(e) => setNewUrl({ ...newUrl, eventEndDate: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {isEditModalOpen && editingUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Edit Event URL</h2>
            
            {formError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{formError}</p>
              </div>
            )}
            
            <form onSubmit={handleUpdateUrl}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editEventName">
                  Event Name
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="editEventName"
                  type="text"
                  placeholder="Enter event name"
                  value={editingUrl.eventName}
                  onChange={(e) => setEditingUrl({ ...editingUrl, eventName: e.target.value })}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editUrlPath">
                  URL Path
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">/e/</span>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="editUrlPath"
                    type="text"
                    placeholder="your-event-url"
                    value={editingUrl.urlPath}
                    onChange={(e) => setEditingUrl({ ...editingUrl, urlPath: e.target.value })}
                    pattern="[a-z0-9-]+"
                    title="Only lowercase letters, numbers, and hyphens are allowed"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Status
                </label>
                <div className="flex items-center">
                  <input
                    id="editIsActive"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={editingUrl.isActive}
                    onChange={(e) => setEditingUrl({ ...editingUrl, isActive: e.target.checked })}
                  />
                  <label htmlFor="editIsActive" className="ml-2 block text-gray-700">
                    Active
                  </label>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editEventStartDate">
                  Start Date (Optional)
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="editEventStartDate"
                  type="date"
                  value={editingUrl.eventStartDate || ''}
                  onChange={(e) => setEditingUrl({ ...editingUrl, eventStartDate: e.target.value })}
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editEventEndDate">
                  End Date (Optional)
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="editEventEndDate"
                  type="date"
                  value={editingUrl.eventEndDate || ''}
                  onChange={(e) => setEditingUrl({ ...editingUrl, eventEndDate: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingUrl(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && urlToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Delete Event URL</h2>
            <p className="mb-6">
              Are you sure you want to delete the event URL <strong>{urlToDelete.eventName}</strong> ({urlToDelete.urlPath})? This action cannot be undone.
            </p>
            
            <div className="flex justify-end">
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUrlToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleDeleteUrl}
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