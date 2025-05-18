'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { getUserRoute } from '@/lib/route-utils';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isLoading = status === 'loading';
  const [username, setUsername] = useState<string | null>(null);
  
  // Helper to get user initials for avatar
  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Close menus when pathname changes
  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);
  
  // Fetch username when session loads
  useEffect(() => {
    if (session?.user?.email && status === 'authenticated') {
      // Fetch username from API
      fetch(`/api/user/profile`)
        .then(res => res.json())
        .then(data => {
          if (data.username) {
            setUsername(data.username);
          }
        })
        .catch(err => {
          console.error('Error fetching username:', err);
        });
    }
  }, [session, status]);
  
  // Main navigation links
  const navigationLinks = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
  ];
  
  // Check if current path is admin
  const isAdminRoute = pathname.startsWith('/admin') || (pathname.startsWith('/u/') && pathname.includes('/admin'));
  
  // Check if the current path is a user route
  const isUserRoute = pathname.startsWith('/u/');
  
  // User menu items
  const userMenuItems = username ? [
    { name: 'Account Dashboard', href: getUserRoute(username) },
    { name: 'Analytics', href: getUserRoute(username, 'analytics') },
    { name: 'Booth Sessions', href: getUserRoute(username, 'admin/sessions') },
    { name: 'Event URLs', href: getUserRoute(username, 'admin/event-urls') },
    { name: 'Settings', href: getUserRoute(username, 'settings') },
    // Admin-specific items
    ...(session?.user?.role === 'ADMIN' ? [
      { name: 'Admin Dashboard', href: '/admin' },
    ] : [])
  ] : [];
  
  // Check if the user is an admin
  const isAdmin = session?.user?.role === 'ADMIN';
  
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-blue-600 font-bold text-xl">
                BoothBoss
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationLinks.map(link => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === link.href
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {/* Admin link, only for admins */}
              {isAdmin && !isAdminRoute && (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Global Admin
                </Link>
              )}
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* User section */}
            {isLoading ? (
              <div className="animate-pulse h-8 w-8 bg-gray-200 rounded-full"></div>
            ) : session?.user ? (
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="flex text-sm rounded-full focus:outline-none"
                    id="user-menu-button"
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="true"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      {getInitials(session.user.name)}
                    </div>
                  </button>
                </div>
                
                {/* User dropdown menu */}
                {isUserMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    tabIndex={-1}
                  >
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <p className="font-medium">{session.user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                    </div>
                    
                    {userMenuItems.map((item, index) => (
                      <Link
                        key={index}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        tabIndex={-1}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            {navigationLinks.map(link => (
              <Link
                key={link.name}
                href={link.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  pathname === link.href
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Admin link, only for admins */}
            {isAdmin && !isAdminRoute && (
              <Link
                href="/admin"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              >
                Global Admin
              </Link>
            )}
          </div>
          
          {/* Mobile session/user section */}
          {session?.user ? (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    {getInitials(session.user.name)}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {session.user.name}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {session.user.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {userMenuItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100"
                  >
                    {item.name}
                  </Link>
                ))}
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex flex-col space-y-2 px-4">
                <Link
                  href="/login"
                  className="text-base font-medium text-gray-500 hover:text-gray-900"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
} 