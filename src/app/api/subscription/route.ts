import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { SubscriptionTier, SubscriptionDuration } from '@/lib/subscription-features';

/**
 * GET handler for fetching a user's subscription data
 */
export async function GET(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Fetch user with subscription data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // If user doesn't have a subscription, create a free trial
    if (!user.subscription) {
      // Create a new subscription record for this user with free trial settings
      const newSubscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          tier: SubscriptionTier.FREE as any,
          duration: SubscriptionDuration.TRIAL as any,
          status: 'TRIAL',
          startDate: new Date(),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
          trialEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
          maxMedia: 5,
          maxEmails: 5,
          maxVideoDuration: 10,
          maxDays: 1,
          videoAccess: true,
        }
      });
      
      return NextResponse.json({
        subscription: newSubscription,
        mediaCount: user.mediaCount || 0,
        emailsSent: user.emailsSent || 0
      });
    }
    
    // Return user's subscription data
    return NextResponse.json({
      subscription: user.subscription,
      mediaCount: user.mediaCount || 0,
      emailsSent: user.emailsSent || 0
    });
    
  } catch (error) {
    console.error('Error fetching subscription:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch subscription data',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 