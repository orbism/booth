import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Reserved keywords that can't be used as URLs
const RESERVED_KEYWORDS = [
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
];

export async function GET(request: NextRequest) {
  try {
    // Get the URL from the query params
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { available: false, error: 'URL parameter is required' },
        { status: 400 }
      );
    }
    
    // Check if URL is a reserved keyword
    if (RESERVED_KEYWORDS.includes(url.toLowerCase())) {
      return NextResponse.json({ available: false, reason: 'reserved' });
    }
    
    // Check if URL is already in use
    const existingUrl = await prisma.eventUrl.findUnique({
      where: { urlPath: url.toLowerCase() }
    });
    
    // Return result
    return NextResponse.json({
      available: !existingUrl,
      reason: existingUrl ? 'taken' : null
    });
    
  } catch (error) {
    console.error('Error checking URL availability:', error);
    
    return NextResponse.json(
      { 
        available: false,
        error: 'Failed to check URL availability',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 