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
    
    // Get the event URL using raw query
    const eventUrlResults = await prisma.$queryRaw`
      SELECT * FROM EventUrl WHERE id = ${id}
    `;
    
    const eventUrl = Array.isArray(eventUrlResults) && eventUrlResults.length > 0 
      ? eventUrlResults[0] 
      : null;

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

    // Check if event URL exists using raw query
    const eventUrlResults = await prisma.$queryRaw`
      SELECT * FROM EventUrl WHERE id = ${id}
    `;
    
    const existingUrl = Array.isArray(eventUrlResults) && eventUrlResults.length > 0 
      ? eventUrlResults[0] 
      : null;

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
      const duplicateUrlResults = await prisma.$queryRaw`
        SELECT id FROM EventUrl WHERE urlPath = ${urlPath}
      `;
      
      const duplicateUrl = Array.isArray(duplicateUrlResults) && duplicateUrlResults.length > 0 
        ? duplicateUrlResults[0] 
        : null;

      if (duplicateUrl) {
        return NextResponse.json(
          { error: 'URL path is already in use' },
          { status: 400 }
        );
      }
    }

    // Update the event URL using raw query
    let updateParts = [];
    let updateValues = [];
    
    if (urlPath !== undefined) {
      updateParts.push("urlPath = ?");
      updateValues.push(urlPath);
    }
    
    if (eventName !== undefined) {
      updateParts.push("eventName = ?");
      updateValues.push(eventName);
    }
    
    if (isActive !== undefined) {
      updateParts.push("isActive = ?");
      updateValues.push(isActive);
    }
    
    if (eventStartDate !== undefined) {
      updateParts.push("eventStartDate = ?");
      updateValues.push(eventStartDate ? new Date(eventStartDate) : null);
    }
    
    if (eventEndDate !== undefined) {
      updateParts.push("eventEndDate = ?");
      updateValues.push(eventEndDate ? new Date(eventEndDate) : null);
    }
    
    // Add updatedAt
    updateParts.push("updatedAt = ?");
    updateValues.push(new Date());
    
    if (updateParts.length > 0) {
      const updateQuery = `
        UPDATE EventUrl
        SET ${updateParts.join(", ")}
        WHERE id = ?
      `;
      
      await prisma.$executeRawUnsafe(
        updateQuery,
        ...updateValues,
        id
      );
    }
    
    // Get the updated event URL
    const updatedEventUrlResults = await prisma.$queryRaw`
      SELECT * FROM EventUrl WHERE id = ${id}
    `;
    
    const updatedEventUrl = Array.isArray(updatedEventUrlResults) && updatedEventUrlResults.length > 0 
      ? updatedEventUrlResults[0] 
      : null;

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
    
    // Check if event URL exists using raw query
    const eventUrlResults = await prisma.$queryRaw`
      SELECT * FROM EventUrl WHERE id = ${id}
    `;
    
    const existingUrl = Array.isArray(eventUrlResults) && eventUrlResults.length > 0 
      ? eventUrlResults[0] 
      : null;

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

    // Delete the event URL using raw query
    await prisma.$executeRaw`
      DELETE FROM EventUrl WHERE id = ${id}
    `;

    return NextResponse.json({ message: 'Event URL deleted successfully' });
  } catch (error) {
    console.error('Error deleting event URL:', error);
    return NextResponse.json(
      { error: 'Failed to delete event URL' },
      { status: 500 }
    );
  }
} 