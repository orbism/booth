// src/app/api/admin/journeys/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { handleApiError, unauthorizedResponse } from '@/lib/errors';
import { z } from 'zod';

// Define validation schema for journeys
const journeySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Journey name is required"),
  pages: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      backgroundImage: z.string().nullable(),
      buttonText: z.string(),
      buttonImage: z.string().nullable()
    })
  ),
});

// GET all saved journeys
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }
    
    // Fetch all journeys from the database
    const journeys = await prisma.journey.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    });

    type Journey = {
      id: string;
      name: string;
      content: string;
      createdAt: Date;
      updatedAt: Date;
    };
    
    // Parse journey content JSON
    const formattedJourneys = journeys.map((journey: Journey) => ({
      id: journey.id,
      name: journey.name,
      pages: JSON.parse(journey.content)
    }));
    
    return NextResponse.json(formattedJourneys);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch journeys');
  }
}

// POST to create or update a journey
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }
    
    const data = await request.json();
    
    // Validate journey data
    const validatedData = journeySchema.parse(data);
    
    // Check if journey already exists
    const existingJourney = await prisma.journey.findUnique({
      where: {
        id: validatedData.id
      }
    });
    
    if (existingJourney) {
      // Update existing journey
      const updatedJourney = await prisma.journey.update({
        where: {
          id: validatedData.id
        },
        data: {
          name: validatedData.name,
          content: JSON.stringify(validatedData.pages),
          updatedAt: new Date()
        }
      });
      
      return NextResponse.json({
        id: updatedJourney.id,
        name: updatedJourney.name,
        pages: JSON.parse(updatedJourney.content)
      });
    } else {
      // Create new journey
      const newJourney = await prisma.journey.create({
        data: {
          id: validatedData.id,
          name: validatedData.name,
          content: JSON.stringify(validatedData.pages),
        }
      });
      
      return NextResponse.json({
        id: newJourney.id,
        name: newJourney.name,
        pages: JSON.parse(newJourney.content)
      });
    }
  } catch (error) {
    return handleApiError(error, 'Failed to save journey');
  }
}

// DELETE a journey
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Journey ID is required' }, { status: 400 });
    }
    
    await prisma.journey.delete({
      where: {
        id
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Failed to delete journey');
  }
}