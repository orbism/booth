// Script to check eventUrl data and settings relationships
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

// Initialize database connection
function constructDatabaseUrl() {
  const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DATABASE_URL
  } = process.env;

  // First check if DATABASE_URL is already provided
  if (DATABASE_URL) {
    console.log('Using provided DATABASE_URL environment variable');
    return DATABASE_URL;
  }

  // Otherwise build from components
  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    console.error('Missing database configuration parameters. Check your .env file.');
    throw new Error('Missing database configuration parameters');
  }

  const port = DB_PORT || '3306';
  const url = `mysql://${DB_USER}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${port}/${DB_NAME}`;
  
  console.log(`Database URL constructed for host: ${DB_HOST}`);
  return url;
}

// Set DATABASE_URL in process.env if it's not already set
if (!process.env.DATABASE_URL) {
  try {
    process.env.DATABASE_URL = constructDatabaseUrl();
  } catch (error) {
    console.error('Failed to construct database URL:', error);
    process.exit(1);
  }
}

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function checkEventUrls() {
  try {
    console.log("\n===== EVENT URL CHECKER =====\n");
    
    // List all event URLs to get a valid ID to work with
    const eventUrls = await prisma.eventUrl.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    console.log(`Found ${eventUrls.length} active event URLs:`);
    
    // List all event URLs
    for (const url of eventUrls) {
      console.log(`\n--- Event URL: ${url.urlPath} ---`);
      console.log(`ID: ${url.id}`);
      console.log(`User ID: ${url.userId}`);
      console.log(`Event Name: ${url.eventName}`);
      console.log(`Is Active: ${url.isActive}`);
      
      // Look up the user for this event URL
      const user = await prisma.user.findUnique({
        where: { id: url.userId }
      });
      
      if (user) {
        console.log(`\nUser found: ${user.name || user.email}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        
        // Look up settings for this user
        const settings = await prisma.settings.findFirst({
          where: { userId: url.userId }
        });
        
        if (settings) {
          console.log(`\nSettings found with ID: ${settings.id}`);
          console.log(`Capture Mode: ${settings.captureMode} (${typeof settings.captureMode})`);
          console.log(`Custom Journey Enabled: ${settings.customJourneyEnabled} (${typeof settings.customJourneyEnabled})`);
          console.log(`Updated: ${settings.updatedAt}`);
        } else {
          console.log(`\n❌ NO SETTINGS found for user ${url.userId}`);
        }
      } else {
        console.log(`\n❌ NO USER found with ID ${url.userId}`);
      }
      
      console.log("----------------------------");
    }
    
    // Look for a specific URL path if provided
    if (process.argv.length > 2) {
      const urlPath = process.argv[2];
      console.log(`\n--- Looking up specific URL path: ${urlPath} ---`);
      
      const specificUrl = await prisma.eventUrl.findFirst({
        where: {
          urlPath,
          isActive: true
        }
      });
      
      if (specificUrl) {
        console.log(`Found URL with ID: ${specificUrl.id}`);
        console.log(`User ID: ${specificUrl.userId}`);
        
        // Check settings for this specific URL's user
        const specificSettings = await prisma.settings.findFirst({
          where: { userId: specificUrl.userId }
        });
        
        if (specificSettings) {
          console.log(`\nSettings found with ID: ${specificSettings.id}`);
          console.log(`Capture Mode: ${specificSettings.captureMode}`);
          console.log(`Custom Journey Enabled: ${specificSettings.customJourneyEnabled}`);
          
          // Test updating the settings
          console.log(`\nSimulating settings update...`);
          
          const toggledCaptureMode = specificSettings.captureMode === 'photo' ? 'video' : 'photo';
          const toggledJourney = !specificSettings.customJourneyEnabled;
          
          console.log(`Would update captureMode from ${specificSettings.captureMode} to ${toggledCaptureMode}`);
          console.log(`Would update customJourneyEnabled from ${specificSettings.customJourneyEnabled} to ${toggledJourney}`);
          
          // Uncomment to actually perform the update
          /*
          const updatedSettings = await prisma.settings.update({
            where: { id: specificSettings.id },
            data: {
              captureMode: toggledCaptureMode,
              customJourneyEnabled: toggledJourney
            }
          });
          
          console.log(`\nSettings updated successfully:`);
          console.log(`New Capture Mode: ${updatedSettings.captureMode}`);
          console.log(`New Custom Journey Enabled: ${updatedSettings.customJourneyEnabled}`);
          */
        } else {
          console.log(`\n❌ NO SETTINGS found for user ${specificUrl.userId}`);
        }
      } else {
        console.log(`\n❌ NO URL found with path ${urlPath}`);
      }
    }
    
    console.log("\n===== EVENT URL CHECK COMPLETE =====");
  } catch (error) {
    console.error('Error checking event URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check function
checkEventUrls()
  .then(() => console.log('Database check complete'))
  .catch(e => {
    console.error('Script error:', e);
    process.exit(1);
  });
