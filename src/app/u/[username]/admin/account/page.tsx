'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { getUserRoute, getAdminRoute } from '@/lib/route-utils';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  organizationName: string | null;
  organizationSize: string | null;
  industry: string | null;
  role: string;
  onboardingCompleted: boolean;
  createdAt: string;
  emailVerified: boolean | null;
  subscription: {
    tier: string;
    status: string;
    endDate: string | null;
  } | null;
}

export default function AdminAccountPage() {
  const params = useParams();
  const username = params.username as string;
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    organizationName: '',
    organizationSize: '',
    industry: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  // Fetch user profile from the API
  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // For admin view, fetch specific user account by username
      const response = await fetch(`/api/user/account?username=${username}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.status}`);
      }
      
      setProfile(data.user);
      setFormData({
        name: data.user.name || '',
        organizationName: data.user.organizationName || '',
        organizationSize: data.user.organizationSize || '',
        industry: data.user.industry || '',
      });

      console.log('Fetched user profile:', data.user);
    } catch (err) {
      setError(`Failed to fetch profile: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission for profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      const response = await fetch(`/api/user/account?username=${username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setFormError(data.error || `Error: ${response.status}`);
        return;
      }
      
      // Success - update profile and exit edit mode
      setProfile({
        ...profile!,
        ...data.user,
      });
      setIsEditing(false);
    } catch (err) {
      setFormError(`Failed to update profile: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error updating profile:', err);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get subscription badge class
  const getSubscriptionBadgeClass = (tier: string) => {
    switch (tier) {
      case 'FREE':
        return 'bg-gray-100 text-gray-800';
      case 'STARTER':
        return 'bg-blue-100 text-blue-800';
      case 'PROFESSIONAL':
        return 'bg-purple-100 text-purple-800';
      case 'BUSINESS':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !profile) {
    return (
      <div>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm text-red-700">
                <p>{error || 'Failed to load user profile'}</p>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={fetchUserProfile}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Account Management</h1>
        <p className="text-gray-600">
          Manage account settings for {profile.username}
        </p>
      </div>

      {/* Account Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Profile Card */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">Profile</h2>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)} 
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile}>
              {formError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                  <p>{formError}</p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Full Name
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="organizationName">
                  Organization Name
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="organizationName"
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="organizationSize">
                  Organization Size
                </label>
                <select
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="organizationSize"
                  value={formData.organizationSize || ''}
                  onChange={(e) => setFormData({ ...formData, organizationSize: e.target.value })}
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="industry">
                  Industry
                </label>
                <select
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="industry"
                  value={formData.industry || ''}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                >
                  <option value="">Select industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Events">Events</option>
                  <option value="Retail">Retail</option>
                  <option value="Hospitality">Hospitality</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-100 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{profile.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="font-medium">{profile.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Organization</p>
                <p className="font-medium">{profile.organizationName || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Organization Size</p>
                <p className="font-medium">{profile.organizationSize || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Industry</p>
                <p className="font-medium">{profile.industry || 'Not specified'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Account Info Card */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Account Info</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="font-mono text-xs bg-gray-100 p-1 rounded">{profile.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {profile.role}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email Verification</p>
              <p className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {profile.emailVerified ? 'Verified' : 'Not Verified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Created</p>
              <p className="font-medium">{formatDate(profile.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Onboarding Status</p>
              <p className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {profile.onboardingCompleted ? 'Completed' : 'Not Completed'}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Subscription</h2>
          {profile.subscription ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Current Plan</p>
                <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubscriptionBadgeClass(profile.subscription.tier)}`}>
                  {profile.subscription.tier}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {profile.subscription.status}
                </p>
              </div>
              {profile.subscription.endDate && (
                <div>
                  <p className="text-sm text-gray-500">Next Billing Date</p>
                  <p className="font-medium">{formatDate(profile.subscription.endDate)}</p>
                </div>
              )}
              <div className="pt-2">
                <Link
                  href={getAdminRoute(username, 'settings/billing')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  Manage Subscription
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-4">No active subscription</p>
              <Link
                href={getAdminRoute(username, 'settings/billing')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Set Up Subscription
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Options */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Advanced Options</h2>
        <div className="space-y-4">
          <div>
            <Link
              href={getAdminRoute(username, 'settings/security')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-100 focus:outline-none"
            >
              Security Settings
            </Link>
          </div>
          <div>
            <Link
              href={getAdminRoute(username, 'settings/api')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-100 focus:outline-none"
            >
              API Keys
            </Link>
          </div>
          <div>
            <Link
              href={getAdminRoute(username, 'settings/integrations')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-100 focus:outline-none"
            >
              Integrations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 