// src/app/api/booth/capture/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { sendBoothPhoto, sendBoothVideo } from '@/lib/email';
import { storage, StorageOptions } from '@/lib/storage';
import { getStorageSettings, determineCurrentProvider } from '@/lib/storage/settings';

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

    // Log storage settings
    const settings = await getStorageSettings();
    const providerType = determineCurrentProvider(settings);
    console.log(`API: Using storage provider: ${providerType}`);
    console.log(`API: Storage settings - Provider: ${settings.storageProvider}, Vercel Blob enabled: ${settings.blobVercelEnabled}`);
    
    // Check if we have the necessary environment variables for Vercel Blob
    if (providerType === 'vercel' && !process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn('API: BLOB_READ_WRITE_TOKEN not set, but using Vercel Blob provider');
    }

    // Generate a unique filename with username and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeUsername = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const uniqueId = `boothboss-${safeUsername}-${timestamp}`;
    
    // Use appropriate extension based on media type
    const fileExtension = mediaType === 'video' ? '.mp4' : '.jpg';
    const fileName = `${uniqueId}${fileExtension}`;
    
    console.log(`API: Generated filename: ${fileName}`);
    
    // Convert file to buffer
    console.log('API: Converting file to buffer');
    const bytes = await mediaFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    console.log(`API: File size: ${buffer.length} bytes, MIME type: ${mediaFile.type}`);
    
    // Upload file using storage abstraction
    console.log('API: Uploading file using storage abstraction');
    
    let storageResult;
    let fallbackUsed = false;
    
    try {
      // First attempt: use the configured storage provider
      const uploadOptions: StorageOptions = {
        directory: 'booth',
        access: 'public',
        addRandomSuffix: false,
        metadata: {
          contentType: mediaFile.type,
          userName: name,
          userEmail: email,
          filter: filter
        }
      };
      
      storageResult = await storage.uploadFile(buffer, fileName, uploadOptions);
      console.log(`API: File uploaded successfully to ${storageResult.provider} storage`);
      console.log(`API: File URL: ${storageResult.url}`);
    } catch (uploadError) {
      console.error('API: Primary storage upload failed:', uploadError);
      
      // If Vercel Blob failed and we're in that mode, try local storage as fallback
      if (providerType === 'vercel') {
        console.log('API: Attempting fallback to local storage');
        fallbackUsed = true;
        
        try {
          // Import fs and path only for fallback case
          const fs = require('fs');
          const path = require('path');
          
          // Create uploads directory if it doesn't exist
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            console.log('API: Creating uploads directory for fallback');
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          // Save to local filesystem as fallback
          const filePath = path.join(uploadsDir, fileName);
          fs.writeFileSync(filePath, buffer);
          
          // Create a manual storage result
          const publicPath = `/uploads/${fileName}`;
          storageResult = {
            url: publicPath,
            pathname: publicPath,
            size: buffer.length,
            contentType: mediaFile.type || 'application/octet-stream',
            uploadedAt: new Date(),
            provider: 'local' as const
          };
          
          console.log(`API: Fallback successful - File saved to ${filePath}`);
        } catch (fallbackError) {
          console.error('API: Fallback storage also failed:', fallbackError);
          throw new Error(`All storage methods failed: ${uploadError} | Fallback: ${fallbackError}`);
        }
      } else {
        // If local storage was the primary and it failed, we have no fallback
        throw uploadError;
      }
    }
    
    // Generate the full URL including domain
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    // For Vercel Blob results, the URL is already absolute with domain
    const fullUrl = storageResult.provider === 'vercel' 
      ? storageResult.url 
      : `${baseUrl}${storageResult.url}`;
    
    console.log(`API: Full media URL: ${fullUrl}`);
    
    // Save session to database with additional metadata
    console.log('API: Saving session to database');
    const boothSession = await prisma.boothSession.create({
      data: {
        userName: name,
        userEmail: email,
        photoPath: storageResult.url,
        eventName: 'Photo Booth Session',
        mediaType: mediaType,
        filter: filter,
        // Store storage provider and fallback status in notes field as JSON since we don't have dedicated fields
        // These fields don't exist in the Prisma model: storageProvider, fallbackUsed
      },
    });
    console.log(`API: Session saved with ID: ${boothSession.id}`);

    if (analyticsId) {
      try {
        console.log(`API: Updating analytics with ID: ${analyticsId}`);
        
        // Create a separate event log entry with storage information
        await prisma.boothEventLog.create({
          data: {
            analyticsId: analyticsId,
            eventType: 'media_upload',
            metadata: JSON.stringify({
              storageProvider: storageResult.provider,
              fallbackUsed: fallbackUsed,
              url: storageResult.url
            }),
          }
        });
        
        // Update the analytics record
        await prisma.boothAnalytics.update({
          where: { id: analyticsId },
          data: {
            boothSessionId: boothSession.id,
            emailDomain: email.split('@')[1],
            mediaType: mediaType,
            filter: filter,
            // We can't add metadata here since the field doesn't exist
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
      // For photos, we need to handle different paths based on storage provider
      if (storageResult.provider === 'vercel') {
        // For Vercel Blob, we need to pass the URL instead of a file path
        await sendBoothPhoto(
          email,
          name,
          fullUrl, // Use the URL instead of a file path
          boothSession.id
        );
      } else {
        // For local storage, we can use the file path directly
        const path = require('path');
        const localPath = path.join(process.cwd(), 'public', storageResult.url);
        await sendBoothPhoto(
          email,
          name,
          storageResult.url.startsWith('/') ? localPath : storageResult.url,
          boothSession.id
        );
      }
      console.log('API: Photo email sent successfully');
    }

    console.log('API: Returning success response');
    return NextResponse.json({
      success: true,
      sessionId: boothSession.id,
      mediaUrl: storageResult.url,
      fullUrl: fullUrl,
      provider: storageResult.provider,
      fallbackUsed: fallbackUsed
    });
  } catch (error) {
    console.error('API: Error processing media:', error);
    
    // More detailed error messages based on error type
    if (error instanceof Error) {
      // Storage-specific errors
      if (error.message.includes('Vercel Blob')) {
        console.error('API: Vercel Blob storage error:', error.message);
        return NextResponse.json(
          { error: `Storage error: ${error.message}` },
          { status: 500 }
        );
      }
      
      // Other specific errors
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