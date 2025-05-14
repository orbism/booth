import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { isSystemAdmin, isSettingsAdmin } from '@/types/user';

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
 * DELETE handler - Delete multiple booth sessions in bulk
 */
export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { sessionIds } = body;

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'No session IDs provided' },
        { status: 400 }
      );
    }

    // Delete the sessions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get the count of sessions that match the IDs
      const matchCount = await tx.boothSession.count({
        where: {
          id: { in: sessionIds },
        },
      });

      // Delete the sessions
      const deleteResult = await tx.boothSession.deleteMany({
        where: {
          id: { in: sessionIds },
        },
      });

      return {
        requested: sessionIds.length,
        found: matchCount,
        deleted: deleteResult.count,
      };
    });

    return NextResponse.json({
      message: 'Bulk delete completed',
      result,
    });
  } catch (error) {
    console.error('Error deleting sessions in bulk:', error);
    return NextResponse.json(
      { error: 'Failed to delete sessions' },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Wipe all data for a specific user
 */
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, confirmationCode } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Require a confirmation code that matches the first 8 chars of the user ID
    // This is a safety measure to prevent accidental wipes
    if (!confirmationCode || confirmationCode !== userId.substring(0, 8)) {
      return NextResponse.json(
        { error: 'Invalid confirmation code' },
        { status: 400 }
      );
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the current session
    const session = await getServerSession();
    
    // Additional safety check for admins trying to wipe their own data
    if (session?.user?.email === user.email) {
      // Require an additional confirmation flag for wiping own data
      const { confirmSelfWipe } = body;
      if (!confirmSelfWipe) {
        return NextResponse.json(
          { 
            error: 'Self-wipe requires additional confirmation',
            details: 'Set confirmSelfWipe to true to confirm'
          },
          { status: 400 }
        );
      }
    }

    // Delete all user data in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete booth sessions
      const deleteBoothSessions = await tx.boothSession.deleteMany({
        where: { userId },
      });
      
      // Delete user analytics
      const analyticsIds = await tx.boothAnalytics.findMany({
        where: { 
          boothSessionId: {
            in: await tx.boothSession.findMany({
              where: { userId },
              select: { id: true },
            }).then(sessions => sessions.map(s => s.id)),
          },
        },
        select: { id: true },
      });
      
      // Delete event logs
      const deleteEventLogs = await tx.boothEventLog.deleteMany({
        where: {
          analyticsId: {
            in: analyticsIds.map(a => a.id),
          },
        },
      });
      
      // Delete analytics
      const deleteAnalytics = await tx.boothAnalytics.deleteMany({
        where: {
          id: {
            in: analyticsIds.map(a => a.id),
          },
        },
      });

      // Delete sessions
      const deleteSessions = await tx.session.deleteMany({
        where: { userId },
      });
      
      // Note: Settings deletion is temporarily disabled due to schema compatibility issues
      // This will be re-enabled once the database schema is fully updated
      
      return {
        boothSessions: deleteBoothSessions.count,
        eventLogs: deleteEventLogs.count,
        analytics: deleteAnalytics.count,
        sessions: deleteSessions.count,
        settings: 0, // Not currently deleting settings
      };
    });

    return NextResponse.json({
      message: 'User data wiped successfully',
      result,
    });
  } catch (error) {
    console.error('Error wiping user data:', error);
    return NextResponse.json(
      { error: 'Failed to wipe user data' },
      { status: 500 }
    );
  }
} 