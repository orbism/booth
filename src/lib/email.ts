// src/lib/email.ts

import nodemailer from 'nodemailer';
import { prisma } from './prisma';

interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer | string;
  contentType?: string;
}


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
}) {
  try {
    // Get SMTP settings from database
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      throw new Error('SMTP settings not found');
    }

    // In development, log email instead of sending it
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email would be sent in production:');
      console.log(`📧 To: ${to}`);
      console.log(`📧 Subject: ${subject}`);
      console.log(`📧 Attachments: ${attachments.length}`);
      
      // Skip actual sending and return mock info
      return {
        messageId: `mock-id-${Date.now()}`,
        success: true
      };
    }

    // Production email sending
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });

    const info = await transporter.sendMail({
      from: `"${settings.companyName}" <${settings.smtpUser}>`,
      to,
      subject,
      html,
      attachments,
    });

    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

export async function sendBoothPhoto(
  userEmail: string,
  userName: string,
  photoPath: string,
  boothSessionId: string
) {
  try {
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      throw new Error('Settings not found');
    }

    // Send email to user
    await sendEmail({
      to: userEmail,
      subject: settings.emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${userName}!</h2>
          <p>${settings.emailTemplate}</p>
          <p>Thank you for using our photo booth.</p>
          <p>Best regards,<br>${settings.companyName} Team</p>
        </div>
      `,
      attachments: [
        {
          filename: 'your-photo.jpg',
          path: photoPath,
        },
      ],
    });

    // Send notification to admin
    await sendEmail({
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

    // Update booth session to mark email as sent
    await prisma.boothSession.update({
      where: { id: boothSessionId },
      data: { emailSent: true },
    });

    return true;
  } catch (error) {
    console.error('Failed to send booth photo:', error);
    throw new Error('Failed to send booth photo');
  }
}

export async function sendBoothVideo(
  userEmail: string,
  userName: string,
  videoUrl: string,
  boothSessionId: string
) {
  try {
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      throw new Error('Settings not found');
    }

    // Send email to user with link instead of attachment
    await sendEmail({
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
          <p>Best regards,<br>${settings.companyName} Team</p>
        </div>
      `,
      // No attachments for video emails - just send the link
    });

    // Send notification to admin
    await sendEmail({
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

    // Update booth session to mark email as sent
    await prisma.boothSession.update({
      where: { id: boothSessionId },
      data: { emailSent: true },
    });

    return true;
  } catch (error) {
    console.error('Failed to send booth video link:', error);
    throw new Error('Failed to send booth video link');
  }
}