import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/admin/event-urls/[id] - Get a specific event URL
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { id } = params;
    const eventUrl = await prisma.eventUrl.findUnique({
      where: { id },
    });

    if (!eventUrl) {
      return NextResponse.json(
        { error: 'Event URL not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ eventUrl });
  } catch (error) {
    console.error('Error fetching event URL:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event URL' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/event-urls/[id] - Update a specific event URL
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { urlPath, eventName, isActive, eventStartDate, eventEndDate } = body;

    // Check if event URL exists
    const existingUrl = await prisma.eventUrl.findUnique({
      where: { id },
    });

    if (!existingUrl) {
      return NextResponse.json(
        { error: 'Event URL not found' },
        { status: 404 }
      );
    }

    // Verify the logged-in user owns this URL (or is super admin)
    if (existingUrl.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have permission to update this event URL' },
        { status: 403 }
      );
    }

    // If changing the URL path, check if the new path is already in use
    if (urlPath && urlPath !== existingUrl.urlPath) {
      const duplicateUrl = await prisma.eventUrl.findUnique({
        where: { urlPath },
      });

      if (duplicateUrl) {
        return NextResponse.json(
          { error: 'URL path is already in use' },
          { status: 400 }
        );
      }
    }

    // Update the event URL
    const updatedEventUrl = await prisma.eventUrl.update({
      where: { id },
      data: {
        ...(urlPath && { urlPath }),
        ...(eventName && { eventName }),
        ...(isActive !== undefined && { isActive }),
        ...(eventStartDate && { eventStartDate: new Date(eventStartDate) }),
        ...(eventEndDate && { eventEndDate: new Date(eventEndDate) }),
      },
    });

    return NextResponse.json({ eventUrl: updatedEventUrl });
  } catch (error) {
    console.error('Error updating event URL:', error);
    return NextResponse.json(
      { error: 'Failed to update event URL' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/event-urls/[id] - Delete a specific event URL
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // Check if event URL exists
    const existingUrl = await prisma.eventUrl.findUnique({
      where: { id },
    });

    if (!existingUrl) {
      return NextResponse.json(
        { error: 'Event URL not found' },
        { status: 404 }
      );
    }

    // Verify the logged-in user owns this URL (or is super admin)
    if (existingUrl.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have permission to delete this event URL' },
        { status: 403 }
      );
    }

    // Delete the event URL
    await prisma.eventUrl.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Event URL deleted successfully' });
  } catch (error) {
    console.error('Error deleting event URL:', error);
    return NextResponse.json(
      { error: 'Failed to delete event URL' },
      { status: 500 }
    );
  }
} 