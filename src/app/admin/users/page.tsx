'use client';

import React, { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string | null;
  email: string;
  role?: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkSelections, setBulkSelections] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CUSTOMER',
  });
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch users with pagination and search
  const fetchUsers = async (page = 1, searchTerm = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/users?page=${page}&limit=10${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(`Failed to fetch users: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers(pagination.page, search);
  }, [pagination.page]);

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      fetchUsers(1, search);
    }, 500);
    
    setSearchTimeout(timeout);
    
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [search]);

  // Handle user delete
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setDeleteLoading(true);
    
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error: ${response.status} ${response.statusText}`);
      }
      
      // Remove the user from the list
      setUsers(users.filter(user => user.id !== userToDelete.id));
      
      // Close the modal
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      setError(`Failed to delete user: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error deleting user:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle bulk selections
  const toggleBulkSelection = (userId: string) => {
    if (bulkSelections.includes(userId)) {
      setBulkSelections(bulkSelections.filter(id => id !== userId));
    } else {
      setBulkSelections([...bulkSelections, userId]);
    }
  };

  // Handle bulk selection of all users
  const toggleSelectAll = () => {
    if (bulkSelections.length === users.length) {
      setBulkSelections([]);
    } else {
      setBulkSelections(users.map(user => user.id));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (bulkSelections.length === 0) return;
    
    setDeleteLoading(true);
    
    try {
      const response = await fetch(`/api/admin/users/sessions/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionIds: bulkSelections,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error: ${response.status} ${response.statusText}`);
      }
      
      // Remove the deleted users from the list
      setUsers(users.filter(user => !bulkSelections.includes(user.id)));
      
      // Reset selections
      setBulkSelections([]);
      
      // Close the modal
      setIsBulkDeleteModalOpen(false);
    } catch (err) {
      setError(`Failed to delete users: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error deleting users:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle create new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.password) {
      setModalError('Email and password are required.');
      return;
    }
    
    setLoading(true);
    setModalError(null);
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error: ${response.status} ${response.statusText}`);
      }
      
      const createdUser = await response.json();
      
      // Add the new user to the list
      setUsers([createdUser, ...users]);
      
      // Reset the form
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'CUSTOMER',
      });
      
      // Close the modal
      setNewUserModalOpen(false);
    } catch (err) {
      setModalError(`${err instanceof Error ? err.message : 'Unknown error'}`);
      setError(`Failed to create user: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  // View user details
  const handleViewUser = (user: User) => {
    router.push(`/admin/users/${user.id}`);
  };

  // Pagination controls
  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.pages) return;
    setPagination({ ...pagination, page });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-500">
            Manage your application users
          </p>
        </div>
        <button
          onClick={() => setNewUserModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add New User
        </button>
      </div>

      {/* Search and Bulk Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          />
        </div>
        <div className="flex gap-2">
          {bulkSelections.length > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete Selected ({bulkSelections.length})
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

      {/* User Table */}
      {loading && users.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {users.length === 0 ? (
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <h2 className="text-xl font-semibold mb-2">No Users Found</h2>
              <p className="text-gray-500 mb-6 text-center max-w-md">
                {search ? "No users match your search criteria." : "No users have been added to the system yet."}
              </p>
              <button
                onClick={() => setNewUserModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Add New User
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={bulkSelections.length === users.length}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span>Select</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
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
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={bulkSelections.includes(user.id)}
                          onChange={() => toggleBulkSelection(user.id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {user.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role || 'USER'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(user);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {users.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    pagination.page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    pagination.page === pagination.pages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => goToPage(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                        pagination.page === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goToPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                          pagination.page === i + 1
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => goToPage(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                        pagination.page === pagination.pages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
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
          )}
        </div>
      )}

      {/* Delete User Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete the user <strong>{userToDelete?.email}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Bulk Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete <strong>{bulkSelections.length}</strong> users? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New User Modal */}
      {newUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Add New User</h3>
            
            {modalError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{modalError}</p>
              </div>
            )}
            
            <form onSubmit={handleCreateUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="User's name"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Secure password"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setNewUserModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 