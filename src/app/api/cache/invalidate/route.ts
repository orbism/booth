/**
 * Cache Invalidation API
 * POST /api/cache/invalidate?resource=resource-name
 * 
 * Used to invalidate client-side cache for specified resources
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { handleApiError, unauthorizedResponse } from '@/lib/errors';

// Track version numbers for different resources
const cacheVersions: Record<string, number> = {
  'all': 0,
  'user-settings': 0,
  'booth-settings': 0,
  'event-urls': 0
};

/**
 * POST handler for cache invalidation
 */
export async function POST(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource') || 'all';
    const urlPath = searchParams.get('urlPath');
    const urgent = searchParams.get('urgent') === 'true';
    
    // Check authentication - make booth settings accessible without auth
    if (resource !== 'booth-settings') {
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user) {
        return unauthorizedResponse();
      }
      
      console.log(`[CACHE] User ${session.user.id} invalidating cache for ${resource}`);
    } else {
      console.log(`[CACHE] Public access to invalidate booth-settings cache`);
    }
    
    // Update version for specified resource
    if (resource === 'all') {
      // Invalidate all resources
      Object.keys(cacheVersions).forEach(key => {
        cacheVersions[key] = Date.now();
      });
      
      console.log(`[CACHE] Invalidated all cache versions: ${JSON.stringify(cacheVersions)}`);
    } else if (resource in cacheVersions) {
      // Invalidate specific resource
      cacheVersions[resource] = Date.now();
      console.log(`[CACHE] Invalidated ${resource} cache: ${cacheVersions[resource]}`);
    } else {
      // Unknown resource
      return NextResponse.json({
        success: false,
        error: `Unknown resource: ${resource}`
      }, { status: 400 });
    }
    
    // Add resource-specific details to response
    const responseData: any = {
      success: true,
      resource,
      version: cacheVersions[resource],
      timestamp: Date.now(),
      urgent
    };
    
    // Add URL path info if provided
    if (urlPath) {
      responseData.urlPath = urlPath;
      console.log(`[CACHE] Cache invalidation specified for URL path: ${urlPath}`);
    }
    
    // Return new version information
    return NextResponse.json(responseData);
  } catch (error) {
    return handleApiError(error, 'Failed to invalidate cache');
  }
}

/**
 * GET handler to check current cache versions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    
    if (resource && resource in cacheVersions) {
      // Return specific resource version
      return NextResponse.json({
        resource,
        version: cacheVersions[resource],
        timestamp: Date.now()
      });
    }
    
    // Return all versions
    return NextResponse.json({
      versions: cacheVersions,
      timestamp: Date.now()
    });
  } catch (error) {
    return handleApiError(error, 'Failed to get cache versions');
  }
} 