'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function UserAccountPage({ params }: { params: Promise<{ username: string }> }) {
  const [username, setUsername] = useState<string>('');
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

  // Extract username from params once rendered on client
  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await params;
        setUsername(resolvedParams.username);
      } catch (error) {
        console.error('Error resolving params:', error);
      }
    };
    
    loadParams();
  }, [params]);

  // Fetch user profile when username is available
  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  // Fetch user profile from the API
  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/account');
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
      const response = await fetch('/api/user/account', {
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
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !profile) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error || 'Failed to load user profile'}</p>
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
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Account Dashboard</h1>
        <p className="text-gray-600">Manage your account settings and subscription</p>
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
                  <option value="Healthcare">Healthcare</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: profile.name || '',
                      organizationName: profile.organizationName || '',
                      organizationSize: profile.organizationSize || '',
                      industry: profile.industry || '',
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                <p className="text-sm text-gray-900">{profile.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="text-sm text-gray-900">{profile.email}</p>
                {profile.emailVerified ? (
                  <span className="text-xs text-green-600">Verified</span>
                ) : (
                  <span className="text-xs text-yellow-600">Not verified</span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Username</h3>
                <p className="text-sm text-gray-900">@{profile.username}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Organization</h3>
                <p className="text-sm text-gray-900">{profile.organizationName || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Organization Size</h3>
                <p className="text-sm text-gray-900">{profile.organizationSize || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Industry</h3>
                <p className="text-sm text-gray-900">{profile.industry || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                <p className="text-sm text-gray-900">{formatDate(profile.createdAt)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Subscription Card */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Subscription</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Current Plan</h3>
              <div className="flex items-center mt-1">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSubscriptionBadgeClass(profile.subscription?.tier || 'FREE')}`}>
                  {profile.subscription?.tier || 'FREE'}
                </span>
                <span className="ml-2 text-sm text-gray-600">
                  {profile.subscription?.status || 'ACTIVE'}
                </span>
              </div>
            </div>

            {profile.subscription?.endDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Renewal Date</h3>
                <p className="text-sm text-gray-900">{formatDate(profile.subscription.endDate)}</p>
              </div>
            )}

            <div className="mt-6">
              <Link 
                href="/pricing" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Upgrade Plan
              </Link>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Security</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Password</h3>
              <p className="text-sm text-gray-900 mt-1">●●●●●●●●●●</p>
              <Link 
                href={`/u/${username}/change-password`}
                className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
              >
                Change password
              </Link>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-900 mt-1">Not enabled</p>
              <button 
                className="text-sm text-blue-600 hover:text-blue-800 mt-2 disabled:text-gray-400"
                disabled
              >
                Enable 2FA (Coming soon)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Statistics Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Event URLs</h3>
            <p className="mt-1 text-3xl font-semibold">
              {/* Placeholder for actual stats */}
              3
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Limit: {profile.subscription?.tier === 'FREE' ? '3' : 'Unlimited'}
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Booth Sessions</h3>
            <p className="mt-1 text-3xl font-semibold">
              {/* Placeholder for actual stats */}
              127
            </p>
            <p className="mt-1 text-xs text-gray-500">Last 30 days</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Photos Taken</h3>
            <p className="mt-1 text-3xl font-semibold">
              {/* Placeholder for actual stats */}
              98
            </p>
            <p className="mt-1 text-xs text-gray-500">Last 30 days</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Videos Created</h3>
            <p className="mt-1 text-3xl font-semibold">
              {/* Placeholder for actual stats */}
              29
            </p>
            <p className="mt-1 text-xs text-gray-500">Last 30 days</p>
          </div>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href={`/u/${username}/admin/event-urls`}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-medium">Manage Event URLs</h3>
            <p className="text-sm text-gray-600 mt-1">Create and manage custom event URLs</p>
          </Link>
          
          <Link 
            href={`/u/${username}/admin/sessions`}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-medium">View Sessions</h3>
            <p className="text-sm text-gray-600 mt-1">Browse all photo booth sessions</p>
          </Link>
          
          <Link 
            href={`/u/${username}/admin/settings`}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <h3 className="font-medium">Booth Settings</h3>
            <p className="text-sm text-gray-600 mt-1">Customize your photo booth experience</p>
          </Link>
        </div>
      </div>
    </div>
  );
} 