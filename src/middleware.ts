// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export function middleware(request: NextRequest) {
  // Initialize headers from the incoming request
  const response = NextResponse.next();
  
  // Apply security headers for all responses
  addSecurityHeaders(response.headers);
  
  return response;
}

// Only apply the middleware to the booth routes that need cross-origin isolation
export const config = {
  matcher: [
    '/booth/:path*', // Apply only to booth routes
    '/api/booth/:path*', // And booth API routes
  ],
};