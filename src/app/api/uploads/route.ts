import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { generateUuid } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';

/**
 * Handle file uploads and store them using the configured storage provider
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication for upload permissions
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get directory from form data or default to 'media'
    const directory = (formData.get('directory') as string) || 'media';
    
    // Validate file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type (basic validation)
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFilename = `${generateUuid()}.${fileExtension}`;

    // Upload the file using the storage module
    const result = await storage.uploadFile(
      file,
      uniqueFilename,
      {
        directory,
        access: 'public',
        addRandomSuffix: false,
        metadata: {
          contentType: file.type,
          originalName: file.name,
          uploader: session.user?.email || 'unknown',
        }
      }
    );

    // Return the upload result
    return NextResponse.json({
      success: true,
      url: result.url,
      filename: uniqueFilename,
      path: result.pathname,
      size: result.size,
      contentType: result.contentType,
      provider: result.provider
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication for deletion permissions
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the file path from the URL
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'No file path provided' },
        { status: 400 }
      );
    }

    // Delete the file using the storage module
    const result = await storage.deleteFile(filePath);
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'File not found or could not be deleted' },
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if a file exists
export async function GET(request: NextRequest) {
  try {
    // Get the file path from the URL
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'No file path provided' },
        { status: 400 }
      );
    }

    // Check if the file exists
    const exists = await storage.fileExists(filePath);
    
    if (exists) {
      // Get file info
      const fileInfo = await storage.getFileInfo(filePath);
      
      return NextResponse.json({
        exists: true,
        info: fileInfo
      });
    } else {
      return NextResponse.json({
        exists: false
      });
    }
    
  } catch (error) {
    console.error('File check error:', error);
    return NextResponse.json(
      { error: 'File check failed' },
      { status: 500 }
    );
  }
} 