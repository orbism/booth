// Define our own subscription tier type since we're having issues with the Prisma import
export type SubscriptionTier = 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'ADMIN';

export interface EventUrl {
  id: string;
  userId: string;
  urlPath: string;
  isActive: boolean;
  eventName: string;
  eventStartDate: Date | null;
  eventEndDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to check if a URL path is valid
export function isValidUrlPath(path: string): boolean {
  // Only allow lowercase letters, numbers, and hyphens
  const urlPathRegex = /^[a-z0-9-]+$/;
  return urlPathRegex.test(path);
}

// List of reserved keywords that can't be used as URL paths
export const RESERVED_KEYWORDS = [
  'admin',
  'api',
  'auth',
  'booth',
  'dashboard',
  'login',
  'logout',
  'register',
  'setup',
  'settings',
  'subscription',
  'support',
  'verify',
  'verify-email',
  'verify-success',
  'e',
];

// Check if a user can create more event URLs based on their subscription tier
export function canCreateMoreEventUrls(
  currentCount: number,
  tier: SubscriptionTier
): boolean {
  const limits: Record<SubscriptionTier, number> = {
    'FREE': 1,
    'BRONZE': 1,
    'SILVER': 2,
    'GOLD': 5,
    'PLATINUM': 10,
    'ADMIN': 999,
  };
  
  return currentCount < (limits[tier] || 1);
}

// Get the maximum number of URLs allowed for a subscription tier
export function getMaxEventUrlsForTier(tier: SubscriptionTier): number {
  const limits: Record<SubscriptionTier, number> = {
    'FREE': 1,
    'BRONZE': 1,
    'SILVER': 2,
    'GOLD': 5,
    'PLATINUM': 10,
    'ADMIN': 999,
  };
  
  return limits[tier] || 1;
} 