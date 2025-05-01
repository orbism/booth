import { NextResponse } from 'next/server';
import { head } from '@vercel/blob';

export async function GET(request: Request) {
  try {
    // Get the url from the query parameters
    const { searchParams } = new URL(request.url);
    const blobUrl = searchParams.get('url');

    if (!blobUrl) {
      return NextResponse.json(
        { error: 'No blob URL provided' },
        { status: 400 }
      );
    }

    // Check if the blob exists by using the head method
    try {
      const metadata = await head(blobUrl);
      
      // If we got here, the blob exists
      return NextResponse.json({
        exists: true,
        url: blobUrl,
        contentType: metadata.contentType,
      });
    } catch (headError) {
      // If there's an error with head, the blob doesn't exist or is inaccessible
      return NextResponse.json({
        exists: false,
        url: blobUrl,
        error: 'Blob not found or inaccessible'
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check blob status', details: (error as Error).message },
      { status: 500 }
    );
  }
} 