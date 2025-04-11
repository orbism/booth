// src/app/api/booth/capture/route.ts

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { sendBoothPhoto } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    
    if (!photo || !name || !email) {
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
    const fileExtension = '.jpg';
    const fileName = `${uniqueId}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Convert file to buffer and save
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);
    
    // Save session to database
    const publicPath = `/uploads/${fileName}`;
    const boothSession = await prisma.boothSession.create({
      data: {
        userName: name,
        userEmail: email,
        photoPath: publicPath,
        eventName: 'Photo Booth Session',
      },
    });

    // Send email with photo
    await sendBoothPhoto(
      email,
      name,
      filePath,
      boothSession.id
    );

    return NextResponse.json({
      success: true,
      sessionId: boothSession.id,
      photoUrl: publicPath,
    });
  } catch (error) {
    console.error('Error processing photo:', error);
    return NextResponse.json(
      { error: 'Failed to process photo' },
      { status: 500 }
    );
  }
}