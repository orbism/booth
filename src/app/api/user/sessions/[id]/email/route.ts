import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, checkResourceOwnership } from '@/lib/auth-utils';
import { canManageSession, UserInfo } from '@/lib/permission-utils';
import nodemailer from 'nodemailer';

/**
 * POST /api/user/sessions/[id]/email
 * Resend email for a specific booth session with ownership check
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await context.params;
    console.log(`[SESSION EMAIL] Request to resend email for session ID: ${sessionId}`);
    
    // Get user from auth utils
    const user = await getCurrentUser();
    
    // Check if user is authenticated
    if (!user) {
      console.log('[SESSION EMAIL] Unauthorized - No current user found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log(`[SESSION EMAIL] User authenticated: ${user.id}, role: ${user.role}`);
    
    // Check permission using both systems for backward compatibility
    // 1. Legacy permission check
    const hasLegacyAccess = await checkResourceOwnership('boothSession', sessionId);
    
    // 2. New permission system check
    const currentUser: UserInfo = {
      id: user.id,
      role: user.role,
      username: user.username
    };
    
    const permissionResult = await canManageSession(currentUser, sessionId, 'email');
    
    // Only grant access if at least one system approves
    const hasAccess = hasLegacyAccess || permissionResult.allowed;
    
    if (!hasAccess) {
      console.log(`[SESSION EMAIL] Access denied for user ${user.id} to send email for session ${sessionId}: ${permissionResult.reason || 'Unknown reason'}`);
      return NextResponse.json(
        { 
          success: false, 
          error: permissionResult.reason || 'You do not have permission to send email for this session' 
        },
        { status: 403 }
      );
    }
    
    // Get the session details using raw query
    const sessionQuery = `
      SELECT 
        b.id, 
        b.userName, 
        b.userEmail, 
        b.photoPath, 
        b.mediaType,
        u.id as userId
      FROM BoothSession b
      LEFT JOIN User u ON b.userId = u.id
      WHERE b.id = ?
    `;
    
    const sessionResults = await prisma.$queryRawUnsafe(sessionQuery, sessionId);
    
    const session = Array.isArray(sessionResults) && sessionResults.length > 0 
      ? sessionResults[0] 
      : null;
    
    if (!session) {
      console.log(`[SESSION EMAIL] Session not found with ID: ${sessionId}`);
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    if (!session.userEmail) {
      console.log(`[SESSION EMAIL] No email associated with session ${sessionId}`);
      return NextResponse.json(
        { success: false, error: 'No email associated with this session' },
        { status: 400 }
      );
    }
    
    // Get user settings or default settings for email
    const settingsQuery = `
      SELECT * FROM Settings 
      WHERE userId = ? OR isDefault = true 
      ORDER BY userId IS NOT NULL DESC
      LIMIT 1
    `;
    
    const settingsResults = await prisma.$queryRawUnsafe(
      settingsQuery, 
      session.userId || null
    );
    
    const settings = Array.isArray(settingsResults) && settingsResults.length > 0 
      ? settingsResults[0] 
      : null;
    
    if (!settings) {
      console.log(`[SESSION EMAIL] No email settings found for session ${sessionId}`);
      return NextResponse.json(
        { success: false, error: 'Email settings not configured' },
        { status: 400 }
      );
    }
    
    // Log email settings (omit password)
    console.log(`[SESSION EMAIL] Using email settings: SMTP Host=${settings.smtpHost}, Port=${settings.smtpPort}, User=${settings.smtpUser}`);
    
    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });
    
    // Generate email content
    const emailContent = getEmailContent(session, settings);
    
    // Send the email
    await transporter.sendMail({
      from: `"${settings.companyName}" <${settings.adminEmail}>`,
      to: session.userEmail,
      subject: settings.emailSubject || 'Your Photo Booth Picture',
      html: emailContent,
    });
    
    console.log(`[SESSION EMAIL] Email sent successfully to ${session.userEmail}`);
    
    // Update the session to mark email as sent
    await prisma.$executeRaw`
      UPDATE BoothSession 
      SET emailSent = true 
      WHERE id = ${sessionId}
    `;
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    });
    
  } catch (error) {
    console.error('[SESSION EMAIL] Error sending email:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send email',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to generate email content
 */
function getEmailContent(session: any, settings: any): string {
  const isVideo = session.mediaType === 'video';
  const mediaUrl = session.photoPath;
  const mediaEmbed = isVideo
    ? `<video width="100%" controls>
        <source src="${mediaUrl}" type="video/mp4">
        Your email client does not support video playback.
      </video>`
    : `<img src="${mediaUrl}" alt="Photo Booth Image" style="max-width: 100%; height: auto;" />`;
  
  // Parse email template from settings, or use default
  const emailTemplate = settings.emailTemplate || 'Thank you for using our photo booth! Here\'s your picture.';
  
  // Generate complete HTML email
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${settings.emailSubject || 'Your Photo Booth Picture'}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 0; 
          background-color: #f5f5f5; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
          background-color: #ffffff; 
        }
        .header { 
          text-align: center; 
          padding: 20px 0; 
          border-bottom: 1px solid #eeeeee; 
        }
        .content { 
          padding: 20px 0; 
        }
        .media { 
          text-align: center; 
          margin: 20px 0; 
        }
        .footer { 
          text-align: center; 
          padding: 20px 0; 
          color: #999999; 
          font-size: 12px; 
          border-top: 1px solid #eeeeee; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${settings.companyLogo 
            ? `<img src="${settings.companyLogo}" alt="${settings.companyName}" style="max-width: 200px;" />` 
            : `<h1>${settings.companyName || 'Booth Boss'}</h1>`
          }
        </div>
        <div class="content">
          <p>${emailTemplate}</p>
          <div class="media">
            ${mediaEmbed}
          </div>
          <p>You can download your ${isVideo ? 'video' : 'photo'} by clicking on it or saving it directly from this email.</p>
        </div>
        <div class="footer">
          <p>Sent from ${settings.companyName || 'Booth Boss'}</p>
          ${settings.showBoothBossLogo 
            ? `<p>Powered by <a href="https://boothboss.io" style="color: #007bff; text-decoration: none;">Booth Boss</a></p>` 
            : ''
          }
        </div>
      </div>
    </body>
    </html>
  `;
} 