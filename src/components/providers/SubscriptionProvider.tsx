'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { hasFeature, SubscriptionTier, SubscriptionDuration } from '@/lib/subscription-features';

// Define the subscription context type
type Subscription = {
  id: string;
  tier: SubscriptionTier;
  duration: SubscriptionDuration;
  status: string;
  startDate: Date;
  endDate: Date;
  trialEndDate?: Date | null;
  maxMedia: number;
  maxEmails: number;
  maxVideoDuration: number;
  maxDays: number;
  customDomain: boolean;
  analyticsAccess: boolean;
  filterAccess: boolean;
  videoAccess: boolean;
  aiEnhancement: boolean;
  journeyBuilder: boolean;
  brandingRemoval: boolean;
  prioritySupport: boolean;
};

// Usage metrics context type
type UsageMetrics = {
  mediaCount: number;
  emailsSent: number;
};

// Subscription context interface
interface SubscriptionContextType {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  usageMetrics: UsageMetrics;
  hasFeature: (featureName: keyof Subscription) => boolean;
  getRemainingMedia: () => number;
  getRemainingEmails: () => number;
  refreshSubscription: () => Promise<void>;
}

// Create the context with a default value
const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  isLoading: true,
  error: null,
  usageMetrics: { mediaCount: 0, emailsSent: 0 },
  hasFeature: () => false,
  getRemainingMedia: () => 0,
  getRemainingEmails: () => 0,
  refreshSubscription: async () => {}
});

// Provider component
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics>({ mediaCount: 0, emailsSent: 0 });

  // Function to fetch subscription data
  const fetchSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/subscription');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription data');
      }
      
      const data = await response.json();
      
      if (data.subscription) {
        // Parse dates from strings to Date objects
        data.subscription.startDate = new Date(data.subscription.startDate);
        data.subscription.endDate = new Date(data.subscription.endDate);
        
        if (data.subscription.trialEndDate) {
          data.subscription.trialEndDate = new Date(data.subscription.trialEndDate);
        }
        
        setSubscription(data.subscription);
        setUsageMetrics({
          mediaCount: data.mediaCount || 0,
          emailsSent: data.emailsSent || 0
        });
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch subscription data when session changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchSubscription();
    } else if (status === 'unauthenticated') {
      setSubscription(null);
      setIsLoading(false);
    }
  }, [session, status]);

  // Check if user has a specific feature
  const checkFeature = (featureName: keyof Subscription): boolean => {
    if (!subscription) return false;
    
    // Only pass feature names that are in the subscriptionFeatures object
    const isFeatureName = 
      featureName === 'customDomain' ||
      featureName === 'analyticsAccess' ||
      featureName === 'filterAccess' ||
      featureName === 'videoAccess' ||
      featureName === 'aiEnhancement' ||
      featureName === 'journeyBuilder' ||
      featureName === 'brandingRemoval' ||
      featureName === 'prioritySupport';
      
    if (isFeatureName) {
      const result = hasFeature(subscription, featureName as any);
      // Convert the result to boolean explicitly
      return result === true;
    }
    
    // For non-feature properties, check if they exist in the subscription
    return Boolean(subscription[featureName]);
  };

  // Calculate remaining media
  const getRemainingMedia = (): number => {
    if (!subscription) return 0;
    const max = subscription.maxMedia;
    const used = usageMetrics.mediaCount;
    return Math.max(0, max - used);
  };

  // Calculate remaining emails
  const getRemainingEmails = (): number => {
    if (!subscription) return 0;
    const max = subscription.maxEmails;
    const used = usageMetrics.emailsSent;
    return Math.max(0, max - used);
  };

  // Refresh subscription data
  const refreshSubscription = async (): Promise<void> => {
    await fetchSubscription();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        error,
        usageMetrics,
        hasFeature: checkFeature,
        getRemainingMedia,
        getRemainingEmails,
        refreshSubscription
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

// Custom hook to use the subscription context
export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  
  return context;
} 