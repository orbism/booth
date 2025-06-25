import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2/promise';

// For TypeScript 
interface SettingsRow extends RowDataPacket {
  id: string;
  captureMode: string;
  customJourneyEnabled: number;
  splashPageEnabled: number;
  filtersEnabled: number;
  printerEnabled: number;
  aiImageCorrection: number;
  blobVercelEnabled: number;
  [key: string]: any;
}

/**
 * GET /api/booth/direct-db
 * 
 * Debug endpoint to directly fetch settings from database, bypassing all caching
 * Only available in development mode
 */
export async function GET(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  
  console.log('🔍 DIRECT DATABASE ACCESS API');
  
  try {
    // Get the URL path from query parameters
    const url = new URL(request.url);
    const urlPath = url.searchParams.get('urlPath');
    const timestamp = url.searchParams.get('t') || Date.now().toString();
    
    if (!urlPath) {
      console.log('❌ Missing urlPath parameter');
      return NextResponse.json({ error: 'Missing urlPath parameter' }, { status: 400 });
    }
    
    console.log(`⏱️ Request timestamp: ${timestamp}`);
    console.log(`🔎 Looking up settings for URL: ${urlPath}`);
    
    // Connect to database
    const dbConfig = getDatabaseConfig();
    console.log(`Connecting to database ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
    
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    try {
      // Find the event URL
      const [eventUrls] = await connection.execute<RowDataPacket[]>(
        'SELECT id, userId, isActive FROM EventUrl WHERE urlPath = ?',
        [urlPath]
      );
      
      if (!Array.isArray(eventUrls) || eventUrls.length === 0) {
        console.log(`❌ URL "${urlPath}" not found in database`);
        return NextResponse.json({ error: 'Event URL not found' }, { status: 404 });
      }
      
      const eventUrl = eventUrls[0];
      console.log(`✅ Found URL with ID: ${eventUrl.id}, isActive: ${eventUrl.isActive}, userId: ${eventUrl.userId}`);
      
      // Get user details
      const [users] = await connection.execute<RowDataPacket[]>(
        'SELECT id, name, email, role FROM User WHERE id = ?',
        [eventUrl.userId]
      );
      
      if (!Array.isArray(users) || users.length === 0) {
        console.log(`❌ User not found for ID: ${eventUrl.userId}`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const user = users[0];
      console.log(`✅ Found user: ${user.name} (${user.email}), role: ${user.role}`);
      
      // Get settings for this user
      const [settings] = await connection.execute<SettingsRow[]>(
        'SELECT * FROM Settings WHERE userId = ? ORDER BY updatedAt DESC LIMIT 1',
        [eventUrl.userId]
      );
      
      if (!Array.isArray(settings) || settings.length === 0) {
        console.log(`❌ No settings found for user: ${eventUrl.userId}`);
        return NextResponse.json({ error: 'No settings found for this user' }, { status: 404 });
      }
      
      const dbSettings = settings[0];
      console.log(`✅ Found settings with ID: ${dbSettings.id}, lastUpdated: ${dbSettings.updatedAt}`);
      console.log(`✅ captureMode: ${dbSettings.captureMode}, customJourneyEnabled: ${dbSettings.customJourneyEnabled === 1}`);
      
      // Process the settings for response
      const processedSettings = {
        ...dbSettings,
        // Convert TINYINT (0/1) to boolean
        customJourneyEnabled: dbSettings.customJourneyEnabled === 1,
        splashPageEnabled: dbSettings.splashPageEnabled === 1,
        filtersEnabled: dbSettings.filtersEnabled === 1,
        printerEnabled: dbSettings.printerEnabled === 1,
        aiImageCorrection: dbSettings.aiImageCorrection === 1,
        blobVercelEnabled: dbSettings.blobVercelEnabled === 1,
        
        // Add helpful metadata
        fetchTimestamp: Date.now(),
        debug: {
          source: 'direct-db',
          timestamp: Date.now(),
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          eventUrl: {
            id: eventUrl.id,
            path: urlPath,
            isActive: eventUrl.isActive === 1
          }
        }
      };
      
      // Return settings with cache control headers
      return NextResponse.json(processedSettings, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Direct-DB': '1'
        }
      });
      
    } finally {
      await connection.end();
      console.log('✅ Database connection closed');
    }
    
  } catch (error) {
    console.error('❌ Error fetching settings from database:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Load environment variables for database connection
function getDatabaseConfig() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      return {
        host: url.hostname,
        port: url.port ? parseInt(url.port) : 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.substring(1) // remove leading slash
      };
    } catch (e) {
      console.error('Failed to parse DATABASE_URL:', e);
    }
  }
  
  // Fallback to individual env vars
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'boothboss'
  };
} 