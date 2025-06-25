import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { prisma } from '@/lib/prisma';

// This endpoint would normally be called by a background job/queue
// or through a webhook after video processing is complete
export async function POST(request: NextRequest) {
  try {
    // Process the form data from the request
    const data = await request.json();
    const { videoId, sessionId, name, email, webmUrl, analyticsId, eventUrlId, eventUrlPath, userId } = data;
    
    // Log all received data for debugging
    console.log(`[PROCESS VIDEO API] Processing request with data:`, JSON.stringify({
      videoId,
      sessionId,
      name,
      email,
      webmUrl,
      analyticsId,
      eventUrlId,
      eventUrlPath,
      userId
    }, null, 2));
    
    if (!videoId || !sessionId || !name || !email || !webmUrl) {
      console.error('[PROCESS VIDEO API] Missing required parameters');
      return NextResponse.json(
        { error: { message: 'Missing required parameters' } },
        { status: 400 }
      );
    }

    // Log the received parameters
    console.log(`[PROCESS VIDEO API] Processing video and sending email:
User Name: ${name}
Session ID: ${sessionId}
User Email: ${email}
User ID: ${userId || 'Not provided'}
Preview WebM URL: ${webmUrl}
Event URL ID: ${eventUrlId || 'none'}
    `);
    
    // In a real implementation, this would convert the video using FFmpeg or a similar tool
    // For demo purposes, we'll just simulate it by copying the WebM file and renaming it to MP4
    
    // Construct paths
    const publicDir = path.join(process.cwd(), 'public');
    const webmPath = path.join(publicDir, webmUrl);
    const mp4Path = webmPath.replace('.webm', '.mp4');
    const mp4Url = webmUrl.replace('.webm', '.mp4');
    
    // Check if WebM file exists
    if (!existsSync(webmPath)) {
      console.error(`[PROCESS VIDEO API] WebM file not found: ${webmPath}`);
      return NextResponse.json(
        { error: { message: 'Source video file not found' } },
        { status: 404 }
      );
    }
    
    // "Convert" the video (in a real scenario, this would be FFmpeg or similar)
    const webmContent = await readFile(webmPath);
    await writeFile(mp4Path, webmContent);
    
    // Create a BoothSession entry in the database
    console.log('[PROCESS VIDEO API] Creating booth session record in the database');
    let boothSession;
    try {
      // Prepare the data for the booth session
      const boothSessionData: any = {
        userName: name,
        userEmail: email,
        photoPath: mp4Url,
        eventName: 'Video Booth Session',
        mediaType: 'video',
        filter: 'normal',
        emailSent: false
      };
      
      // Critical: Add the user ID if it's provided - this is needed for the session to show up for the user
      if (userId) {
        console.log(`[PROCESS VIDEO API] Associating session with user ID: ${userId}`);
        boothSessionData.userId = userId;
      } else {
        console.warn('[PROCESS VIDEO API] No user ID provided - session will not be associated with any user');
      }
      
      // Add event URL relation if provided
      if (eventUrlId) {
        console.log(`[PROCESS VIDEO API] Associating session with event URL ID: ${eventUrlId}`);
        boothSessionData.eventUrlId = eventUrlId;
        boothSessionData.eventUrlPath = eventUrlPath || null;
      }
      
      // Now create the session record
      boothSession = await prisma.boothSession.create({
        data: boothSessionData
      });
      
      console.log(`[PROCESS VIDEO API] Created booth session with ID: ${boothSession.id}, User ID: ${boothSession.userId || 'None'}`);
    } catch (dbError) {
      console.error('[PROCESS VIDEO API] Failed to create session in database:', dbError);
      // Continue processing even if database entry fails
    }
    
    // Simulate sending an email
    const emailSent = await simulateSendEmail(name, email, mp4Url, boothSession?.id || sessionId);
    
    // Update the database entry if email was sent successfully
    if (emailSent && boothSession) {
      try {
        await prisma.boothSession.update({
          where: { id: boothSession.id },
          data: { emailSent: true }
        });
        console.log(`[PROCESS VIDEO API] Updated booth session ${boothSession.id} - emailSent: true`);
      } catch (updateError) {
        console.error('[PROCESS VIDEO API] Failed to update session after email sent:', updateError);
      }
    }
    
    // Log completion
    console.log(`[PROCESS VIDEO API] Video processing completed:
User Name: ${name}
Session ID: ${boothSession?.id || sessionId}
User Email: ${email}
User ID: ${userId || 'None'}
Preview WebM URL: ${webmUrl}
Final MP4 URL: ${mp4Url}
Email Sent: ${emailSent ? 'Successful' : 'Failed'}
Database Entry: ${boothSession ? 'Created' : 'Failed'}
    `);
    
    return NextResponse.json({
      success: true,
      message: "Video processed and email sent",
      mp4Url,
      emailSent,
      sessionId: boothSession?.id || sessionId,
      databaseEntry: !!boothSession
    });
  } catch (error) {
    console.error('[PROCESS VIDEO API] Error in process-and-email:', error);
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to process video and send email',
          details: error instanceof Error ? error.message : String(error)
        },
        emailSent: false
      },
      { status: 500 }
    );
  }
}

// Simulates sending an email
async function simulateSendEmail(name: string, email: string, mp4Url: string, sessionId: string): Promise<boolean> {
  // In a real implementation, this would use a service like SendGrid, Mailgun, etc.
  console.log(`[PROCESS VIDEO API] Sending email to ${name} <${email}> with download link: ${mp4Url}`);
  
  // Simulate success most of the time
  const success = Math.random() > 0.1;
  
  if (success) {
    console.log(`[PROCESS VIDEO API] Email successfully sent to ${email} for session ${sessionId}`);
  } else {
    console.error(`[PROCESS VIDEO API] Failed to send email to ${email} for session ${sessionId}`);
  }
  
  return success;
} 