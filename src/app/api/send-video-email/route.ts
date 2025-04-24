import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
    // Process the form data from the request
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const sessionId = formData.get('sessionId') as string || uuidv4();
    const analyticsId = formData.get('analyticsId') as string || null;
    
    if (!videoFile) {
      return NextResponse.json(
        { error: { message: 'No video file provided' } },
        { status: 400 }
      );
    }

    console.log(`Received video for processing:
User Name: ${name}
Session ID: ${sessionId}
User Email: ${email}
Video Size: ${videoFile.size} bytes
Video Type: ${videoFile.type}
    `);
    
    // Create unique ID for this video if not provided
    const videoId = uuidv4();
    const videosDir = await ensurePublicVideosDir();
    
    // Save the WebM file to public directory
    const webmPath = path.join(videosDir, `${videoId}.webm`);
    await writeFile(webmPath, Buffer.from(await videoFile.arrayBuffer()));
    
    // Video URL relative to public directory (WebM)
    const webmUrl = `/videos/${videoId}.webm`;
    
    // Simulate the path the MP4 will have when conversion is complete
    const mp4Url = `/videos/${videoId}.mp4`;
    
    // Log processing status
    console.log(`Video processing initiated:
User Name: ${name}
Session ID: ${sessionId}
User Email: ${email}
Preview WebM URL: ${webmUrl}
Final MP4 URL: ${mp4Url} (processing)
Email Status: Pending
    `);
    
    // Trigger background processing (in a real app, this would be a job queue)
    // Here we use setTimeout to simulate an asynchronous background process
    setTimeout(async () => {
      try {
        // Call the processing endpoint
        const response = await fetch(new URL('/api/video/process-and-email', request.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoId,
            sessionId,
            name,
            email,
            webmUrl,
            analyticsId
          }),
        });
        
        if (!response.ok) {
          console.error('Background processing failed:', await response.text());
        }
      } catch (error) {
        console.error('Error triggering background processing:', error);
      }
    }, 2000); // Simulate a 2-second delay before starting processing
    
    return NextResponse.json({
      success: true,
      message: "Video received and processing initiated",
      webmUrl,
      mp4Url,
      videoId,
      sessionId,
      emailSent: false // Indicate email hasn't been sent yet
    });
  } catch (error) {
    console.error('Error processing video:', error);
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to process video',
          details: error instanceof Error ? error.message : String(error)
        },
        emailSent: false
      },
      { status: 500 }
    );
  }
} 