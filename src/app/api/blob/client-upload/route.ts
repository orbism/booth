import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';

export async function POST(request: Request) {
  try {
    // Using the simpler form of handleUpload that just takes the request
    const blob = await handleUpload({
      request,
      // Define the allowed file types and sizes
      onBeforeGenerateToken: async (pathname) => {
        // Validate file type based on pathname
        const lowercasePath = pathname.toLowerCase();
        const isAllowedMediaType = 
          lowercasePath.endsWith('.jpg') || 
          lowercasePath.endsWith('.jpeg') || 
          lowercasePath.endsWith('.png') || 
          lowercasePath.endsWith('.gif') || 
          lowercasePath.endsWith('.mp4') || 
          lowercasePath.endsWith('.webm');

        if (!isAllowedMediaType) {
          throw new Error('Only image and video files are allowed');
        }

        // Configure blob upload options
        return {
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB max for videos
          allowOverwrite: false,
        };
      },
      // Handle when the upload is complete
      onUploadCompleted: async ({ blob }) => {
        try {
          // Add your logic to track the upload in a database, trigger processing, etc.
          console.log('Upload completed for:', blob.url);
          
          // Example: Here you could add code to:
          // 1. Store a reference to the blob in your database
          // 2. Trigger processing for the media file
          // 3. Update processing status
        } catch (error) {
          // If something goes wrong, log it but don't fail the upload
          console.error('Error in onUploadCompleted:', error);
        }
      },
    });
    
    return NextResponse.json(blob);
  } catch (error) {
    console.error('Client upload error:', error);
    return NextResponse.json(
      { error: 'Failed to handle client upload', details: (error as Error).message },
      { status: 500 }
    );
  }
} 