'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SubscriptionTier, TierLimits, tierLimits } from './subscription-features';
import { useSession } from 'next-auth/react';

// Define the Subscription data interface
export interface SubscriptionData {
  id: string;
  tier: SubscriptionTier;
  status: string;
  endDate: Date;
  trialEndDate?: Date | null;
  
  // Limits
  maxMedia: number;
  maxEmails: number;
  maxVideoDuration: number;
  maxDays: number;
  
  // Feature flags
  customDomain: boolean;
  analyticsAccess: boolean;
  filterAccess: boolean;
  videoAccess: boolean;
  aiEnhancement: boolean;
  journeyBuilder: boolean;
  brandingRemoval: boolean;
  prioritySupport: boolean;
}

// Define the user usage interface
export interface UserUsage {
  mediaCount: number;
  emailsSent: number;
}

// Define the context interface
interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  isLoading: boolean;
  error: string | null;
  usage: UserUsage;
  isFeatureEnabled: (feature: keyof TierLimits) => boolean;
  hasReachedLimit: (limit: 'media' | 'emails') => boolean;
  refreshSubscription: () => Promise<void>;
  getVideoDurationLimit: () => number;
  daysRemaining: number;
  isTrialActive: boolean;
}

// Create the context with default values
const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  isLoading: true,
  error: null,
  usage: { mediaCount: 0, emailsSent: 0 },
  isFeatureEnabled: () => false,
  hasReachedLimit: () => false,
  refreshSubscription: async () => {},
  getVideoDurationLimit: () => 10,
  daysRemaining: 0,
  isTrialActive: false,
});

// Provider component
export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UserUsage>({ mediaCount: 0, emailsSent: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate days remaining and trial status
  const daysRemaining = subscription ? 
    Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 
    0;
    
  const isTrialActive = subscription?.status === 'TRIAL' && daysRemaining > 0;

  // Fetch subscription data
  const fetchSubscription = async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/subscription');
      
      if (!response.ok) {
        throw new Error(`Error fetching subscription: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSubscription(data.subscription);
      setUsage(data.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to fetch subscription:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if a feature is enabled based on subscription tier
  const isFeatureEnabled = (feature: keyof TierLimits): boolean => {
    if (!subscription) return false;
    
    // Admins always have access to all features
    if (subscription.tier === SubscriptionTier.ADMIN) return true;
    
    // Check if feature is available in current tier
    return subscription[feature] === true;
  };
  
  // Check if user has reached limit
  const hasReachedLimit = (limit: 'media' | 'emails'): boolean => {
    if (!subscription) return true;
    
    // Admins have no limits
    if (subscription.tier === SubscriptionTier.ADMIN) return false;
    
    if (limit === 'media') {
      return subscription.maxMedia !== -1 && usage.mediaCount >= subscription.maxMedia;
    } else if (limit === 'emails') {
      return subscription.maxEmails !== -1 && usage.emailsSent >= subscription.maxEmails;
    }
    
    return false;
  };
  
  // Get video duration limit
  const getVideoDurationLimit = (): number => {
    if (!subscription) return 10; // Default limit
    return subscription.maxVideoDuration;
  };
  
  // Refresh subscription data
  const refreshSubscription = async () => {
    await fetchSubscription();
  };
  
  // Initial fetch
  useEffect(() => {
    if (session?.user) {
      fetchSubscription();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      isLoading,
      error,
      usage,
      isFeatureEnabled,
      hasReachedLimit,
      refreshSubscription,
      getVideoDurationLimit,
      daysRemaining,
      isTrialActive
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Custom hook for using the subscription context
export const useSubscription = () => useContext(SubscriptionContext);

// Helper hook for checking feature access with fallback
export function useFeatureAccess(feature: keyof TierLimits, fallback: boolean = false): boolean {
  const { isFeatureEnabled, isLoading } = useSubscription();
  
  if (isLoading) return fallback;
  return isFeatureEnabled(feature);
} 