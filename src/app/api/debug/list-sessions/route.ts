import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/debug/list-sessions
 * Debug endpoint for checking sessions in the database directly
 * 
 * Query parameters:
 * - userId: User ID to check sessions for
 * - limit: Number of sessions to return (default: 50)
 * - mediaType: Filter by media type (photo/video)
 * 
 * Example: /api/debug/list-sessions?userId=cmaqyjawq000rj0b2d52mp98g
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[DEBUG] List sessions API called at ${new Date().toISOString()}`);
  
  try {
    // Get query parameters
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const mediaType = searchParams.get('mediaType');
    
    // Validate userId
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId is required' 
      }, { status: 400 });
    }
    
    console.log(`[DEBUG] Checking sessions for user ${userId}, limit: ${limit}`);
    
    // First check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true }
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    console.log(`[DEBUG] Found user: ${user.username || user.email}`);
    
    // Build query conditions
    const whereConditions: any = { userId };
    if (mediaType) {
      whereConditions.mediaType = mediaType;
    }
    
    // Get count of sessions
    const sessionCount = await prisma.boothSession.count({
      where: whereConditions
    });
    
    console.log(`[DEBUG] Found ${sessionCount} sessions for user ${userId}`);
    
    // Query sessions
    const sessions = await prisma.boothSession.findMany({
      where: whereConditions,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        eventUrl: {
          select: {
            id: true,
            urlPath: true,
            eventName: true
          }
        }
      }
    });
    
    const processingTime = Date.now() - startTime;
    
    // Return HTML response for better readability
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>BoothSession Debug</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; line-height: 1.5; padding: 1rem; max-width: 1200px; margin: 0 auto; }
          h1 { color: #0070f3; }
          h2 { color: #0070f3; margin-top: 2rem; }
          pre { background: #f6f8fa; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; font-size: 0.85rem; }
          .card { border: 1px solid #eaeaea; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1.5rem; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .success { color: #2e7d32; }
          .error { color: #d32f2f; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
          table th, table td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #eaeaea; }
          table th { background: #f1f7ff; }
          .session-row:hover { background: #f9f9f9; }
          .session-row td { vertical-align: top; }
          .debug-section { background: #f1f7ff; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; }
          .btn { display: inline-block; padding: 0.5rem 1rem; background: #0070f3; color: white; text-decoration: none; border-radius: 0.25rem; margin-right: 0.5rem; }
          .btn-secondary { background: #fff; border: 1px solid #0070f3; color: #0070f3; }
          .pill { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
          .pill.photo { background: #e3f2fd; color: #0d47a1; }
          .pill.video { background: #f3e5f5; color: #7b1fa2; }
          .tag { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; background: #f1f1f1; color: #333; margin-right: 0.25rem; margin-bottom: 0.25rem; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BoothSession Debug</h1>
          <div>
            <span>Processing time: ${processingTime}ms</span>
          </div>
        </div>
        
        <div class="card">
          <h2 class="success">User Details</h2>
          <table>
            <tr>
              <th>ID</th>
              <td>${user.id}</td>
            </tr>
            <tr>
              <th>Username</th>
              <td>${user.username || 'None'}</td>
            </tr>
            <tr>
              <th>Email</th>
              <td>${user.email}</td>
            </tr>
          </table>
          
          <div class="debug-section">
            <h3>Session Stats</h3>
            <p>Total Sessions: <strong>${sessionCount}</strong></p>
            <p>Showing: <strong>${sessions.length}</strong> most recent sessions</p>
            
            <div style="margin-top: 1rem">
              <a href="?userId=${userId}&limit=10" class="btn btn-secondary">Show 10</a>
              <a href="?userId=${userId}&limit=50" class="btn btn-secondary">Show 50</a>
              <a href="?userId=${userId}&limit=100" class="btn btn-secondary">Show 100</a>
              <a href="?userId=${userId}&mediaType=photo" class="btn btn-secondary">Photos Only</a>
              <a href="?userId=${userId}&mediaType=video" class="btn btn-secondary">Videos Only</a>
            </div>
          </div>
        </div>
        
        <div class="card">
          <h2>Sessions (${sessions.length})</h2>
          ${sessions.length === 0 ? 
            '<p class="error">No sessions found for this user.</p>' : 
            `<table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Created</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Media</th>
                  <th>Event URL</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${sessions.map(session => `
                  <tr class="session-row">
                    <td>${session.id}</td>
                    <td>${new Date(session.createdAt).toLocaleString()}</td>
                    <td>${session.userName}</td>
                    <td>${session.userEmail}</td>
                    <td>
                      <span class="pill ${session.mediaType || 'photo'}">${session.mediaType || 'photo'}</span>
                      ${session.filter ? `<span class="tag">Filter: ${session.filter}</span>` : ''}
                      <div>
                        <a href="${session.photoPath}" target="_blank">${session.photoPath.split('/').pop()}</a>
                      </div>
                    </td>
                    <td>
                      ${session.eventUrl ? 
                        `<a href="/e/${session.eventUrl.urlPath}" target="_blank">${session.eventUrl.urlPath}</a>
                         <div><small>${session.eventUrl.eventName}</small></div>` : 
                        'None'}
                    </td>
                    <td>
                      ${session.emailSent ? 
                        '<span class="pill photo">Email Sent</span>' : 
                        '<span class="pill video">No Email</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>`
          }
        </div>
        
        <div class="card">
          <h2>Raw Session Data</h2>
          <pre>${JSON.stringify(sessions, null, 2)}</pre>
        </div>
        
        <div style="margin-top: 2rem; text-align: center;">
          <a href="/api/debug" class="btn">Back to Debug Home</a>
        </div>
      </body>
      </html>
    `;
    
    // Return HTML response
    return new NextResponse(htmlResponse, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
    
  } catch (error) {
    console.error('[DEBUG] Error in list-sessions API:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to list sessions',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 