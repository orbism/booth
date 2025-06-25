/**
 * Booth Settings API Routes
 * 
 * GET /api/booth/settings?urlPath={urlPath} - Get settings for a specific booth URL
 */
import { NextRequest } from 'next/server';
import { handleGetSettingsByUrlPath } from '@/lib/settings-controller';

/**
 * GET /api/booth/settings
 * Fetch booth settings for a specific event URL path
 */
export async function GET(request: NextRequest) {
  return handleGetSettingsByUrlPath(request);
} 