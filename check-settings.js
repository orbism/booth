// Script to check database settings directly
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

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
  process.env.DATABASE_URL = constructDatabaseUrl();
}

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function checkSettings() {
  try {
    console.log('\n======= BOOTH SETTINGS CHECKER =======\n');
    console.log('Analyzing database for settings issues...\n');
    
    // Check for the specific user ID provided - Customer ID: cmaqyjawq000rj0b2d52mp98g
    const specificUserId = 'cmaqyjawq000rj0b2d52mp98g';
    console.log(`Looking up specific Customer ID: ${specificUserId}`);
    
    // First check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: specificUserId },
      include: {
        eventUrls: true,
        settings: true
      }
    });
    
    if (!user) {
      console.error(`❌ User with ID ${specificUserId} not found in database`);
      return;
    }
    
    console.log('\n--- User Information ---');
    console.log(`ID: ${user.id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    
    // Check for the user's settings
    console.log('\n--- Settings for User ---');
    if (user.settings) {
      console.log(`✅ User has settings with ID: ${user.settings.id}`);
      console.log(`captureMode: ${user.settings.captureMode} (type: ${typeof user.settings.captureMode})`);
      console.log(`customJourneyEnabled: ${user.settings.customJourneyEnabled} (type: ${typeof user.settings.customJourneyEnabled})`);
      console.log(`Updated: ${user.settings.updatedAt}`);
    } else {
      console.error(`❌ User has NO settings`);
    }
    
    // Check for Event URLs associated with this user
    console.log('\n--- Event URLs for User ---');
    if (user.eventUrls && user.eventUrls.length > 0) {
      console.log(`✅ User has ${user.eventUrls.length} event URLs:`);
      user.eventUrls.forEach((url, index) => {
        console.log(`\n  URL #${index + 1}:`);
        console.log(`  ID: ${url.id}`);
        console.log(`  Path: ${url.urlPath}`);
        console.log(`  Active: ${url.isActive}`);
      });
    } else {
      console.error(`❌ User has NO event URLs`);
    }
    
    // Check for any URL path provided as an argument
    if (process.argv.length > 2) {
      const urlPath = process.argv[2];
      console.log(`\n--- Looking up specific URL path: ${urlPath} ---`);
      
      const eventUrl = await prisma.eventUrl.findFirst({
        where: {
          urlPath: urlPath,
          isActive: true
        }
      });
      
      if (eventUrl) {
        console.log(`✅ Found event URL with ID: ${eventUrl.id}`);
        console.log(`URL belongs to User ID: ${eventUrl.userId}`);
        
        // Check if this event URL has the correct user ID
        if (eventUrl.userId === specificUserId) {
          console.log(`✅ URL correctly belongs to our target user`);
        } else {
          console.error(`❌ URL belongs to a DIFFERENT user (${eventUrl.userId}), not our target user`);
        }
        
        // Check the settings for the URL's user
        const urlSettings = await prisma.settings.findFirst({
          where: {
            userId: eventUrl.userId
          }
        });
        
        if (urlSettings) {
          console.log(`\n--- Settings for URL's User ---`);
          console.log(`Settings ID: ${urlSettings.id}`);
          console.log(`Settings User ID: ${urlSettings.userId}`);
          console.log(`captureMode: ${urlSettings.captureMode} (${typeof urlSettings.captureMode})`);
          console.log(`customJourneyEnabled: ${urlSettings.customJourneyEnabled} (${typeof urlSettings.customJourneyEnabled})`);
        } else {
          console.error(`❌ No settings found for URL's user (${eventUrl.userId})`);
        }
        
        // Check the settings API route logic by simulating it
        console.log('\n--- Simulating API route logic ---');
        // Similar to the API route's logic
        const settings = await prisma.settings.findFirst({
          where: {
            userId: eventUrl.userId
          }
        });
        
        if (settings) {
          console.log(`✅ API would find settings with ID: ${settings.id}`);
          console.log(`Settings captureMode: ${settings.captureMode}`);
          console.log(`Settings customJourneyEnabled: ${settings.customJourneyEnabled}`);
        } else {
          console.error(`❌ API would NOT find settings for this URL's user`);
        }
      } else {
        console.error(`❌ No event URL found with path: ${urlPath}`);
      }
    }
    
    // General diagnostic information
    console.log('\n--- Database Statistics ---');
    const userCount = await prisma.user.count();
    const settingsCount = await prisma.settings.count();
    const eventUrlCount = await prisma.eventUrl.count();
    
    console.log(`Total Users: ${userCount}`);
    console.log(`Total Settings: ${settingsCount}`);
    console.log(`Total Event URLs: ${eventUrlCount}`);
    
    console.log('\n--- Potential Issues ---');
    // Check for settings without users
    const settingsWithoutUsers = await prisma.settings.findMany({
      where: {
        userId: null
      }
    });
    
    if (settingsWithoutUsers.length > 0) {
      console.error(`❌ Found ${settingsWithoutUsers.length} settings without associated users`);
    } else {
      console.log(`✅ All settings have associated users`);
    }
    
    // Check for users without settings
    const usersWithoutSettings = await prisma.user.count({
      where: {
        settings: null,
        role: 'CUSTOMER' // Only count customers
      }
    });
    
    if (usersWithoutSettings > 0) {
      console.error(`❌ Found ${usersWithoutSettings} customers without settings`);
    } else {
      console.log(`✅ All customers have settings`);
    }
    
    console.log('\n======= SETTINGS CHECK COMPLETE =======');
  } catch (error) {
    console.error('Error checking settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script with an optional URL path
// Example: node check-settings.js mytesturl
checkSettings()
  .then(() => console.log('Database check complete'))
  .catch(e => {
    console.error('Script error:', e);
    process.exit(1);
  });
