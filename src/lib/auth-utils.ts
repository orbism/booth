import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from './prisma';
import { NextRequest, NextResponse } from 'next/server';

// For TypeScript compatibility, use any for now to avoid complex type errors
type User = any;

// Define result types for our SQL queries
type UserWithSubscription = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  username: string | null;
  [key: string]: any; // For other user fields
};

type CountResult = {
  count: number;
};

/**
 * Gets the current user session
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }
  
  // Use raw SQL to avoid TypeScript errors with Prisma models
  const users = await prisma.$queryRaw<UserWithSubscription[]>`
    SELECT u.*, s.*
    FROM User u
    LEFT JOIN Subscription s ON u.id = s.userId
    WHERE u.email = ${session.user.email}
    LIMIT 1
  `;
  
  return users[0] || null;
}

/**
 * Checks if the current user owns a specific resource
 */
export async function checkResourceOwnership(
  resourceType: 'eventUrl' | 'boothSession' | 'settings' | 'journey',
  resourceId: string
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // Admins can access any resource
  if (user.role === 'ADMIN') {
    return true;
  }
  
  try {
    // Use raw SQL queries to avoid TypeScript issues
    switch (resourceType) {
      case 'eventUrl': {
        const results = await prisma.$queryRaw<CountResult[]>`
          SELECT COUNT(*) as count 
          FROM EventUrl 
          WHERE id = ${resourceId} AND userId = ${user.id}
        `;
        return results[0]?.count > 0;
      }
        
      case 'boothSession': {
        const results = await prisma.$queryRaw<CountResult[]>`
          SELECT COUNT(*) as count 
          FROM BoothSession 
          WHERE id = ${resourceId} AND userId = ${user.id}
        `;
        return results[0]?.count > 0;
      }
        
      case 'settings': {
        const results = await prisma.$queryRaw<CountResult[]>`
          SELECT COUNT(*) as count 
          FROM Settings 
          WHERE id = ${resourceId} AND userId = ${user.id}
        `;
        return results[0]?.count > 0;
      }
        
      case 'journey':
        // For now, only admins can access journeys
        return false;
        
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking resource ownership: ${error}`);
    return false;
  }
}

/**
 * Checks if a username matches the current authenticated user
 * or if the user is an admin
 */
export async function checkUsernameAccess(username: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // Admins can access any user account
  if (user.role === 'ADMIN') {
    return true;
  }
  
  // Otherwise users can only access their own account
  return user.username === username;
}

/**
 * Higher-order function to protect API routes with ownership checks
 */
export function withOwnershipCheck(
  resourceType: 'eventUrl' | 'boothSession' | 'settings' | 'journey',
  resourceIdExtractor: (req: NextRequest) => string | null,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resourceId = resourceIdExtractor(req);
    
    if (!resourceId) {
      return NextResponse.json({ error: 'Invalid resource ID' }, { status: 400 });
    }
    
    // Admin override for ownership
    if (user.role === 'ADMIN') {
      return handler(req, user.id);
    }
    
    const hasAccess = await checkResourceOwnership(resourceType, resourceId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You do not own this resource' }, { status: 403 });
    }
    
    return handler(req, user.id);
  };
}

/**
 * Higher-order function for username-based route protection
 */
export function withUsernameCheck(
  usernameExtractor: (req: NextRequest) => string | null,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const username = usernameExtractor(req);
    
    if (!username) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }
    
    // Admin override
    if (user.role === 'ADMIN') {
      return handler(req, user.id);
    }
    
    // Regular user check
    if (user.username !== username) {
      return NextResponse.json({ error: 'Forbidden: You cannot access this user\'s data' }, { status: 403 });
    }
    
    return handler(req, user.id);
  };
}

/**
 * Check if a user has access to a specific feature based on subscription
 */
export function hasFeatureAccess(
  user: User | null,
  feature: 'customDomain' | 'analyticsAccess' | 'filterAccess' | 'videoAccess' | 'aiEnhancement' | 'journeyBuilder' | 'brandingRemoval' | 'prioritySupport'
): boolean {
  if (!user) return false;
  
  // Admin role always has access to all features
  if (user.role === 'ADMIN' || (user.subscription && user.subscription.tier === 'ADMIN')) {
    return true;
  }
  
  // Check if subscription is active
  const hasActiveSubscription = 
    user.subscription?.status === 'ACTIVE' || 
    user.subscription?.status === 'TRIAL';
  
  if (!hasActiveSubscription || !user.subscription) {
    return false;
  }
  
  // Check specific feature flag
  return !!user.subscription[feature];
} 