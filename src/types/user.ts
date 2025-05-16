/**
 * User role enum - matches the Prisma schema
 * Note: This will be used once the database migration is applied
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER'
}

/**
 * Extended user type with role
 * This is the ideal type that will be used after database migration
 */
export interface ExtendedUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role: UserRole;
}

/**
 * Current user type without role field
 * This matches the current database schema
 */
export interface CurrentUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}

/**
 * Check if a user has admin privileges based on the role
 * Note: This will be used once the database migration is applied
 */
export function isAdmin(user: ExtendedUser | null | undefined): boolean {
  return user?.role === UserRole.ADMIN;
}

/**
 * Check if a user is the system admin (matches admin email in env)
 * This is currently the primary method for checking admin status
 */
export function isSystemAdmin(user: { email: string } | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  return !!adminEmail && !!user?.email && user.email.toLowerCase() === adminEmail.toLowerCase();
}

/**
 * Check if a user is an admin based on settings table
 * This is a fallback method for checking admin status
 */
export function isSettingsAdmin(userEmail: string, settingsAdminEmail: string | null | undefined): boolean {
  return !!settingsAdminEmail && userEmail.toLowerCase() === settingsAdminEmail.toLowerCase();
} 