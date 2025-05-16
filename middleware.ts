import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/u'
];

// Public routes (no auth needed)
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/pricing',
  '/about',
  '/features',
  '/contact',
  '/api/auth',
  '/api/webhooks',
  '/api/newsletter'
];

// Legacy redirect routes
const legacyRedirects: Record<string, string> = {
  '/dashboard': '/u', // will redirect to /u/[username] after auth check
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for booth pages and static files
  if (
    pathname.startsWith('/e/') || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images/') || 
    pathname.includes('.') ||
    pathname === '/api/user/settings'
  ) {
    return NextResponse.next();
  }
  
  // Handle legacy redirects
  const legacyRedirect = Object.keys(legacyRedirects).find(key => pathname === key);
  if (legacyRedirect) {
    return NextResponse.redirect(new URL(legacyRedirects[legacyRedirect], request.url));
  }
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // For protected routes, check auth
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (isProtectedRoute) {
    const token = await getToken({ req: request });
    
    // If not authenticated, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // For user-specific routes that start with /u/[username]
    if (pathname.startsWith('/u/')) {
      // Get the username from the path
      const pathParts = pathname.split('/');
      if (pathParts.length > 2) {
        const urlUsername = pathParts[2];
        const tokenEmail = token.email;
        
        // If we have a username in the URL and user email in token
        if (urlUsername && tokenEmail && token.name) {
          // Admin users can access any user page
          if (token.role === 'ADMIN' || token.role === 'SUPER_ADMIN') {
            return NextResponse.next();
          }
          
          // For regular users, check if they're accessing their own page
          // We'll do a simplistic check here, the server component will do a full check
          const tokenUsername = token.username;
          if (tokenUsername && tokenUsername !== urlUsername) {
            // If not matching, redirect to their own user page
            return NextResponse.redirect(new URL(`/u/${tokenUsername}`, request.url));
          }
        }
      }
    }
    
    // Authenticated user for protected route
    return NextResponse.next();
  }
  
  // Default case: allow access
  return NextResponse.next();
} 