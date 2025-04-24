import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-check';

export async function GET(req: NextRequest) {
  return checkAuth(req, () => {
    // This will only run if authenticated
    return NextResponse.json({ 
      status: 'success',
      message: 'You are authenticated!' 
    });
  });
} 