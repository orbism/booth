// src/app/api/auth/error/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error') || 'Unknown error';
  
  // Log the error for debugging
  console.error('Authentication error:', error);
  
  // Redirect to login page with error message
  const redirectUrl = new URL('/login', request.url);
  redirectUrl.searchParams.set('error', error);
  
  return NextResponse.redirect(redirectUrl);
}