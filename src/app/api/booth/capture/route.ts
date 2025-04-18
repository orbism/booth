// src/app/api/booth/capture/route.ts

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { sendBoothPhoto, sendBoothVideo } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const mediaFile = formData.get('photo') as File || formData.get('video') as File;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const analyticsId = formData.get('analyticsId') as string;
    const mediaType = formData.get('mediaType') as string || 'photo';
    
    if (!mediaFile || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate a unique filename
    const uniqueId = uuidv4();
    const fileExtension = mediaType === 'video' ? '.webm' : '.jpg';
    const fileName = `${uniqueId}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Convert file to buffer and save
    const bytes = await mediaFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);
    
    // Public path for media file access
    const publicPath = `/uploads/${fileName}`;
    const fullUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${publicPath}`;
    
    console.log(`Media file saved to ${filePath}`);
    console.log(`Public URL: ${fullUrl}`);
    
    // Save session to database
    const boothSession = await prisma.boothSession.create({
      data: {
        userName: name,
        userEmail: email,
        photoPath: publicPath, // Store the path regardless of media type for now
        eventName: 'Photo Booth Session',
        // mediaType: mediaType, // Add this field to your database schema
      },
    });

    if (analyticsId) {
      try {
        await prisma.boothAnalytics.update({
          where: { id: analyticsId },
          data: {
            boothSessionId: boothSession.id,
            emailDomain: email.split('@')[1],
          },
        });
      } catch (analyticsError) {
        // Log but don't fail the whole request
        console.error('Failed to update analytics:', analyticsError);
      }
    }

    // Send email based on media type
    if (mediaType === 'video') {
      await sendBoothVideo(
        email,
        name,
        fullUrl, // Send the URL instead of the file
        boothSession.id
      );
    } else {
      await sendBoothPhoto(
        email,
        name,
        filePath, // Keep photo attachments for now
        boothSession.id
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: boothSession.id,
      mediaUrl: publicPath,
      fullUrl: fullUrl
    });
  } catch (error) {
    console.error('Error processing media:', error);
    
    // More detailed error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('permission denied') || error.message.includes('EACCES')) {
        return NextResponse.json(
          { error: 'Permission error: Unable to save media file' },
          { status: 500 }
        );
      } else if (error.message.includes('ENOSPC')) {
        return NextResponse.json(
          { error: 'Storage error: Not enough disk space' },
          { status: 500 }
        );
      } else if (error.message.includes('not found') || error.message.includes('ENOENT')) {
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