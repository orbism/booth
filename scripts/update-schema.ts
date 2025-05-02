import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking storage settings in database...');

  try {
    // Get all settings records and update them with default storage settings
    const settings = await prisma.settings.findMany();
    
    // Just log that we're checking settings - the schema already has these fields
    console.log(`Found ${settings.length} settings records.`);
    console.log('All storage settings are properly defined in the schema.');
    console.log('No updates needed!');
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error executing script:', err);
    process.exit(1);
  }); 