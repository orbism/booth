// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

// Enable detailed debugging logs
const DEBUG = true;

/**
 * Debug logger function
 */
function debugLog(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[MIDDLEWARE DEBUG] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Add security headers for cross-origin isolation and general protection
 */
function addSecurityHeaders(headers: Headers): Headers {
  // Headers for cross-origin isolation (more permissive for development)
  headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  
  // General security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return headers;
}

/**
 * Get the current user's username from their ID
 */
async function getUsernameFromToken(token: any): Promise<string | null> {
  if (!token?.sub) return null;
  
  try {
    // Using raw query to work around TypeScript issues with the User model
    const users = await prisma.$queryRaw`
      SELECT username 
      FROM User 
      WHERE id = ${token.sub}
    `;
    
    // Result from raw query is an array
    const user = Array.isArray(users) && users.length > 0 ? users[0] : null;
    
    return user?.username || null;
  } catch (error) {
    console.error('Error getting username from token:', error);
    return null;
  }
}

/**
 * Gets equivalent user-specific route for an admin route
 */
function getEquivalentUserRoute(adminPath: string, username: string): string {
  // Remove the /admin prefix
  const pathAfterAdmin = adminPath.substring('/admin'.length);
  
  // Handle the root admin path
  if (pathAfterAdmin === '') {
    return `/u/${username}/admin`; // Admin dashboard maps to user dashboard
  }
  
  // Standard mapping for all other paths
  return `/u/${username}${pathAfterAdmin}`;
}

/**
 * Redirect to login with return URL
 */
function redirectToLogin(request: NextRequest, returnUrl: string): NextResponse {
  const encodedReturnUrl = encodeURIComponent(returnUrl);
  debugLog(`Redirecting unauthenticated user to login with return URL: ${returnUrl}`);
  return NextResponse.redirect(new URL(`/login?returnUrl=${encodedReturnUrl}`, request.url));
}

/**
 * Redirect to forbidden page
 */
function redirectToForbidden(request: NextRequest): NextResponse {
  debugLog(`Access forbidden, redirecting to /forbidden`);
  return NextResponse.redirect(new URL('/forbidden', request.url));
}

/**
 * Create secure response with headers
 */
function createSecureResponse(response = NextResponse.next()): NextResponse {
  const headers = new Headers(response.headers);
  addSecurityHeaders(headers);
  
  return new NextResponse(undefined, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  
  debugLog(`Middleware executing for path: ${pathname}`);
  
  // Get the user's token and authentication info
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  const isAdmin = token?.role === 'ADMIN';
  const isUser = token?.role === 'CUSTOMER';
  const username = token ? await getUsernameFromToken(token) : null;
  
  debugLog(`Authentication info:`, {
    path: pathname,
    isAuthenticated,
    role: token?.role,
    isAdmin,
    isUser,
    username,
    tokenSub: token?.sub
  });
  
  // Handle root path redirection for authenticated users
  if (pathname === '/' && isAuthenticated) {
    if (isAdmin) {
      debugLog('Redirecting admin to /admin dashboard');
      return NextResponse.redirect(new URL('/admin', request.url));
    } else if (username) {
      debugLog(`Redirecting user to their dashboard at /u/${username}/admin`);
      return NextResponse.redirect(new URL(`/u/${username}/admin`, request.url));
    }
  }
  
  // STRICT ADMIN ROUTE PROTECTION - Handle ALL admin routes
  if (pathname.startsWith('/admin')) {
    debugLog(`ADMIN ROUTE ACCESS ATTEMPT - Path: ${pathname}, Role: ${token?.role}`);
    
    // Only ADMIN role can access admin routes - no exceptions
    // First check if user is authenticated
    if (!isAuthenticated) {
      debugLog(`UNAUTHORIZED - User not authenticated`);
      return redirectToLogin(request, pathname);
    }
    
    // Then strictly enforce admin role requirement
    if (token?.role !== 'ADMIN') {
      debugLog(`ACCESS DENIED - Non-admin role "${token?.role}" attempting to access ${pathname}`);
      
      // If user has a username, redirect to equivalent user route
      if (username) {
        const userRoute = getEquivalentUserRoute(pathname, username);
        debugLog(`REDIRECTING to user-specific route: ${userRoute}`);
        return NextResponse.redirect(new URL(userRoute, request.url));
      }
      
      // If no username available, redirect to account setup
      if (isUser) {
        debugLog(`REDIRECTING to account setup - User has no username`);
        return NextResponse.redirect(new URL('/account-setup', request.url));
      }
      
      // For all other cases, redirect to forbidden
      debugLog(`REDIRECTING to forbidden - User is not admin and has no valid alternative route`);
      return redirectToForbidden(request);
    }
    
    // If we get here, user is an admin - allow access
    debugLog(`ACCESS GRANTED - Admin user accessing ${pathname}`);
    const response = createSecureResponse();
    const endTime = Date.now();
    debugLog(`Middleware completed in ${endTime - startTime}ms with status: ${response.status}`);
    return response;
  }
  
  // Handle user-specific routes
  if (pathname.startsWith('/u/')) {
    const pathUsername = pathname.split('/')[2];
    
    if (!pathUsername) {
      return NextResponse.redirect(new URL('/404', request.url));
    }
    
    // Check if accessing admin section
    if (pathname.includes('/admin')) {
      // Unauthenticated users go to login
      if (!isAuthenticated) {
        return redirectToLogin(request, pathname);
      }
      
      // Only allow access if admin or own account
      const hasAccess = isAdmin || (username === pathUsername);
      if (!hasAccess) {
        debugLog(`User ${username} attempted to access ${pathUsername}'s admin area`);
        return redirectToForbidden(request);
      }
    }
    
    // Check if username exists (for public profile views)
    try {
      // Use raw query instead of count with TypeScript issues
      const users = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM User 
        WHERE username = ${pathUsername}
      `;
      
      const userCount = Array.isArray(users) && users.length > 0 ? users[0].count : 0;
      
      if (userCount === 0) {
        return NextResponse.redirect(new URL('/404', request.url));
      }
    } catch (error) {
      console.error(`Error checking username existence: ${error}`);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  }
  
  // Handle API routes
  if (pathname.startsWith('/api/admin')) {
    debugLog(`API ADMIN ROUTE ACCESS ATTEMPT - Path: ${pathname}, Role: ${token?.role}`);
    
    // Unauthenticated users get 401
    if (!isAuthenticated) {
      debugLog(`API UNAUTHORIZED - User not authenticated`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Non-admin users get 403
    if (token?.role !== 'ADMIN') {
      debugLog(`API FORBIDDEN - Non-admin role "${token?.role}" attempting to access ${pathname}`);
      return NextResponse.json({ error: 'Forbidden', role: token?.role }, { status: 403 });
    }
    
    debugLog(`API ACCESS GRANTED - Admin user accessing ${pathname}`);
  }
  
  // Default: allow access with security headers
  const response = createSecureResponse();
  const endTime = Date.now();
  debugLog(`Middleware completed in ${endTime - startTime}ms with status: ${response.status}`);
  return response;
}

// Apply the middleware to all relevant routes
export const config = {
  matcher: [
    '/',                       // Root route for redirections
    '/admin',                  // Admin root (exact match)
    '/admin/:path*',           // Admin routes with paths
    '/booth/:path*',           // Booth routes
    '/api/booth/:path*',       // Booth API routes
    '/api/admin/:path*',       // Admin API routes
    '/u/:path*',               // Username-based routes
    '/login',                  // Login page for redirection
  ],
};