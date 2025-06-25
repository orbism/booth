import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/debug/test-url-routing
 * Debug endpoint to test URL routing and middleware behavior
 * 
 * Query parameters:
 * - urlPath: The URL path to generate test links for
 * 
 * Example: /api/debug/test-url-routing?urlPath=testurl
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[DEBUG] URL routing test API called at ${new Date().toISOString()}`);
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const urlPath = request.nextUrl.searchParams.get('urlPath') || 'test';
    const timestamp = Date.now();
    
    console.log(`[DEBUG] Testing URL routing for path: ${urlPath}`);
    
    // Generate different test URLs
    const directUrl = `${baseUrl}/e/${urlPath}`;
    const directUrlWithParams = `${baseUrl}/e/${urlPath}?t=${timestamp}`;
    const normalizedUrl = `${baseUrl}/e/${urlPath.toLowerCase()}`;
    const boothUrl = `${baseUrl}/booth/${urlPath}`;
    
    // Generate information about the request
    const requestInfo = {
      clientIp: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      referer: request.headers.get('referer') || 'none',
      timestamp: new Date().toISOString(),
      processingTime: `${Date.now() - startTime}ms`,
    };
    
    // Create test HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>URL Routing Test</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; line-height: 1.5; padding: 2rem; max-width: 800px; margin: 0 auto; }
          h1 { color: #0070f3; }
          .link-box { margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #eaeaea; border-radius: 0.5rem; }
          .link-box h3 { margin-top: 0; }
          a.test-link { display: inline-block; padding: 0.5rem 1rem; background: #0070f3; color: white; text-decoration: none; border-radius: 0.25rem; margin-right: 0.5rem; margin-bottom: 0.5rem; }
          pre { background: #f6f8fa; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
          .success { color: #0070f3; }
          .debug-section { background: #f6f8fa; padding: 1rem; border-radius: 0.5rem; margin-top: 2rem; }
        </style>
      </head>
      <body>
        <h1>URL Routing Test Tool</h1>
        <p>Testing URL routing for path: <strong>${urlPath}</strong></p>
        
        <div class="link-box">
          <h3>Direct Event URL Access</h3>
          <p>These links test direct access to the event URL:</p>
          <a href="${directUrl}" target="_blank" class="test-link">Direct Access</a>
          <a href="${directUrlWithParams}" target="_blank" class="test-link">With Timestamp</a>
          <a href="${normalizedUrl}" target="_blank" class="test-link">Normalized</a>
        </div>
        
        <div class="link-box">
          <h3>Legacy Format (should redirect)</h3>
          <p>This link tests the legacy booth URL format which should redirect:</p>
          <a href="${boothUrl}" target="_blank" class="test-link">Legacy Format</a>
        </div>
        
        <div class="link-box">
          <h3>API Check</h3>
          <p>These links test the URL existence and status via API:</p>
          <a href="${baseUrl}/api/debug/url-check?urlPath=${urlPath}" target="_blank" class="test-link">Check URL Existence</a>
        </div>
        
        <div class="debug-section">
          <h3>Request Information</h3>
          <pre>${JSON.stringify(requestInfo, null, 2)}</pre>
        </div>
      </body>
      </html>
    `;
    
    // Return HTML response
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
    
  } catch (error) {
    console.error('[DEBUG] Error in test-url-routing API:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate test page',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 