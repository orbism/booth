import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/auth.config';

/**
 * Utility function to check authentication for API routes
 * Use this in your API route handlers instead of middleware
 */
export async function checkAuth(
  req: NextRequest,
  onSuccess: () => Promise<NextResponse> | NextResponse
) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return onSuccess();
}

/**
 * Checks if the request path should be protected
 */
export function isProtectedPath(path: string): boolean {
  const protectedPaths = [
    '/admin',
    '/admin/settings',
    '/admin/sessions',
    '/admin/analytics',
    '/admin/journeys',
    '/api/admin',
  ];
  
  return protectedPaths.some(prefix => path.startsWith(prefix));
} 