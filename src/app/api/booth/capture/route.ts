// src/app/api/booth/capture/route.ts

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { sendBoothPhoto, sendBoothVideo } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    console.log('API: Booth capture request received');
    const formData = await request.formData();
    
    // Support both photo and video uploads
    const photoFile = formData.get('photo') as File | null;
    const videoFile = formData.get('video') as File | null;
    
    // Determine media type
    const mediaFile = photoFile || videoFile;
    const mediaType = photoFile ? 'photo' : 'video';
    
    console.log(`API: Processing ${mediaType} file`);
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const analyticsId = formData.get('analyticsId') as string;
    const filter = formData.get('filter') as string || 'normal';
    
    console.log(`API: User info - Name: ${name}, Email: ${email}, Filter: ${filter}`);
    
    if (!mediaFile || !name || !email) {
      console.error('API: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      console.log('API: Creating uploads directory');
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate a unique filename with username and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeUsername = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const uniqueId = `boothboss-${safeUsername}-${timestamp}`;
    
    // Use appropriate extension based on media type
    const fileExtension = mediaType === 'video' ? '.mp4' : '.jpg';
    const fileName = `${uniqueId}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);
    
    console.log(`API: Generated file path: ${filePath}`);
    
    // Convert file to buffer and save
    console.log('API: Converting file to buffer');
    const bytes = await mediaFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    console.log(`API: File size: ${buffer.length} bytes, MIME type: ${mediaFile.type}`);
    
    fs.writeFileSync(filePath, buffer);
    console.log('API: File saved to disk');
    
    // Public path for media file access
    const publicPath = `/uploads/${fileName}`;
    const fullUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${publicPath}`;
    
    console.log(`API: Media file saved to ${filePath}`);
    console.log(`API: Public URL: ${fullUrl}`);
    
    // Save session to database with additional metadata
    console.log('API: Saving session to database');
    const boothSession = await prisma.boothSession.create({
      data: {
        userName: name,
        userEmail: email,
        photoPath: publicPath,
        eventName: 'Photo Booth Session',
        mediaType: mediaType,
        filter: filter,
      },
    });
    console.log(`API: Session saved with ID: ${boothSession.id}`);

    if (analyticsId) {
      try {
        console.log(`API: Updating analytics with ID: ${analyticsId}`);
        await prisma.boothAnalytics.update({
          where: { id: analyticsId },
          data: {
            boothSessionId: boothSession.id,
            emailDomain: email.split('@')[1],
            mediaType: mediaType,
            filter: filter,
          },
        });
        console.log('API: Analytics updated successfully');
      } catch (analyticsError) {
        // Log but don't fail the whole request
        console.error('API: Failed to update analytics:', analyticsError);
      }
    }

    // Send email based on media type
    if (mediaType === 'video') {
      console.log('API: Sending video email');
      await sendBoothVideo(
        email,
        name,
        fullUrl,
        boothSession.id
      );
      console.log('API: Video email sent successfully');
    } else {
      console.log('API: Sending photo email');
      await sendBoothPhoto(
        email,
        name,
        filePath,
        boothSession.id
      );
      console.log('API: Photo email sent successfully');
    }

    console.log('API: Returning success response');
    return NextResponse.json({
      success: true,
      sessionId: boothSession.id,
      mediaUrl: publicPath,
      fullUrl: fullUrl
    });
  } catch (error) {
    console.error('API: Error processing media:', error);
    
    // More detailed error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('permission denied') || error.message.includes('EACCES')) {
        console.error('API: Permission error when saving file');
        return NextResponse.json(
          { error: 'Permission error: Unable to save media file' },
          { status: 500 }
        );
      } else if (error.message.includes('ENOSPC')) {
        console.error('API: Not enough disk space');
        return NextResponse.json(
          { error: 'Storage error: Not enough disk space' },
          { status: 500 }
        );
      } else if (error.message.includes('not found') || error.message.includes('ENOENT')) {
        console.error('API: Directory not found');
        return NextResponse.json(
          { error: 'File error: Directory not found' },
          { status: 500 }
        );
      }
    }
    
    // Generic error if we can't determine a specific reason
    return NextResponse.json(
      { error: 'Failed to process media. Please try again.' },
      { status: 500 }
    );
  }
}