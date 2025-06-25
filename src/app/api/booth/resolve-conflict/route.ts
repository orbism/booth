import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { RowDataPacket } from 'mysql2/promise';

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

// MySQL row type definition for Settings
interface SettingsRow extends RowDataPacket {
  id: string;
  captureMode: string;
  customJourneyEnabled: number;
  splashPageEnabled: number;
  filtersEnabled: number;
  printerEnabled: number; 
  aiImageCorrection: number;
  blobVercelEnabled: number;
  [key: string]: any; // Allow other properties
}

/**
 * POST /api/booth/resolve-conflict
 * Directly resolves a conflict in settings by updating the database
 */
export async function POST(request: NextRequest) {
  console.log('🛠️ SETTINGS CONFLICT RESOLUTION API');
  
  try {
    // Verify authentication (optional in development)
    const session = await getServerSession(authOptions);
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment && !session) {
      console.log('❌ Unauthorized: Not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { urlPath, field, value, userId } = body;
    
    if (!urlPath || !field || value === undefined || !userId) {
      console.log('❌ Bad request: Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    console.log(`🔍 Resolving conflict: ${field}=${value} for URL ${urlPath}, User ${userId}`);
    
    // Connect to database
    const dbConfig = getDatabaseConfig();
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    try {
      // First verify the URL exists and belongs to the given user
      const [eventUrls] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM EventUrl WHERE urlPath = ? AND userId = ?',
        [urlPath, userId]
      );
      
      if (!Array.isArray(eventUrls) || eventUrls.length === 0) {
        console.log(`❌ URL "${urlPath}" not found or doesn't belong to user ${userId}`);
        return NextResponse.json(
          { error: 'URL not found or does not belong to the specified user' },
          { status: 404 }
        );
      }
      
      // Verify the user has settings
      const [settings] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM Settings WHERE userId = ? LIMIT 1',
        [userId]
      );
      
      if (!Array.isArray(settings) || settings.length === 0) {
        console.log(`❌ No settings found for user ${userId}`);
        return NextResponse.json(
          { error: 'No settings found for this user' },
          { status: 404 }
        );
      }
      
      // Prepare the update based on the field type
      let updateValue;
      
      // Handle different data types correctly
      switch (field) {
        case 'captureMode':
          // String enum field: 'photo' or 'video'
          if (value !== 'photo' && value !== 'video') {
            console.log(`❌ Invalid captureMode value: ${value}`);
            return NextResponse.json(
              { error: 'Invalid captureMode value, must be "photo" or "video"' },
              { status: 400 }
            );
          }
          updateValue = value;
          break;
          
        case 'customJourneyEnabled':
          // Boolean field stored as TINYINT
          updateValue = value === true || value === 'true' || value === 1 ? 1 : 0;
          break;
          
        default:
          console.log(`❌ Unsupported field: ${field}`);
          return NextResponse.json(
            { error: `Field "${field}" is not supported for conflict resolution` },
            { status: 400 }
          );
      }
      
      // Update the settings in the database
      console.log(`✅ Updating ${field} to ${updateValue} (raw value: ${value})`);
      await connection.execute(
        `UPDATE Settings SET ${field} = ?, updatedAt = NOW() WHERE userId = ?`,
        [updateValue, userId]
      );
      
      // Get the updated settings
      const [updatedSettingsRows] = await connection.execute<SettingsRow[]>(
        'SELECT * FROM Settings WHERE userId = ? LIMIT 1',
        [userId]
      );
      
      // Make sure we got a valid result
      if (!updatedSettingsRows || updatedSettingsRows.length === 0) {
        console.log('❌ Failed to retrieve updated settings');
        return NextResponse.json(
          { error: 'Failed to retrieve updated settings' },
          { status: 500 }
        );
      }
      
      // Get the first row
      const updatedSettings = updatedSettingsRows[0];
      
      // Process boolean fields for the response
      const processedSettings = {
        ...updatedSettings,
        // Convert tinyint to boolean for JSON response
        customJourneyEnabled: updatedSettings.customJourneyEnabled === 1,
        splashPageEnabled: updatedSettings.splashPageEnabled === 1,
        filtersEnabled: updatedSettings.filtersEnabled === 1,
        printerEnabled: updatedSettings.printerEnabled === 1,
        aiImageCorrection: updatedSettings.aiImageCorrection === 1,
        blobVercelEnabled: updatedSettings.blobVercelEnabled === 1,
        fetchTimestamp: Date.now()
      };
      
      // Safe way to reference the field value
      const fieldValue = field === 'captureMode' 
        ? processedSettings.captureMode 
        : field === 'customJourneyEnabled' 
          ? processedSettings.customJourneyEnabled 
          : 'updated';
          
      console.log(`✅ Settings updated successfully: ${field}=${fieldValue}`);
      
      return NextResponse.json({
        success: true,
        message: `${field} updated successfully`,
        ...processedSettings
      });
      
    } finally {
      await connection.end();
      console.log('✅ Database connection closed');
    }
    
  } catch (error) {
    console.error('❌ Error resolving settings conflict:', error);
    return NextResponse.json(
      { error: 'Failed to resolve settings conflict', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 