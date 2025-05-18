import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('GET /api/test received');
  return NextResponse.json({ 
    message: 'Test API is working', 
    timestamp: new Date().toISOString() 
  });
}

export async function POST(request: NextRequest) {
  console.log('POST /api/test received');
  
  let body;
  try {
    body = await request.json();
    console.log('Request body:', body);
  } catch (e) {
    console.error('Error parsing request body:', e);
    body = null;
  }
  
  return NextResponse.json({ 
    message: 'Test API POST is working', 
    receivedData: body,
    timestamp: new Date().toISOString() 
  });
} 