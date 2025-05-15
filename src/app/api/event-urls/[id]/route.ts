import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Event URL update validation schema
const eventUrlUpdateSchema = z.object({
  eventName: z.string().min(2, "Event name is required").optional(),
  eventStartDate: z.string().nullable().optional(),
  eventEndDate: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/event-urls/[id]
 * Get a specific event URL by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get user session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user ID
    const userId = session.user.id;
    
    // Get the specified event URL
    const eventUrl = await prisma.eventUrl.findUnique({
      where: { id },
    });
    
    if (!eventUrl) {
      return NextResponse.json(
        { success: false, error: 'Event URL not found' },
        { status: 404 }
      );
    }
    
    // Check if the event URL belongs to the user or if user is admin
    if (eventUrl.userId !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to access this event URL' },
        { status: 403 }
      );
    }
    
    // Return the event URL
    return NextResponse.json({
      success: true,
      eventUrl,
    });
    
  } catch (error) {
    console.error('Error fetching event URL:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch event URL',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/event-urls/[id]
 * Update a specific event URL
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get user session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user ID
    const userId = session.user.id;
    
    // Check if the event URL exists and belongs to the user
    const eventUrl = await prisma.eventUrl.findUnique({
      where: { id },
    });
    
    if (!eventUrl) {
      return NextResponse.json(
        { success: false, error: 'Event URL not found' },
        { status: 404 }
      );
    }
    
    // Check if the event URL belongs to the user or if user is admin
    if (eventUrl.userId !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to update this event URL' },
        { status: 403 }
      );
    }
    
    // Get update data from request
    const body = await request.json();
    
    // Validate input
    const result = eventUrlUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation failed", 
          issues: result.error.issues 
        },
        { status: 400 }
      );
    }
    
    const { eventName, eventStartDate, eventEndDate, isActive } = result.data;
    
    // Update the event URL
    const updatedEventUrl = await prisma.eventUrl.update({
      where: { id },
      data: {
        eventName,
        eventStartDate: eventStartDate ? new Date(eventStartDate) : undefined,
        eventEndDate: eventEndDate ? new Date(eventEndDate) : undefined,
        isActive,
        updatedAt: new Date(),
      },
    });
    
    // Return the updated event URL
    return NextResponse.json({
      success: true,
      eventUrl: updatedEventUrl,
    });
    
  } catch (error) {
    console.error('Error updating event URL:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update event URL',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/event-urls/[id]
 * Delete a specific event URL
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get user session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user ID
    const userId = session.user.id;
    
    // Check if the event URL exists
    const eventUrl = await prisma.eventUrl.findUnique({
      where: { id },
    });
    
    if (!eventUrl) {
      return NextResponse.json(
        { success: false, error: 'Event URL not found' },
        { status: 404 }
      );
    }
    
    // Check if the event URL belongs to the user or if user is admin
    if (eventUrl.userId !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this event URL' },
        { status: 403 }
      );
    }
    
    // Delete the event URL
    await prisma.eventUrl.delete({
      where: { id },
    });
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'Event URL deleted successfully',
    });
    
  } catch (error) {
    console.error('Error deleting event URL:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete event URL',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 