/**
 * Utility functions for user-related operations
 */
import { prisma } from './prisma';

/**
 * User result type from raw SQL queries
 */
type UserResult = {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  role: string;
  [key: string]: any; // For other fields
}

/**
 * Enhanced user type with optional related data
 */
type EnhancedUser = {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  role: string;
  settings?: {
    id: string;
    eventName: string;
    adminEmail: string;
    [key: string]: any;
  };
  subscription?: {
    tier: string;
    status: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Get a user by username, email, or ID
 * 
 * This function attempts to find a user by different identifiers to make it
 * more flexible for use in various parts of the application.
 * 
 * @param identifier Username, email, or user ID
 * @returns User object or null if not found
 */
export async function getUserByIdentifier(identifier: string): Promise<UserResult | null> {
  if (!identifier) {
    console.log("[getUserByIdentifier] Empty identifier provided");
    return null;
  }
  
  console.log(`[getUserByIdentifier] Looking up user with identifier: ${identifier}`);
  
  try {
    // First try exact lookup by ID (most efficient)
    const userByIdResult = await prisma.$queryRaw<UserResult[]>`
      SELECT 
        id, 
        name, 
        email, 
        username, 
        role
      FROM User
      WHERE id = ${identifier}
      LIMIT 1
    `;
    
    if (Array.isArray(userByIdResult) && userByIdResult.length > 0) {
      console.log(`[getUserByIdentifier] Found user by ID: ${userByIdResult[0].id}, username: ${userByIdResult[0].username}, role: ${userByIdResult[0].role}`);
      return userByIdResult[0];
    }
    
    // Then try username (exact match)
    const userByUsernameResult = await prisma.$queryRaw<UserResult[]>`
      SELECT 
        id, 
        name, 
        email, 
        username, 
        role
      FROM User
      WHERE username = ${identifier}
      LIMIT 1
    `;
    
    if (Array.isArray(userByUsernameResult) && userByUsernameResult.length > 0) {
      console.log(`[getUserByIdentifier] Found user by username: ${userByUsernameResult[0].id}, username: ${userByUsernameResult[0].username}, role: ${userByUsernameResult[0].role}`);
      return userByUsernameResult[0];
    }
    
    // Finally try email (exact match)
    const userByEmailResult = await prisma.$queryRaw<UserResult[]>`
      SELECT 
        id, 
        name, 
        email, 
        username, 
        role
      FROM User
      WHERE email = ${identifier}
      LIMIT 1
    `;
    
    if (Array.isArray(userByEmailResult) && userByEmailResult.length > 0) {
      console.log(`[getUserByIdentifier] Found user by email: ${userByEmailResult[0].id}, username: ${userByEmailResult[0].username}, role: ${userByEmailResult[0].role}`);
      return userByEmailResult[0];
    }
    
    console.log(`[getUserByIdentifier] No user found for identifier: ${identifier}`);
    return null;
  } catch (error) {
    console.error("[getUserByIdentifier] Error getting user by identifier:", error);
    return null;
  }
}

/**
 * Check if a user has access to view or modify another user's data
 * 
 * @param sessionUserId ID of the authenticated user
 * @param targetUserId ID of the user whose data is being accessed
 * @param sessionUserRole Role of the authenticated user
 * @returns Boolean indicating if access is allowed
 */
export async function hasUserAccess(
  sessionUserId: string, 
  targetUserId: string,
  sessionUserRole?: string
): Promise<boolean> {
  console.log(`[hasUserAccess] Checking if user ${sessionUserId} can access data for user ${targetUserId}, role: ${sessionUserRole || 'unknown'}`);
  
  // If we're checking access to our own user ID, always allow
  if (sessionUserId === targetUserId) {
    console.log(`[hasUserAccess] GRANTED - Self-access: ${sessionUserId} === ${targetUserId}`);
    return true;
  }
  
  // If role is provided and is admin, allow access
  if (sessionUserRole && (sessionUserRole === 'ADMIN' || sessionUserRole === 'SUPER_ADMIN')) {
    console.log(`[hasUserAccess] GRANTED - User has admin role: ${sessionUserRole}`);
    return true;
  }
  
  // If role not provided, fetch it from the database
  if (!sessionUserRole) {
    console.log(`[hasUserAccess] No role provided, looking up user to check role`);
    const sessionUser = await getUserByIdentifier(sessionUserId);
    if (!sessionUser) {
      console.log(`[hasUserAccess] DENIED - Could not find session user: ${sessionUserId}`);
      return false;
    }
    
    if (sessionUser.role === 'ADMIN' || sessionUser.role === 'SUPER_ADMIN') {
      console.log(`[hasUserAccess] GRANTED - User has admin role after lookup: ${sessionUser.role}`);
      return true;
    }
  }
  
  // Default to no access
  console.log(`[hasUserAccess] DENIED - No access conditions met for user ${sessionUserId} to access ${targetUserId}`);
  return false;
}

/**
 * Get user data with additional related data (subscription, settings, etc)
 * 
 * @param userId ID of the user to fetch
 * @returns Enhanced user object with related data or null if not found
 */
export async function getUserWithRelatedData(userId: string): Promise<EnhancedUser | null> {
  try {
    const userResult = await prisma.$queryRaw`
      SELECT 
        u.*,
        s.id as settingsId,
        s.eventName as settingsEventName,
        s.adminEmail as settingsAdminEmail,
        sub.tier as subscriptionTier,
        sub.status as subscriptionStatus
      FROM User u
      LEFT JOIN Settings s ON u.id = s.userId
      LEFT JOIN Subscription sub ON u.id = sub.userId
      WHERE u.id = ${userId}
      LIMIT 1
    `;
    
    return Array.isArray(userResult) && userResult.length > 0 
      ? transformUserData(userResult[0]) 
      : null;
  } catch (error) {
    console.error("Error getting user with related data:", error);
    return null;
  }
}

/**
 * Transform raw user data from SQL query into a structured object
 */
function transformUserData(rawData: any): EnhancedUser {
  // Create base user object
  const user: EnhancedUser = {
    id: rawData.id,
    name: rawData.name,
    email: rawData.email,
    username: rawData.username,
    role: rawData.role,
  };
  
  // Add settings if they exist
  if (rawData.settingsId) {
    user.settings = {
      id: rawData.settingsId,
      eventName: rawData.settingsEventName,
      adminEmail: rawData.settingsAdminEmail,
    };
  }
  
  // Add subscription if it exists
  if (rawData.subscriptionTier) {
    user.subscription = {
      tier: rawData.subscriptionTier,
      status: rawData.subscriptionStatus,
    };
  }
  
  return user;
} 