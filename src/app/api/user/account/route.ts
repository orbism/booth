import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { z } from 'zod';

// Account update validation schema
const accountUpdateSchema = z.object({
  name: z.string().min(2, "Name is required").optional(),
  organizationName: z.string().optional(),
  organizationSize: z.string().optional(),
  industry: z.string().optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens are allowed")
    .optional(),
});

/**
 * GET /api/user/account
 * Get the current user's account details
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from auth utils
    const user = await getCurrentUser();
    
    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Prepare a safe version of the user object without sensitive data
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      organizationName: user.organizationName,
      organizationSize: user.organizationSize,
      industry: user.industry,
      role: user.role,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
      // Include subscription data if available
      subscription: user.subscription ? {
        tier: user.subscription.tier,
        status: user.subscription.status,
        endDate: user.subscription.endDate,
      } : null,
    };
    
    return NextResponse.json({
      success: true,
      user: safeUser
    });
    
  } catch (error) {
    console.error('Error fetching user account:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch account details',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/account
 * Update the current user's account details
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get user from auth utils
    const user = await getCurrentUser();
    
    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    // Validate with zod
    const validationResult = accountUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    const { name, organizationName, organizationSize, industry, username } = validationResult.data;
    
    // If username is provided, check if it's available
    if (username && username !== user.username) {
      // Check if username is already taken
      const existingUserResults = await prisma.$queryRaw`
        SELECT id FROM User WHERE username = ${username}
      `;
      
      const existingUser = Array.isArray(existingUserResults) && existingUserResults.length > 0 
        ? existingUserResults[0] 
        : null;
      
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Username is already taken' },
          { status: 400 }
        );
      }
    }
    
    // Build update query dynamically with only the fields that were provided
    let updateParts = [];
    let updateValues = [];
    
    if (name !== undefined) {
      updateParts.push(`name = ?`);
      updateValues.push(name);
    }
    
    if (organizationName !== undefined) {
      updateParts.push(`organizationName = ?`);
      updateValues.push(organizationName);
    }
    
    if (organizationSize !== undefined) {
      updateParts.push(`organizationSize = ?`);
      updateValues.push(organizationSize);
    }
    
    if (industry !== undefined) {
      updateParts.push(`industry = ?`);
      updateValues.push(industry);
    }
    
    if (username !== undefined) {
      updateParts.push(`username = ?`);
      updateValues.push(username);
    }
    
    // Only update if there are changes
    if (updateParts.length > 0) {
      // Add updatedAt to the update query
      updateParts.push(`updatedAt = ?`);
      updateValues.push(new Date());
      
      // Construct the query
      const updateQuery = `
        UPDATE User 
        SET ${updateParts.join(', ')} 
        WHERE id = ?
      `;
      
      // Add the ID to values
      updateValues.push(user.id);
      
      // Execute the update query
      await prisma.$executeRawUnsafe(updateQuery, ...updateValues);
    }
    
    // Get the updated user
    const updatedUserResults = await prisma.$queryRaw`
      SELECT 
        id, name, email, username, role, organizationName, 
        organizationSize, industry, onboardingCompleted, createdAt, emailVerified
      FROM User 
      WHERE id = ${user.id}
    `;
    
    const updatedUser = Array.isArray(updatedUserResults) && updatedUserResults.length > 0 
      ? updatedUserResults[0] 
      : null;
    
    return NextResponse.json({
      success: true,
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Error updating user account:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update account details',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 