// scripts/migrate-capture-mode.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Starting capture mode fields migration...');
  
  const prisma = new PrismaClient();
  
  try {
    // First, ensure the schema is up to date
    console.log('Pushing schema changes...');
    require('child_process').execSync('npx prisma db push', { stdio: 'inherit' });
    
    // Check if any settings exist
    const settingsCount = await prisma.settings.count();
    
    if (settingsCount === 0) {
      console.log('No settings found, creating default settings with capture mode fields...');
      
      // Create default settings with capture mode fields
      await prisma.settings.create({
        data: {
          eventName: 'Photo Booth Demo',
          adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
          countdownTime: 3,
          resetTime: 60,
          emailSubject: 'Your Photo Booth Picture',
          emailTemplate: 'Thank you for using our photo booth! Here is your photo from our event.',
          smtpHost: process.env.SMTP_HOST || 'smtp.dreamhost.com',
          smtpPort: parseInt(process.env.SMTP_PORT || '587'),
          smtpUser: process.env.SMTP_USER || 'youremail@yourdomain.com',
          smtpPassword: process.env.SMTP_PASS || 'your-email-password',
          companyName: 'BoothBoss',
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          theme: 'custom',
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
          buttonColor: '#3B82F6',
          textColor: '#111827',
          notes: 'Default settings created during installation.',
          captureMode: 'photo',
          photoOrientation: 'portrait-standard',
          photoDevice: 'ipad',
          photoResolution: 'medium',
          photoEffect: 'none',
          printerEnabled: false,
          aiImageCorrection: false,
          videoOrientation: 'portrait-standard',
          videoDevice: 'ipad',
          videoResolution: 'medium',
          videoEffect: 'none',
          videoDuration: 10,
        }
      });
    } else {
      console.log('Updating existing settings with capture mode fields...');
      
      // Update existing settings with default capture mode values if they're null
      await prisma.settings.updateMany({
        where: {
          OR: [
            { captureMode: null },
            { photoOrientation: null },
            { photoDevice: null },
            { photoResolution: null },
            { photoEffect: null },
            { videoOrientation: null },
            { videoDevice: null },
            { videoResolution: null },
            { videoEffect: null },
            { videoDuration: null }
          ]
        },
        data: {
          captureMode: 'photo',
          photoOrientation: 'portrait-standard',
          photoDevice: 'ipad',
          photoResolution: 'medium',
          photoEffect: 'none',
          printerEnabled: false,
          aiImageCorrection: false,
          videoOrientation: 'portrait-standard',
          videoDevice: 'ipad',
          videoResolution: 'medium',
          videoEffect: 'none',
          videoDuration: 10,
        }
      });
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();