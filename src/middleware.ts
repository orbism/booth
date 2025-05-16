// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

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
 * Check if a URL is for a custom event URL
 */
async function isCustomEventUrl(pathname: string): Promise<boolean | string> {
  // Custom event URLs follow the pattern: /e/{urlPath}
  if (pathname.startsWith('/e/')) {
    const urlPath = pathname.split('/')[2];
    
    // Skip if no urlPath or it contains additional slashes
    if (!urlPath || urlPath.includes('/')) {
      return false;
    }
    
    try {
      // Using raw query to work around TypeScript issues with the EventUrl model
      const eventUrl = await prisma.$queryRaw`
        SELECT id, isActive 
        FROM EventUrl 
        WHERE urlPath = ${urlPath}
      `;
      
      // Result from raw query is an array
      const foundUrl = Array.isArray(eventUrl) && eventUrl.length > 0 ? eventUrl[0] : null;
      
      // If found and active, return the ID for further use
      if (foundUrl && foundUrl.isActive) {
        return foundUrl.id;
      }
    } catch (error) {
      console.error('Error checking custom event URL:', error);
    }
  }
  
  return false;
}

/**
 * Check if the username exists and user is authorized to access it
 */
async function checkUsernameAccess(request: NextRequest): Promise<{ 
  exists: boolean; 
  userId: string | null; 
  isAdmin: boolean; 
  isOwnAccount: boolean; 
}> {
  const token = await getToken({ req: request });
  const pathname = request.nextUrl.pathname;
  
  // Extract username from the path: /u/[username]
  if (!pathname.startsWith('/u/')) {
    return { exists: false, userId: null, isAdmin: false, isOwnAccount: false };
  }
  
  const urlParts = pathname.split('/');
  if (urlParts.length < 3) {
    return { exists: false, userId: null, isAdmin: false, isOwnAccount: false };
  }
  
  const username = urlParts[2];
  
  if (!username) {
    return { exists: false, userId: null, isAdmin: false, isOwnAccount: false };
  }
  
  try {
    // Using raw query to check if username exists
    const users = await prisma.$queryRaw`
      SELECT id, role, username 
      FROM User 
      WHERE username = ${username}
    `;
    
    // No user found with this username
    if (!Array.isArray(users) || users.length === 0) {
      return { exists: false, userId: null, isAdmin: false, isOwnAccount: false };
    }
    
    const user = users[0];
    const isAdmin = token?.role === 'ADMIN';
    const isOwnAccount = token?.sub === user.id;
    
    return { 
      exists: true, 
      userId: user.id, 
      isAdmin, 
      isOwnAccount 
    };
  } catch (error) {
    console.error('Error checking username access:', error);
    return { exists: false, userId: null, isAdmin: false, isOwnAccount: false };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Initialize headers from the incoming request
  const response = NextResponse.next();
  
  // Apply security headers for all responses
  addSecurityHeaders(response.headers);
  
  // Handle custom event URLs
  const eventUrlResult = await isCustomEventUrl(pathname);
  if (eventUrlResult) {
    // Extract event URL ID
    const eventUrlId = typeof eventUrlResult === 'string' ? eventUrlResult : null;
    
    if (eventUrlId) {
      // Create a modified URL for the booth with the event URL ID
      const url = new URL('/e/' + pathname.split('/')[2], request.url);
      
      // Rewrite the request to our custom event page
      return NextResponse.rewrite(url);
    }
  }
  
  // Handle username-based routes (/u/[username]/*)
  if (pathname.startsWith('/u/')) {
    const usernameCheck = await checkUsernameAccess(request);
    
    // Username doesn't exist
    if (!usernameCheck.exists) {
      const url = new URL('/404', request.url);
      return NextResponse.rewrite(url);
    }
    
    // It's the admin section and user is not authorized (not admin or not their account)
    if (pathname.includes('/admin') && !usernameCheck.isAdmin && !usernameCheck.isOwnAccount) {
      const url = new URL('/forbidden', request.url);
      return NextResponse.rewrite(url);
    }
    
    // User viewing someone else's profile but not an admin
    if (!usernameCheck.isAdmin && !usernameCheck.isOwnAccount) {
      const url = new URL('/forbidden', request.url);
      return NextResponse.rewrite(url);
    }
  }
  
  return response;
}

// Apply the middleware to the booth routes and event URL routes
export const config = {
  matcher: [
    '/booth/:path*',        // Apply to booth routes
    '/api/booth/:path*',    // And booth API routes
    '/e/:path*',            // Custom event URL pattern
    '/u/:path*',            // Username-based routes
  ],
};