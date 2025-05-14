import { NextRequest, NextResponse } from 'next/server';
import emailPreviewStore from '@/lib/email-preview';
import { isEmailEnabledInDev } from '@/lib/email';

/**
 * GET handler for email previews
 * This endpoint is only available in development mode
 */
export async function GET(request: NextRequest) {
  // Check if we're in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    // Check if email ID is provided
    const url = new URL(request.url);
    const emailId = url.searchParams.get('id');

    if (emailId) {
      // Get specific email
      const email = emailPreviewStore.getEmailById(emailId);
      
      if (!email) {
        return NextResponse.json(
          { error: 'Email not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(email);
    }
    
    // Get all emails
    const emails = emailPreviewStore.getAllEmails();
    
    return NextResponse.json({
      emails,
      emailEnabledInDev: isEmailEnabledInDev(),
      count: emails.length,
    });
  } catch (error) {
    console.error('Error fetching email previews:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch email previews' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for email operations
 * This endpoint is only available in development mode
 */
export async function POST(request: NextRequest) {
  // Check if we're in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const data = await request.json();
    const { action, id } = data;
    
    if (action === 'clear') {
      // Clear all emails
      emailPreviewStore.clearAllEmails();
      return NextResponse.json({ success: true, message: 'All emails cleared' });
    }
    
    if (action === 'send' && id) {
      // Mark email as sent
      const success = emailPreviewStore.markAsSent(id);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Email not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Email marked as sent',
        // In a real implementation, we would trigger the actual sending here
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing email action:', error);
    
    return NextResponse.json(
      { error: 'Failed to process email action' },
      { status: 500 }
    );
  }
} 