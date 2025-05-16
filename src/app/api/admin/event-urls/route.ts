import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { RESERVED_KEYWORDS } from '@/types/event-url';

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

    // Use raw query to get all event URLs
    const eventUrls = await prisma.$queryRaw`
      SELECT * FROM EventUrl
      ORDER BY createdAt DESC
    `;

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
    
    // Check if URL is a reserved keyword
    if (RESERVED_KEYWORDS.includes(urlPath.toLowerCase())) {
      return NextResponse.json(
        { error: 'This URL is reserved and cannot be used' },
        { status: 400 }
      );
    }

    // Check if the URL path is already in use with raw query
    const existingUrlResults = await prisma.$queryRaw`
      SELECT id FROM EventUrl WHERE urlPath = ${urlPath}
    `;
    
    const existingUrl = Array.isArray(existingUrlResults) && existingUrlResults.length > 0 
      ? existingUrlResults[0] 
      : null;

    if (existingUrl) {
      return NextResponse.json(
        { error: 'URL path is already in use' },
        { status: 400 }
      );
    }

    // Create the new event URL with raw query
    await prisma.$executeRaw`
      INSERT INTO EventUrl (
        id, userId, urlPath, eventName, isActive,
        eventStartDate, eventEndDate, createdAt, updatedAt
      ) VALUES (
        uuid(), ${session.user.id}, ${urlPath}, ${eventName},
        ${isActive === undefined ? true : isActive},
        ${eventStartDate ? new Date(eventStartDate) : null},
        ${eventEndDate ? new Date(eventEndDate) : null},
        NOW(), NOW()
      )
    `;
    
    // Get the newly created event URL
    const newEventUrlResults = await prisma.$queryRaw`
      SELECT * FROM EventUrl 
      WHERE urlPath = ${urlPath}
      LIMIT 1
    `;
    
    const eventUrl = Array.isArray(newEventUrlResults) && newEventUrlResults.length > 0 
      ? newEventUrlResults[0] 
      : null;

    return NextResponse.json({ eventUrl }, { status: 201 });
  } catch (error) {
    console.error('Error creating event URL:', error);
    return NextResponse.json(
      { error: 'Failed to create event URL' },
      { status: 500 }
    );
  }
} 