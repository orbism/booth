// src/lib/subscription-features.ts

// Define the enum types to match Prisma's schema
export enum SubscriptionTier {
  FREE = "FREE",
  BRONZE = "BRONZE",
  SILVER = "SILVER",
  GOLD = "GOLD",
  PLATINUM = "PLATINUM",
  ADMIN = "ADMIN"
}

export enum SubscriptionDuration {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  ANNUAL = "ANNUAL",
  TRIAL = "TRIAL"
}

/**
 * Feature matrix for subscription tiers
 * These are the default values that will be used for each tier
 */
export const subscriptionFeatures = {
  [SubscriptionTier.FREE]: {
    maxMedia: 5,
    maxEmails: 5,
    maxVideoDuration: 10, // in seconds
    maxDays: 1, // trial days
    customDomain: false,
    analyticsAccess: false,
    filterAccess: false,
    videoAccess: true,
    aiEnhancement: false,
    journeyBuilder: false,
    brandingRemoval: false,
    prioritySupport: false,
  },
  [SubscriptionTier.BRONZE]: {
    maxMedia: 100,
    maxEmails: 100,
    maxVideoDuration: 15,
    maxDays: 30, // 1 month
    customDomain: false,
    analyticsAccess: true,
    filterAccess: true,
    videoAccess: true,
    aiEnhancement: false,
    journeyBuilder: false,
    brandingRemoval: false,
    prioritySupport: false,
  },
  [SubscriptionTier.SILVER]: {
    maxMedia: 500,
    maxEmails: 500,
    maxVideoDuration: 30,
    maxDays: 30, // 1 month
    customDomain: true,
    analyticsAccess: true,
    filterAccess: true,
    videoAccess: true,
    aiEnhancement: true,
    journeyBuilder: false,
    brandingRemoval: false,
    prioritySupport: false,
  },
  [SubscriptionTier.GOLD]: {
    maxMedia: 2000,
    maxEmails: 2000,
    maxVideoDuration: 60,
    maxDays: 30, // 1 month
    customDomain: true,
    analyticsAccess: true,
    filterAccess: true,
    videoAccess: true,
    aiEnhancement: true,
    journeyBuilder: true,
    brandingRemoval: true,
    prioritySupport: false,
  },
  [SubscriptionTier.PLATINUM]: {
    maxMedia: 10000,
    maxEmails: 10000,
    maxVideoDuration: 120,
    maxDays: 30, // 1 month
    customDomain: true,
    analyticsAccess: true,
    filterAccess: true,
    videoAccess: true,
    aiEnhancement: true,
    journeyBuilder: true,
    brandingRemoval: true,
    prioritySupport: true,
  },
  [SubscriptionTier.ADMIN]: {
    maxMedia: Infinity,
    maxEmails: Infinity,
    maxVideoDuration: Infinity,
    maxDays: Infinity,
    customDomain: true,
    analyticsAccess: true,
    filterAccess: true,
    videoAccess: true,
    aiEnhancement: true,
    journeyBuilder: true,
    brandingRemoval: true,
    prioritySupport: true,
  },
};

/**
 * Pricing matrix for subscription tiers and durations
 * Prices are in USD cents
 */
export const subscriptionPricing = {
  [SubscriptionTier.FREE]: {
    [SubscriptionDuration.TRIAL]: 0,
    [SubscriptionDuration.MONTHLY]: 0,
    [SubscriptionDuration.QUARTERLY]: 0,
    [SubscriptionDuration.ANNUAL]: 0,
  },
  [SubscriptionTier.BRONZE]: {
    [SubscriptionDuration.MONTHLY]: 2900, // $29/month
    [SubscriptionDuration.QUARTERLY]: 7900, // $79/quarter (~$26.33/month)
    [SubscriptionDuration.ANNUAL]: 29900, // $299/year (~$24.92/month)
    [SubscriptionDuration.TRIAL]: 0,
  },
  [SubscriptionTier.SILVER]: {
    [SubscriptionDuration.MONTHLY]: 4900, // $49/month
    [SubscriptionDuration.QUARTERLY]: 13900, // $139/quarter (~$46.33/month)
    [SubscriptionDuration.ANNUAL]: 49900, // $499/year (~$41.58/month)
    [SubscriptionDuration.TRIAL]: 0,
  },
  [SubscriptionTier.GOLD]: {
    [SubscriptionDuration.MONTHLY]: 9900, // $99/month
    [SubscriptionDuration.QUARTERLY]: 27900, // $279/quarter (~$93/month)
    [SubscriptionDuration.ANNUAL]: 99900, // $999/year (~$83.25/month)
    [SubscriptionDuration.TRIAL]: 0,
  },
  [SubscriptionTier.PLATINUM]: {
    [SubscriptionDuration.MONTHLY]: 19900, // $199/month
    [SubscriptionDuration.QUARTERLY]: 54900, // $549/quarter (~$183/month)
    [SubscriptionDuration.ANNUAL]: 199900, // $1999/year (~$166.58/month)
    [SubscriptionDuration.TRIAL]: 0,
  },
  [SubscriptionTier.ADMIN]: {
    [SubscriptionDuration.MONTHLY]: 0,
    [SubscriptionDuration.QUARTERLY]: 0,
    [SubscriptionDuration.ANNUAL]: 0,
    [SubscriptionDuration.TRIAL]: 0,
  },
};

/**
 * Get features for a specific subscription tier
 */
export function getFeatures(tier: SubscriptionTier) {
  return subscriptionFeatures[tier] || subscriptionFeatures[SubscriptionTier.FREE];
}

/**
 * Get price for a specific subscription tier and duration
 */
export function getPrice(tier: SubscriptionTier, duration: SubscriptionDuration) {
  return subscriptionPricing[tier]?.[duration] || 0;
}

/**
 * Format price as currency
 */
export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price / 100);
}

/**
 * Get formatted price for a specific tier and duration
 */
export function getFormattedPrice(tier: SubscriptionTier, duration: SubscriptionDuration) {
  const price = getPrice(tier, duration);
  return formatPrice(price);
}

/**
 * Get feature comparison for all tiers
 */
export function getFeatureComparison() {
  const tiers = [
    SubscriptionTier.FREE,
    SubscriptionTier.BRONZE,
    SubscriptionTier.SILVER,
    SubscriptionTier.GOLD,
    SubscriptionTier.PLATINUM,
  ];
  
  return tiers.map(tier => ({
    tier,
    features: subscriptionFeatures[tier],
    pricing: {
      monthly: getFormattedPrice(tier, SubscriptionDuration.MONTHLY),
      quarterly: getFormattedPrice(tier, SubscriptionDuration.QUARTERLY),
      annual: getFormattedPrice(tier, SubscriptionDuration.ANNUAL),
    }
  }));
}

/**
 * Check if a user has a specific feature
 */
export function hasFeature(subscription: { tier?: SubscriptionTier } | null | undefined, featureName: keyof typeof subscriptionFeatures[SubscriptionTier.FREE]) {
  if (!subscription) {
    // Default to free tier features
    return subscriptionFeatures[SubscriptionTier.FREE][featureName];
  }
  
  // If the feature was manually overridden in the subscription record, use that value
  if (typeof subscription[featureName as keyof typeof subscription] !== 'undefined') {
    return subscription[featureName as keyof typeof subscription];
  }
  
  // Otherwise, use the default value for this tier
  const tier = subscription.tier || SubscriptionTier.FREE;
  return subscriptionFeatures[tier]?.[featureName] ??
    subscriptionFeatures[SubscriptionTier.FREE][featureName];
}

/**
 * Get tier display name
 */
export function getTierName(tier: SubscriptionTier) {
  const names = {
    [SubscriptionTier.FREE]: 'Free Trial',
    [SubscriptionTier.BRONZE]: 'Bronze',
    [SubscriptionTier.SILVER]: 'Silver',
    [SubscriptionTier.GOLD]: 'Gold',
    [SubscriptionTier.PLATINUM]: 'Platinum',
    [SubscriptionTier.ADMIN]: 'Admin',
  };
  
  return names[tier] || 'Unknown';
}

/**
 * Get duration display name
 */
export function getDurationName(duration: SubscriptionDuration) {
  const names = {
    [SubscriptionDuration.TRIAL]: 'Trial',
    [SubscriptionDuration.MONTHLY]: 'Monthly',
    [SubscriptionDuration.QUARTERLY]: 'Quarterly',
    [SubscriptionDuration.ANNUAL]: 'Annual',
  };
  
  return names[duration] || 'Unknown';
} 