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