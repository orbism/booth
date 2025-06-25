// src/lib/email.ts

import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import emailPreviewStore from './email-preview';

export interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer | string;
  contentType?: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  fromName: string;
  secure?: boolean;
}

/**
 * Email sending result interface
 */
export interface EmailResult {
  messageId: string;
  success: boolean;
  preview?: string; // ID of the preview email (in development mode)
}

/**
 * Check if email sending is enabled in development mode
 */
export function isEmailEnabledInDev(): boolean {
  // Always disabled if EMAIL_FORCE_DISABLED is true
  if (process.env.EMAIL_FORCE_DISABLED === 'true') {
    return false;
  }
  
  // In development, only enabled if EMAIL_ENABLED_IN_DEV is true
  if (process.env.NODE_ENV === 'development') {
    return process.env.EMAIL_ENABLED_IN_DEV === 'true';
  }
  
  // In production, always enabled unless forced disabled
  return true;
}

/**
 * Send an email using the configured transport
 */
export async function sendEmail({
  to,
  subject,
  html,
  attachments = [],
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}): Promise<EmailResult> {
  try {
    // Get SMTP settings from database
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      console.error('⚠️ Email configuration error: SMTP settings not found in database');
      throw new Error('SMTP settings not found');
    }

    // Create the email data
    const emailData = {
      from: `"${settings.companyName}" <${settings.smtpUser}>`,
      to,
      subject,
      html,
      attachments,
    };

    // Log email details for debugging (sensitive info redacted)
    console.log('📧 Preparing email:', {
      to,
      subject,
      attachments: attachments.map(a => ({ filename: a.filename, contentType: a.contentType })),
      smtpConfig: {
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpPort === 465,
        auth: {
          user: settings.smtpUser,
          pass: '***REDACTED***'
        }
      }
    });

    // Check if email sending is disabled in development
    if (!isEmailEnabledInDev()) {
      console.log('📧 Email sending disabled in development mode');
      console.log('📧 Email subject:', subject);
      console.log('📧 Email recipient:', to);
      
      // Store in preview system
      const preview = emailPreviewStore.storeEmail({
        to,
        from: emailData.from,
        subject,
        html,
        attachments,
        sent: false
      });
      
      console.log(`📧 Email preview stored with ID: ${preview.id}`);
      
      // Return mock info with preview ID
      return {
        messageId: `mock-id-${Date.now()}`,
        success: true,
        preview: preview.id
      };
    }

    // Configure email transport
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });

    // Send the email
    console.log('📧 Sending email...');
    const info = await transporter.sendMail(emailData);
    console.log(`📧 Email sent successfully: ${info.messageId}`);
    
    // In development, also store in preview system
    if (process.env.NODE_ENV === 'development') {
      const preview = emailPreviewStore.storeEmail({
        to,
        from: emailData.from,
        subject,
        html,
        attachments,
        sent: true
      });
      
      return {
        ...info,
        success: true,
        preview: preview.id
      };
    }

    return {
      ...info,
      success: true
    };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    
    // Provide more detailed error message based on the error type
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        throw new Error('Failed to connect to SMTP server. Check your SMTP host and port settings.');
      } else if (error.message.includes('Invalid login')) {
        throw new Error('SMTP authentication failed. Check your username and password.');
      } else if (error.message.includes('certificate')) {
        throw new Error('SSL certificate issue with SMTP server. Try disabling secure connection or update certificate.');
      }
    }
    
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function sendBoothPhoto(
  userEmail: string,
  userName: string,
  photoPath: string,
  boothSessionId: string
) {
  try {
    console.log(`📧 Sending booth photo email to ${userEmail} (Session ID: ${boothSessionId})`);
    
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      throw new Error('Settings not found');
    }

    // Send email to user
    const userEmailResult = await sendEmail({
      to: userEmail,
      subject: settings.emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${userName}!</h2>
          <p>${settings.emailTemplate}</p>
          <p>Don't forget to share it on social media and tag us! </p>
          
          <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #333;">Follow us on social media:</h3>
            <p style="margin: 10px 0;">
              <a href="https://x.com/BIC_dao" style="color: #1DA1F2; text-decoration: none; font-weight: bold;">🌐 Bureau of Internet Culture</a>
            </p>
            <p style="margin: 10px 0;">
              <a href="https://x.com/ownthedoge" style="color: #1DA1F2; text-decoration: none; font-weight: bold;">🐕 Own the Doge</a>
            </p>
            <p style="margin: 10px 0;">
              <a href="https://x.com/ElonRWA" style="color: #1DA1F2; text-decoration: none; font-weight: bold;">🚀 ElonRWA</a>
            </p>
          </div>
          
          <p>You're doing a great job. Go you.</p>
        </div>
      `,
      attachments: [
        {
          filename: 'your-photo.jpg',
          path: photoPath,
        },
      ],
    });

    console.log(`📧 User email result: ${userEmailResult.success ? 'Success' : 'Failed'}`);

    // Send notification to admin
    const adminEmailResult = await sendEmail({
      to: settings.adminEmail,
      subject: `New Photo Booth Session: ${userName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Photo Booth Session</h2>
          <p>A new photo was taken and sent to:</p>
          <ul>
            <li>Name: ${userName}</li>
            <li>Email: ${userEmail}</li>
            <li>Session ID: ${boothSessionId}</li>
          </ul>
        </div>
      `,
      attachments: [
        {
          filename: 'user-photo.jpg',
          path: photoPath,
        },
      ],
    });

    console.log(`📧 Admin email result: ${adminEmailResult.success ? 'Success' : 'Failed'}`);

    // Update booth session to mark email as sent
    await prisma.boothSession.update({
      where: { id: boothSessionId },
      data: { emailSent: true },
    });

    return {
      success: true,
      userEmail: userEmailResult,
      adminEmail: adminEmailResult
    };
  } catch (error) {
    console.error('❌ Failed to send booth photo:', error);
    throw new Error(`Failed to send booth photo: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function sendBoothVideo(
  userEmail: string,
  userName: string,
  videoUrl: string,
  boothSessionId: string
) {
  try {
    console.log(`📧 Sending booth video email to ${userEmail} (Session ID: ${boothSessionId})`);
    
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      throw new Error('Settings not found');
    }

    // Send email to user with link instead of attachment
    const userEmailResult = await sendEmail({
      to: userEmail,
      subject: settings.emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${userName}!</h2>
          <p>${settings.emailTemplate}</p>
          <p>Thank you for using our video booth. Your video is ready to view and download!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${videoUrl}" 
               style="background-color: #3B82F6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View Your Video
            </a>
          </div>
          <p>If the button above doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${videoUrl}">${videoUrl}</a></p>
          
          <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #333;">Follow us on social media:</h3>
            <p style="margin: 10px 0;">
              <a href="https://x.com/BIC_dao" style="color: #1DA1F2; text-decoration: none; font-weight: bold;">🌐 Bureau of Internet Culture</a>
            </p>
            <p style="margin: 10px 0;">
              <a href="https://x.com/ownthedoge" style="color: #1DA1F2; text-decoration: none; font-weight: bold;">🐕 Own the Doge</a>
            </p>
            <p style="margin: 10px 0;">
              <a href="https://x.com/ElonRWA" style="color: #1DA1F2; text-decoration: none; font-weight: bold;">🚀 ElonRWA</a>
            </p>
          </div>
          
          <p>Best regards,<br>${settings.companyName} Team</p>
        </div>
      `,
      // No attachments for video emails - just send the link
    });

    console.log(`📧 User video email result: ${userEmailResult.success ? 'Success' : 'Failed'}`);

    // Send notification to admin
    const adminEmailResult = await sendEmail({
      to: settings.adminEmail,
      subject: `New Video Booth Session: ${userName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Video Booth Session</h2>
          <p>A new video was recorded and a link was sent to:</p>
          <ul>
            <li>Name: ${userName}</li>
            <li>Email: ${userEmail}</li>
            <li>Session ID: ${boothSessionId}</li>
          </ul>
          <p>Video URL: <a href="${videoUrl}">${videoUrl}</a></p>
        </div>
      `,
      // No video attachment for admin either
    });

    console.log(`📧 Admin video email result: ${adminEmailResult.success ? 'Success' : 'Failed'}`);

    // Update booth session to mark email as sent
    await prisma.boothSession.update({
      where: { id: boothSessionId },
      data: { emailSent: true },
    });

    return {
      success: true,
      userEmail: userEmailResult,
      adminEmail: adminEmailResult
    };
  } catch (error) {
    console.error('❌ Failed to send booth video link:', error);
    throw new Error(`Failed to send booth video link: ${error instanceof Error ? error.message : String(error)}`);
  }
}