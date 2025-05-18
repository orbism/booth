/**
 * Route utility functions to ensure consistent path construction across the application
 */

/**
 * Generates a user-specific route path
 * @param username The username to include in the path
 * @param path Optional path segment to append (without leading slash)
 * @param isAdmin Whether to use the admin path structure
 * @returns Formatted route path
 */
export function getUserRoute(username: string, path: string = '', isAdmin: boolean = false): string {
  if (!username) return '/';
  
  const basePath = `/u/${username}`;
  
  if (!path) {
    return isAdmin ? `${basePath}/admin` : basePath;
  }
  
  // Remove leading slash if present
  const cleanPath = path.replace(/^\//, '');
  
  return isAdmin 
    ? `${basePath}/admin/${cleanPath}`
    : `${basePath}/${cleanPath}`;
}

/**
 * Gets the admin route equivalent for a user path
 * @param username The username
 * @param path The path segment (without leading slash)
 * @returns Admin route path
 */
export function getAdminRoute(username: string, path: string = ''): string {
  return getUserRoute(username, path, true);
}

/**
 * Maps a user route to its admin equivalent
 * e.g., /u/[username]/settings -> /u/[username]/admin/settings
 * @param currentPath The current user path
 * @param username The username
 * @returns The equivalent admin path
 */
export function mapUserToAdminRoute(currentPath: string, username: string): string {
  // Check if path matches the pattern /u/[username]/...
  const userPathPattern = new RegExp(`^/u/${username}/(.*)$`);
  const match = currentPath.match(userPathPattern);
  
  if (!match) return getAdminRoute(username);
  
  // Extract the path part after /u/[username]/
  const pathPart = match[1];
  
  // Map to admin route
  return getAdminRoute(username, pathPart);
}

/**
 * Maps an admin route to its user equivalent
 * e.g., /u/[username]/admin/settings -> /u/[username]/settings
 * @param currentPath The current admin path
 * @param username The username
 * @returns The equivalent user path
 */
export function mapAdminToUserRoute(currentPath: string, username: string): string {
  // Check if path matches the pattern /u/[username]/admin/...
  const adminPathPattern = new RegExp(`^/u/${username}/admin/(.*)$`);
  const match = currentPath.match(adminPathPattern);
  
  if (!match) return getUserRoute(username);
  
  // Extract the path part after /u/[username]/admin/
  const pathPart = match[1];
  
  // Map to user route
  return getUserRoute(username, pathPart);
} 