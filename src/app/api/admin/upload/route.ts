// src/app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { handleApiError, unauthorizedResponse } from '@/lib/errors';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Get file extension
    const filename = file.name;
    const extension = filename.substring(filename.lastIndexOf('.'));
    
    // Generate a unique filename
    const uniqueFilename = `${uuidv4()}${extension}`;
    
    // Create directory path (public/uploads/journey)
    const dirPath = join(process.cwd(), 'public', 'uploads', 'journey');
    const filePath = join(dirPath, uniqueFilename);
    
    // Ensure directory exists
    await mkdir(dirPath, { recursive: true });
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write file to disk
    await writeFile(filePath, buffer);
    
    // Return the public URL
    const publicUrl = `/uploads/journey/${uniqueFilename}`;
    
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    return handleApiError(error, 'Failed to upload file');
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};