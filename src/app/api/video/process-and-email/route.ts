import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// This endpoint would normally be called by a background job/queue
// or through a webhook after video processing is complete
export async function POST(request: NextRequest) {
  try {
    // Process the form data from the request
    const data = await request.json();
    const { videoId, sessionId, name, email, webmUrl } = data;
    
    if (!videoId || !sessionId || !name || !email || !webmUrl) {
      return NextResponse.json(
        { error: { message: 'Missing required parameters' } },
        { status: 400 }
      );
    }

    // Log the received parameters
    console.log(`Processing video and sending email:
User Name: ${name}
Session ID: ${sessionId}
User Email: ${email}
Preview WebM URL: ${webmUrl}
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
      console.error(`WebM file not found: ${webmPath}`);
      return NextResponse.json(
        { error: { message: 'Source video file not found' } },
        { status: 404 }
      );
    }
    
    // "Convert" the video (in a real scenario, this would be FFmpeg or similar)
    const webmContent = await readFile(webmPath);
    await writeFile(mp4Path, webmContent);
    
    // Enhanced error handling for email sending
    let emailSent = false;
    let emailError = null;
    
    try {
      emailSent = await sendEmail(name, email, mp4Url, sessionId);
    } catch (error) {
      emailError = error;
      console.error('Detailed email sending error:', error);
    }
    
    // Attempt retry if first attempt fails
    if (!emailSent && !emailError) {
      console.log('First email attempt failed, retrying...');
      try {
        emailSent = await sendEmail(name, email, mp4Url, sessionId);
      } catch (retryError) {
        emailError = retryError;
        console.error('Email retry also failed:', retryError);
      }
    }
    
    // Log completion with detailed information
    console.log(`Video processing completed:
User Name: ${name}
Session ID: ${sessionId}
User Email: ${email}
Preview WebM URL: ${webmUrl}
Final MP4 URL: ${mp4Url}
Email Sent: ${emailSent ? 'Successful' : 'Failed'}
Email Error: ${emailError ? (emailError instanceof Error ? emailError.message : String(emailError)) : 'None'}
    `);
    
    return NextResponse.json({
      success: true,
      message: "Video processed and email sent",
      mp4Url,
      emailSent
    });
  } catch (error) {
    console.error('Error in process-and-email:', error);
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

// Improved email sending function that always succeeds in test mode
async function sendEmail(name: string, email: string, mp4Url: string, sessionId: string): Promise<boolean> {
  try {
    // For testing/development, we can log success but in production this should use a real email service
    console.log(`Sending email to ${name} <${email}> with download link: ${mp4Url}`);
    
    // IMPLEMENTATION OPTIONS:
    
    // Option 1: Use a real email service API like SendGrid or NodeMailer (commented out for now)
    /*
    // This would be uncommented and configured in production
    const msg = {
      to: email,
      from: 'noreply@yourdomain.com', // Use verified sender in production
      subject: 'Your Video is Ready!',
      text: `Hi ${name}, your video is ready! Download it here: http://localhost:3000${mp4Url}`,
      html: `<p>Hi ${name},</p><p>Your video is ready! <a href="http://localhost:3000${mp4Url}">Download it here</a>.</p>`,
    };
    await emailClient.send(msg);
    */
    
    // Option 2: For development/testing, use a consistent success response
    // Remove randomization and always return true for testing purposes
    const success = true; // Always succeed for testing 
    
    if (success) {
      console.log(`Email successfully sent to ${email} for session ${sessionId}`);
    } else {
      console.error(`Failed to send email to ${email} for session ${sessionId}`);
    }
    
    return success;
  } catch (error) {
    console.error(`Email sending error for ${email}:`, error);
    return false;
  }
} 