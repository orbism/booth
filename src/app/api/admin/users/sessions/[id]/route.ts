import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { isSystemAdmin, isSettingsAdmin } from '@/types/user';
import { sendEmail } from '@/lib/email';

/**
 * Check if the current user has admin privileges
 */
async function checkAdminAccess() {
  const session = await getServerSession();
  
  if (!session || !session.user || !session.user.email) {
    return false;
  }
  
  // Check if user is the system admin (from env)
  if (session.user && session.user.email && isSystemAdmin({ email: session.user.email })) {
    return true;
  }
  
  // Check if the user is the admin from settings
  const settings = await prisma.settings.findFirst();
  if (settings && isSettingsAdmin(session.user.email, settings.adminEmail)) {
    return true;
  }
  
  return false;
}

/**
 * DELETE handler - Delete a specific booth session
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const sessionId = params.id;

    // Check if the session exists
    const session = await prisma.boothSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Delete the session
    await prisma.boothSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json(
      { message: 'Session deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Resend email for a specific booth session
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const sessionId = params.id;

    // Get the session
    const session = await prisma.boothSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get settings for email configuration
    const settings = await prisma.settings.findFirst();
    if (!settings) {
      return NextResponse.json(
        { error: 'Email settings not configured' },
        { status: 400 }
      );
    }

    // Send the email
    try {
      const emailResult = await sendEmail({
        to: session.userEmail,
        subject: settings.emailSubject,
        html: `<div>
          <p>${settings.emailTemplate}</p>
          <p>
            <img src="${session.photoPath}" alt="Photo booth" style="max-width: 100%;" />
          </p>
        </div>`,
        attachments: [
          {
            filename: `photo-booth-${new Date().toISOString().slice(0, 10)}.${
              session.mediaType === 'video' ? 'mp4' : 'jpg'
            }`,
            path: session.photoPath,
          },
        ],
      });

      // Update the session to mark the email as sent
      await prisma.boothSession.update({
        where: { id: sessionId },
        data: { emailSent: true },
      });

      return NextResponse.json({
        message: 'Email resent successfully',
        emailResult,
      });
    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email', details: emailError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error resending email:', error);
    return NextResponse.json(
      { error: 'Failed to resend email' },
      { status: 500 }
    );
  }
} 