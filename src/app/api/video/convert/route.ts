import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile, unlink } from 'fs/promises';
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
    const filter = formData.get('filter') as string;
    
    if (!videoFile) {
      return NextResponse.json(
        { error: { message: 'No video file provided' } },
        { status: 400 }
      );
    }

    console.log(`Received video: ${videoFile.name}, size: ${videoFile.size} bytes, type: ${videoFile.type}`);
    
    // Create unique ID for this video
    const videoId = uuidv4();
    const videosDir = await ensurePublicVideosDir();
    
    // Save the WebM file directly to public directory
    const publicPath = path.join(videosDir, `${videoId}.webm`);
    
    console.log(`Saving video to: ${publicPath}`);
    await writeFile(publicPath, Buffer.from(await videoFile.arrayBuffer()));
    
    // Video URL relative to public directory
    const videoUrl = `/videos/${videoId}.webm`;
    
    return NextResponse.json({
      success: true,
      videoUrl,
      videoId
    });
  } catch (error) {
    console.error('Error processing video:', error);
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to process video',
          details: error instanceof Error ? error.message : String(error)
        } 
      },
      { status: 500 }
    );
  }
} 