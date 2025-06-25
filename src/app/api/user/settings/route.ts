/**
 * User Settings API Routes
 * 
 * GET /api/user/settings - Get the current user's settings
 * GET /api/user/settings?eventUrlId=xyz - Get settings for a specific event URL
 * PATCH /api/user/settings - Update the current user's settings
 * PATCH /api/user/settings?eventUrlId=xyz - Update settings for a specific event URL
 */
import { NextRequest } from 'next/server';
import { handleGetUserSettings, handleUpdateUserSettings } from '@/lib/settings-controller';

/**
 * GET /api/user/settings
 * Get booth settings for the authenticated user
 * Can include eventUrlId query param for specific event URL settings
 */
export async function GET(request: NextRequest) {
  return handleGetUserSettings(request);
}

/**
 * PATCH /api/user/settings
 * Update booth settings for the authenticated user
 * Can include eventUrlId query param for specific event URL settings
 */
export async function PATCH(request: NextRequest) {
  return handleUpdateUserSettings(request);
} 