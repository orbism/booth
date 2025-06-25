/**
 * Permission Utilities
 * 
 * This module provides a unified approach to permission checking across the application.
 * It centralizes access control logic and provides consistent error handling and logging.
 */

import { prisma } from './prisma';

// Types for permission checking
export type UserInfo = {
  id: string;
  role: string;
  username?: string | null;
};

export type PermissionTarget = {
  resourceType: 'user' | 'eventUrl' | 'session' | 'settings';
  resourceId: string;
  resourceOwnerId?: string;
};

export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'manage' | 'email';

export type PermissionResult = {
  allowed: boolean;
  reason?: string;
  error?: Error;
};

/**
 * Determines if the current user can access another user's data
 * 
 * Rules:
 * - ADMIN users can access any user's data
 * - CUSTOMER users can only access their own data
 * 
 * @param currentUser The current authenticated user
 * @param targetUserId The ID of the user whose data is being accessed
 * @returns True if access is allowed, false otherwise
 */
export async function canAccessUserData(
  currentUser: UserInfo,
  targetUserId: string
): Promise<PermissionResult> {
  try {
    // Log the permission check
    console.log(`[PERMISSION] Checking if user ${currentUser.id} (${currentUser.role}) can access user ${targetUserId}'s data`);
    
    // Admin can access any user's data
    if (currentUser.role === 'ADMIN') {
      console.log(`[PERMISSION] ADMIN access granted for user ${currentUser.id} to user ${targetUserId}`);
      return { allowed: true };
    }
    
    // Users can access their own data
    if (currentUser.id === targetUserId) {
      console.log(`[PERMISSION] Self-access granted for user ${currentUser.id}`);
      return { allowed: true };
    }
    
    // Otherwise, access is denied
    console.log(`[PERMISSION] Access DENIED for user ${currentUser.id} to user ${targetUserId}`);
    return { allowed: false, reason: 'You do not have permission to access this user\'s data' };
  } catch (error) {
    console.error('[PERMISSION ERROR] Error checking user data access:', error);
    return { 
      allowed: false, 
      reason: 'An error occurred while checking permissions', 
      error: error instanceof Error ? error : new Error('Unknown error') 
    };
  }
}

/**
 * Determines if the current user can perform a specific action on an event URL
 * 
 * Rules:
 * - ADMIN users can manage any event URL
 * - CUSTOMER users can only manage their own event URLs
 * 
 * @param currentUser The current authenticated user
 * @param eventUrlId The ID of the event URL being accessed
 * @param action The action being performed
 * @returns Promise resolving to a PermissionResult
 */
export async function canManageEventUrl(
  currentUser: UserInfo,
  eventUrlId: string,
  action: PermissionAction = 'read'
): Promise<PermissionResult> {
  try {
    console.log(`[PERMISSION] Checking if user ${currentUser.id} (${currentUser.role}) can ${action} event URL ${eventUrlId}`);
    
    // Admin can manage any event URL
    if (currentUser.role === 'ADMIN') {
      console.log(`[PERMISSION] ADMIN access granted for ${action} on event URL ${eventUrlId}`);
      return { allowed: true };
    }
    
    // Fetch the event URL to check ownership
    const eventUrl = await prisma.$queryRaw`
      SELECT userId FROM EventUrl WHERE id = ${eventUrlId} LIMIT 1
    `;
    
    // If event URL not found
    if (!Array.isArray(eventUrl) || eventUrl.length === 0) {
      console.log(`[PERMISSION] Event URL ${eventUrlId} not found`);
      return { allowed: false, reason: 'Event URL not found' };
    }
    
    const eventUrlData = eventUrl[0] as { userId: string };
    
    // Check if user owns this event URL
    if (currentUser.id === eventUrlData.userId) {
      console.log(`[PERMISSION] Owner access granted for ${action} on event URL ${eventUrlId}`);
      return { allowed: true };
    }
    
    // Otherwise, access is denied
    console.log(`[PERMISSION] Access DENIED for ${action} on event URL ${eventUrlId} - not owner`);
    return { allowed: false, reason: 'You do not have permission to manage this event URL' };
  } catch (error) {
    console.error('[PERMISSION ERROR] Error checking event URL permissions:', error);
    return {
      allowed: false,
      reason: 'An error occurred while checking permissions',
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

/**
 * Determines if the current user can perform a specific action on a booth session
 * 
 * Rules:
 * - ADMIN users can manage any session
 * - CUSTOMER users can only manage sessions associated with their event URLs
 * 
 * @param currentUser The current authenticated user
 * @param sessionId The ID of the session being accessed
 * @param action The action being performed
 * @returns Promise resolving to a PermissionResult
 */
export async function canManageSession(
  currentUser: UserInfo,
  sessionId: string,
  action: PermissionAction = 'read'
): Promise<PermissionResult> {
  try {
    console.log(`[PERMISSION] Checking if user ${currentUser.id} (${currentUser.role}) can ${action} session ${sessionId}`);
    
    // Admin can manage any session
    if (currentUser.role === 'ADMIN') {
      console.log(`[PERMISSION] ADMIN access granted for ${action} on session ${sessionId}`);
      return { allowed: true };
    }
    
    // Fetch the session to check ownership
    const sessions = await prisma.$queryRaw`
      SELECT bs.id, bs.eventUrlId, e.userId
      FROM BoothSession bs
      LEFT JOIN EventUrl e ON bs.eventUrlId = e.id
      WHERE bs.id = ${sessionId}
      LIMIT 1
    `;
    
    // If session not found
    if (!Array.isArray(sessions) || sessions.length === 0) {
      console.log(`[PERMISSION] Session ${sessionId} not found`);
      return { allowed: false, reason: 'Session not found' };
    }
    
    const sessionData = sessions[0] as { id: string; eventUrlId: string | null; userId: string | null };
    
    // Check if user owns the event URL associated with this session
    if (sessionData.userId && currentUser.id === sessionData.userId) {
      console.log(`[PERMISSION] Owner access granted for ${action} on session ${sessionId}`);
      return { allowed: true };
    }
    
    // Otherwise, access is denied
    console.log(`[PERMISSION] Access DENIED for ${action} on session ${sessionId} - not owner`);
    return { allowed: false, reason: 'You do not have permission to manage this session' };
  } catch (error) {
    console.error('[PERMISSION ERROR] Error checking session permissions:', error);
    return {
      allowed: false,
      reason: 'An error occurred while checking permissions',
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

/**
 * Determines if the current user can perform a specific action on settings
 * 
 * Rules:
 * - ADMIN users can manage any user's settings
 * - CUSTOMER users can only manage their own settings
 * 
 * @param currentUser The current authenticated user
 * @param settingsUserId The user ID associated with the settings
 * @param action The action being performed
 * @returns Promise resolving to a PermissionResult
 */
export async function canManageSettings(
  currentUser: UserInfo,
  settingsUserId: string,
  action: PermissionAction = 'read'
): Promise<PermissionResult> {
  try {
    console.log(`[PERMISSION] Checking if user ${currentUser.id} (${currentUser.role}) can ${action} settings for user ${settingsUserId}`);
    
    // Admin can manage any settings
    if (currentUser.role === 'ADMIN') {
      console.log(`[PERMISSION] ADMIN access granted for ${action} on settings for user ${settingsUserId}`);
      return { allowed: true };
    }
    
    // Users can manage their own settings
    if (currentUser.id === settingsUserId) {
      console.log(`[PERMISSION] Self-access granted for ${action} on settings for user ${currentUser.id}`);
      return { allowed: true };
    }
    
    // Otherwise, access is denied
    console.log(`[PERMISSION] Access DENIED for ${action} on settings for user ${settingsUserId} - not owner`);
    return { allowed: false, reason: 'You do not have permission to manage these settings' };
  } catch (error) {
    console.error('[PERMISSION ERROR] Error checking settings permissions:', error);
    return {
      allowed: false,
      reason: 'An error occurred while checking permissions',
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

/**
 * General permission check function
 * 
 * This function serves as a unified interface for permission checking,
 * delegating to the appropriate specialized function based on resource type.
 * 
 * @param currentUser The current authenticated user
 * @param target The resource being accessed
 * @param action The action being performed
 * @returns Promise resolving to a PermissionResult
 */
export async function checkPermission(
  currentUser: UserInfo,
  target: PermissionTarget,
  action: PermissionAction
): Promise<PermissionResult> {
  // Log the permission check attempt
  console.log(`[PERMISSION] Checking permission for user ${currentUser.id} (${currentUser.role}) to ${action} ${target.resourceType} ${target.resourceId}`);
  
  try {
    // Switch based on resource type
    switch (target.resourceType) {
      case 'user':
        return await canAccessUserData(currentUser, target.resourceId);
      
      case 'eventUrl':
        return await canManageEventUrl(currentUser, target.resourceId, action);
      
      case 'session':
        return await canManageSession(currentUser, target.resourceId, action);
      
      case 'settings':
        return await canManageSettings(currentUser, target.resourceId, action);
      
      default:
        console.log(`[PERMISSION] Unknown resource type: ${target.resourceType}`);
        return { allowed: false, reason: `Unknown resource type: ${target.resourceType}` };
    }
  } catch (error) {
    console.error('[PERMISSION ERROR] Error in checkPermission:', error);
    return {
      allowed: false,
      reason: 'An error occurred while checking permissions',
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
} 