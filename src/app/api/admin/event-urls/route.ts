import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/admin/event-urls - Get all event URLs
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const eventUrls = await prisma.eventUrl.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ eventUrls });
  } catch (error) {
    console.error('Error fetching event URLs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event URLs' },
      { status: 500 }
    );
  }
}

// POST /api/admin/event-urls - Create a new event URL
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { urlPath, eventName, isActive, eventStartDate, eventEndDate } = body;

    // Validate required fields
    if (!urlPath || !eventName) {
      return NextResponse.json(
        { error: 'URL path and event name are required' },
        { status: 400 }
      );
    }

    // Check if the URL path is already in use
    const existingUrl = await prisma.eventUrl.findUnique({
      where: { urlPath },
    });

    if (existingUrl) {
      return NextResponse.json(
        { error: 'URL path is already in use' },
        { status: 400 }
      );
    }

    // Create the new event URL
    const eventUrl = await prisma.eventUrl.create({
      data: {
        urlPath,
        eventName,
        isActive: isActive === undefined ? true : isActive,
        eventStartDate: eventStartDate ? new Date(eventStartDate) : null,
        eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
        userId: session.user.id, // Associate with the current admin user
      },
    });

    return NextResponse.json({ eventUrl }, { status: 201 });
  } catch (error) {
    console.error('Error creating event URL:', error);
    return NextResponse.json(
      { error: 'Failed to create event URL' },
      { status: 500 }
    );
  }
} 