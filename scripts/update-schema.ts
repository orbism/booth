import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting schema update for storage settings...');

  try {
    // Get all settings records and update them with default storage settings
    const settings = await prisma.settings.findMany();
    
    for (const setting of settings) {
      await prisma.settings.update({
        where: { id: setting.id },
        data: {
          storageProvider: 'auto',
          blobVercelEnabled: true,
          localUploadPath: 'uploads',
          storageBaseUrl: null,
        },
      });
    }

    console.log(`Updated ${settings.length} settings records.`);
    console.log('Schema update completed successfully!');
  } catch (error) {
    console.error('Error updating schema:', error);
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