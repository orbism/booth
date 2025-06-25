/**
 * Create Default Settings API
 * For fixing missing settings issues
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { updateUserSettings } from '@/lib/settings-service';

export async function POST(request: NextRequest) {
  try {
    // Require authentication with admin privileges
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 403 });
    }
    
    // Parse request body for userId
    const body = await request.json();
    const { userId, urlPath } = body;
    
    // Validate inputs
    if (!userId && !urlPath) {
      return NextResponse.json(
        { error: 'Either userId or urlPath is required' }, 
        { status: 400 }
      );
    }
    
    // If only urlPath is provided, look up userId
    let targetUserId = userId;
    
    if (!targetUserId && urlPath) {
      const eventUrlResults = await prisma.$queryRaw`
        SELECT userId FROM EventUrl WHERE urlPath = ${urlPath} LIMIT 1
      `;
      
      if (!Array.isArray(eventUrlResults) || eventUrlResults.length === 0) {
        return NextResponse.json(
          { error: `No event URL found with path: ${urlPath}` },
          { status: 404 }
        );
      }
      
      targetUserId = (eventUrlResults[0] as { userId: string }).userId;
    }
    
    // Check if settings already exist
    const existingSettingsResults = await prisma.$queryRaw`
      SELECT id FROM Settings WHERE userId = ${targetUserId} LIMIT 1
    `;
    
    if (Array.isArray(existingSettingsResults) && existingSettingsResults.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Settings already exist for user ${targetUserId}`
      });
    }
    
    // Fetch event URL info to use the event name
    let eventName = 'My Photo Booth';
    
    if (urlPath) {
      const eventUrlResults = await prisma.$queryRaw`
        SELECT eventName FROM EventUrl WHERE urlPath = ${urlPath} LIMIT 1
      `;
      
      if (Array.isArray(eventUrlResults) && eventUrlResults.length > 0) {
        eventName = (eventUrlResults[0] as { eventName: string }).eventName;
      }
    }
    
    // Create default settings for the user
    const defaultSettings = {
      eventName,
      captureMode: 'photo',
      customJourneyEnabled: false,
      splashPageEnabled: false,
      printerEnabled: false,
      filtersEnabled: true,
      aiImageCorrection: false,
      showBoothBossLogo: true,
      countdownTime: 3,
      resetTime: 30,
      theme: 'custom',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
      buttonColor: '#3B82F6',
      textColor: '#111827'
    };
    
    // Create the settings using the settings service
    const newSettings = await updateUserSettings(targetUserId, defaultSettings, 'ADMIN');
    
    return NextResponse.json({
      success: true,
      message: `Created default settings for user ${targetUserId}`,
      settings: newSettings
    });
  } catch (error) {
    console.error('[CREATE_DEFAULT_SETTINGS] Error creating settings:', error);
    return NextResponse.json({ 
      error: 'Failed to create default settings',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 