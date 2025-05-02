import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const fileName = file.name.toLowerCase();
    const isAllowedMediaType = 
      fileName.endsWith('.jpg') || 
      fileName.endsWith('.jpeg') || 
      fileName.endsWith('.png') || 
      fileName.endsWith('.gif') || 
      fileName.endsWith('.mp4') || 
      fileName.endsWith('.webm');

    if (!isAllowedMediaType) {
      return NextResponse.json(
        { error: 'Only image and video files are allowed' },
        { status: 400 }
      );
    }
    
    // Get upload pathname from form data or generate one
    const pathname = formData.get('pathname') as string || `uploads/${Date.now()}-${file.name}`;
    
    // Upload the file directly
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false, // Use the exact pathname
      contentType: file.type, // Use the file's content type
    });
    
    // Log the upload
    console.log('Upload completed for:', blob.url);
    
    return NextResponse.json(blob);
  } catch (error) {
    console.error('Client upload error:', error);
    return NextResponse.json(
      { error: 'Failed to handle client upload', details: (error as Error).message },
      { status: 500 }
    );
  }
} 