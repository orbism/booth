'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface User {
  id: string;
  name: string | null;
  email: string;
  role?: string;
  createdAt: string;
  sessions: Session[];
  boothSessions: BoothSession[];
}

interface Session {
  id: string;
  expires: string;
}

interface BoothSession {
  id: string;
  photoPath: string;
  createdAt: string;
  emailSent: boolean;
  mediaType: string | null;
  filter: string | null;
}

export default function UserDetailClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const userId = params.id;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isResendEmailModalOpen, setIsResendEmailModalOpen] = useState(false);
  const [sessionToResend, setSessionToResend] = useState<BoothSession | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmSelfWipe, setConfirmSelfWipe] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
  });
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isSessionDeleteModalOpen, setIsSessionDeleteModalOpen] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const userData = await response.json();
        setUser(userData);
        
        // Initialize edit form data
        setEditData({
          name: userData.name || '',
          email: userData.email,
          password: '',
          role: userData.role || 'USER',
        });
      } catch (err) {
        setError(`Failed to fetch user: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [userId]);

  // Handle edit user
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setActionLoading(true);
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editData.name,
          email: editData.email,
          ...(editData.password ? { password: editData.password } : {}),
          role: editData.role,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error: ${response.status} ${response.statusText}`);
      }
      
      const updatedUser = await response.json();
      setUser((prev) => prev ? { ...prev, ...updatedUser } : null);
      setEditMode(false);
    } catch (err) {
      setError(`Failed to update user: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error updating user:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    setActionLoading(true);
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error: ${response.status} ${response.statusText}`);
      }
      
      router.push('/admin/users');
    } catch (err) {
      setError(`Failed to delete user: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error deleting user:', err);
      setIsDeleteModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle wipe user data
  const handleWipeUserData = async () => {
    if (!user) return;
    
    setActionLoading(true);
    
    try {
      // First 8 characters of user ID are used as confirmation code
      const expectedCode = user.id.substring(0, 8);
      
      if (confirmationCode !== expectedCode) {
        setError('Invalid confirmation code. Wipe aborted.');
        return;
      }
      
      const response = await fetch('/api/admin/users/sessions/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          confirmationCode,
          confirmSelfWipe,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error: ${response.status} ${response.statusText}`);
      }
      
      // Refresh user data
      const refreshResponse = await fetch(`/api/admin/users/${userId}`);
      const refreshedUser = await refreshResponse.json();
      setUser(refreshedUser);
      
      setIsWipeModalOpen(false);
      setConfirmationCode('');
      setConfirmSelfWipe(false);
    } catch (err) {
      setError(`Failed to wipe user data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error wiping user data:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle resend email
  const handleResendEmail = async () => {
    if (!sessionToResend) return;
    
    setActionLoading(true);
    
    try {
      const response = await fetch(`/api/admin/users/sessions/${sessionToResend.id}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error: ${response.status} ${response.statusText}`);
      }
      
      // Update the session status
      if (user) {
        const updatedSessions = user.boothSessions.map(session => 
          session.id === sessionToResend.id 
            ? { ...session, emailSent: true } 
            : session
        );
        
        setUser({ ...user, boothSessions: updatedSessions });
      }
      
      setIsResendEmailModalOpen(false);
      setSessionToResend(null);
    } catch (err) {
      setError(`Failed to resend email: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error resending email:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle session selection
  const toggleSessionSelection = (sessionId: string) => {
    if (selectedSessions.includes(sessionId)) {
      setSelectedSessions(selectedSessions.filter(id => id !== sessionId));
    } else {
      setSelectedSessions([...selectedSessions, sessionId]);
    }
  };

  // Handle delete session(s)
  const handleDeleteSessions = async () => {
    if (selectedSessions.length === 0) return;
    
    setActionLoading(true);
    
    try {
      const response = await fetch('/api/admin/users/sessions/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionIds: selectedSessions,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error: ${response.status} ${response.statusText}`);
      }
      
      // Update the user's sessions list
      if (user) {
        const updatedSessions = user.boothSessions.filter(
          session => !selectedSessions.includes(session.id)
        );
        
        setUser({ ...user, boothSessions: updatedSessions });
      }
      
      setSelectedSessions([]);
      setIsSessionDeleteModalOpen(false);
    } catch (err) {
      setError(`Failed to delete sessions: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error deleting sessions:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <Link href="/admin/users" className="text-blue-600 hover:underline">
          ← Back to Users
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>User not found</p>
        </div>
        <Link href="/admin/users" className="text-blue-600 hover:underline">
          ← Back to Users
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/admin/users" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Users
          </Link>
          <h1 className="text-3xl font-bold">User Details</h1>
        </div>
        <div className="flex gap-2">
          {!editMode ? (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit User
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete User
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* User Information */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium">User Information</h3>
        </div>
        
        {editMode ? (
          <form onSubmit={handleSaveUser} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={editData.password}
                  onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={editData.role}
                  onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={actionLoading}
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="mt-1">{user.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Role</p>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'ADMIN' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role || 'USER'}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created At</p>
                <p className="mt-1">{new Date(user.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium">User Sessions</h3>
          <div className="text-sm text-gray-500">
            {user.sessions.length} Active {user.sessions.length === 1 ? 'Session' : 'Sessions'}
          </div>
        </div>
        <div className="p-6">
          {user.sessions.length === 0 ? (
            <p className="text-gray-500">No active sessions.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {user.sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {session.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(session.expires).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Booth Sessions */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium">Photo Booth Sessions</h3>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              {user.boothSessions.length} {user.boothSessions.length === 1 ? 'Session' : 'Sessions'}
            </div>
            {selectedSessions.length > 0 && (
              <button
                onClick={() => setIsSessionDeleteModalOpen(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Delete Selected ({selectedSessions.length})
              </button>
            )}
            <button
              onClick={() => setIsWipeModalOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
            >
              Wipe All Data
            </button>
          </div>
        </div>
        <div className="p-6">
          {user.boothSessions.length === 0 ? (
            <p className="text-gray-500">No photo booth sessions.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.boothSessions.map((session) => (
                <div key={session.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedSessions.includes(session.id)}
                      onChange={() => toggleSessionSelection(session.id)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.emailSent ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.emailSent ? 'Email Sent' : 'Email Pending'}
                    </span>
                  </div>
                  <div className="aspect-video relative">
                    <div className="relative w-full h-full">
                      {session.mediaType === 'video' ? (
                        <video 
                          src={session.photoPath} 
                          className="object-cover w-full h-full rounded"
                          controls
                          muted
                          playsInline
                        />
                      ) : (
                        <OptimizedImage 
                          src={session.photoPath} 
                          alt="Photo booth session"
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-gray-500 text-xs">
                      {new Date(session.createdAt).toLocaleString()}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          setSessionToResend(session);
                          setIsResendEmailModalOpen(true);
                        }}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        Resend Email
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete User Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete the user <strong>{user.email}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wipe User Data Modal */}
      {isWipeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Wipe All User Data</h3>
            <p className="mb-4 text-red-600 font-semibold">
              WARNING: This action will remove ALL data associated with this user, including all sessions, photos, and activity history.
            </p>
            <p className="mb-4">
              To confirm, enter the confirmation code: <strong>{user.id.substring(0, 8)}</strong>
            </p>
            <div className="mb-4">
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter confirmation code"
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={confirmSelfWipe}
                  onChange={(e) => setConfirmSelfWipe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded mr-2"
                />
                <span className="text-sm">I understand this is irreversible and confirm the data wipe</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsWipeModalOpen(false);
                  setConfirmationCode('');
                  setConfirmSelfWipe(false);
                }}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleWipeUserData}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled={actionLoading || confirmationCode !== user.id.substring(0, 8) || !confirmSelfWipe}
              >
                {actionLoading ? 'Processing...' : 'Wipe All Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resend Email Modal */}
      {isResendEmailModalOpen && sessionToResend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Resend Email</h3>
            <p className="mb-4">
              Are you sure you want to resend the email for this session?
            </p>
            <div className="mb-4">
              <div className="aspect-video relative">
                <div className="relative w-full h-full">
                  {sessionToResend.mediaType === 'video' ? (
                    <video 
                      src={sessionToResend.photoPath} 
                      className="object-cover w-full h-full rounded"
                      controls
                      muted
                      playsInline
                    />
                  ) : (
                    <OptimizedImage 
                      src={sessionToResend.photoPath} 
                      alt="Photo booth session"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsResendEmailModalOpen(false);
                  setSessionToResend(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleResendEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={actionLoading}
              >
                {actionLoading ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Sessions Modal */}
      {isSessionDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Delete Sessions</h3>
            <p className="mb-4">
              Are you sure you want to delete {selectedSessions.length} selected {selectedSessions.length === 1 ? 'session' : 'sessions'}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsSessionDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSessions}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete Sessions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 