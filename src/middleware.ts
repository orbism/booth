// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      // Check if this is a registered event URL
      const eventUrl = await prisma.eventUrl.findUnique({
        where: { urlPath },
        select: { id: true, isActive: true }
      });
      
      // If found and active, return the ID for further use
      if (eventUrl && eventUrl.isActive) {
        return eventUrl.id;
      }
    } catch (error) {
      console.error('Error checking custom event URL:', error);
    }
  }
  
  return false;
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
      const url = new URL('/booth', request.url);
      url.searchParams.set('eventUrlId', eventUrlId);
      
      // Rewrite the request to the booth page
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
  ],
};