import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { createHash } from 'crypto';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '@/lib/auth-utils';

// Set bodyParser config
export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure videos directory exists in public
async function ensurePublicVideosDir() {
  const publicDir = path.join(process.cwd(), 'public', 'videos');
  try {
    await mkdir(publicDir, { recursive: true });
    return publicDir;
  } catch (error) {
    console.error('Failed to create public videos directory:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Start debug logging
    console.log('[VIDEO EMAIL API] Received video email request');
    
    // Get the current user - this is critical for associating the session with the right user
    const currentUser = await getCurrentUser();
    console.log(`[VIDEO EMAIL API] Current user: ${currentUser?.id || 'Not authenticated'}`);
    
    const sessionId = uuidv4();
    const timestamp = Date.now();
    const videoId = `video_${sessionId}_${timestamp}`;
    
    // Parse the form data
    const formData = await request.formData();
    console.log(`[VIDEO EMAIL API] Form data entries: ${Array.from(formData.entries()).map(([key]) => key).join(', ')}`);
    
    // Get form fields
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const webmFile = formData.get('video') as File; 
    const eventUrlId = formData.get('eventUrlId') as string;
    const eventUrlPath = formData.get('eventUrlPath') as string;
    
    // Debug log the values
    console.log(`[VIDEO EMAIL API] Extracted data:
- Name: ${name}
- Email: ${email}
- File name: ${webmFile?.name || 'No file'}
- File size: ${webmFile?.size || 0} bytes
- Event URL ID: ${eventUrlId || 'None'}
- Event URL Path: ${eventUrlPath || 'None'}
- Current User ID: ${currentUser?.id || 'None'}
`);
    
    if (!name || !email || !webmFile) {
      console.error('[VIDEO EMAIL API] Missing required fields in form data');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create uploads directory if it doesn't exist
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads');
    const videosDir = path.join(uploadsDir, 'videos');
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    if (!existsSync(videosDir)) {
      await mkdir(videosDir, { recursive: true });
    }
    
    // Generate a unique filename based on timestamp, session ID, and original filename
    const fileExtension = 'webm';
    const uniqueFilename = `${timestamp}_${sessionId}.${fileExtension}`;
    const filePath = path.join(videosDir, uniqueFilename);
    
    console.log(`[VIDEO EMAIL API] Generated file path: ${filePath}`);
    
    // Convert the File object to an ArrayBuffer
    const arrayBuffer = await webmFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write the file to disk
    await writeFile(filePath, buffer);
    
    // URL path for retrieving the video (relative to the public dir)
    const webmUrl = `/uploads/videos/${uniqueFilename}`;
    console.log(`[VIDEO EMAIL API] File saved successfully at: ${webmUrl}`);
    
    // Now make an API call to process the video and send the email
    const processingApiUrl = new URL('/api/video/process-and-email', request.nextUrl.origin).href;
    console.log(`[VIDEO EMAIL API] Sending processing request to: ${processingApiUrl}`);
    
    // Data to send to the processing endpoint
    const processingData = {
      videoId,
      sessionId,
      name,
      email,
      webmUrl,
      userId: currentUser?.id, // Pass the user ID to associate with the session
      analyticsId: formData.get('analyticsId') as string,
      eventUrlId: eventUrlId || null,
      eventUrlPath: eventUrlPath || null
    };
    
    console.log(`[VIDEO EMAIL API] Processing data payload:`, JSON.stringify(processingData, null, 2));
    
    // Call the processing API
    const processingResponse = await fetch(processingApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processingData),
    });
    
    const processingResult = await processingResponse.json();
    
    console.log(`[VIDEO EMAIL API] Processing result:`, JSON.stringify(processingResult, null, 2));
    
    if (!processingResponse.ok) {
      console.error('[VIDEO EMAIL API] Failed to process video:', processingResult);
      return NextResponse.json(
        { 
          error: 'Failed to process video',
          details: processingResult.error
        }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Video uploaded successfully and email sent',
      webmUrl,
      mp4Url: processingResult.mp4Url,
      videoId,
      sessionId: processingResult.sessionId,
      emailSent: processingResult.emailSent
    });
    
  } catch (error) {
    console.error('[VIDEO EMAIL API] Server error:', error);
    
    return NextResponse.json(
      { 
        error: 'Server error', 
        message: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
} 