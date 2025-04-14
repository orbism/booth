// scripts/migrate-theme-fields.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Starting theme fields migration...');
  
  const prisma = new PrismaClient();
  
  try {
    // First, ensure the schema is up to date
    console.log('Pushing schema changes...');
    require('child_process').execSync('npx prisma db push', { stdio: 'inherit' });
    
    // Check if any settings exist
    const settingsCount = await prisma.settings.count();
    
    if (settingsCount === 0) {
      console.log('No settings found, creating default settings with theme fields...');
      
      // Create default settings with theme fields
      await prisma.settings.create({
        data: {
          eventName: 'Photo Booth Demo',
          adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
          countdownTime: 3,
          resetTime: 60,
          emailSubject: 'Your Photo Booth Picture',
          emailTemplate: 'Thank you for using our photo booth! Here is your photo from our event.',
          smtpHost: process.env.SMTP_HOST || 'smtp.example.com',
          smtpPort: parseInt(process.env.SMTP_PORT || '587'),
          smtpUser: process.env.SMTP_USER || 'user@example.com',
          smtpPassword: process.env.SMTP_PASS || 'password',
          companyName: 'BoothBoss',
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          theme: 'custom',
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
          buttonColor: '#3B82F6',
          textColor: '#111827',
        }
      });
    } else {
      console.log('Updating existing settings with theme fields...');
      
      // Update existing settings with default theme values if they're null
      await prisma.settings.updateMany({
        where: {
          OR: [
            { theme: null },
            { backgroundColor: null },
            { borderColor: null },
            { buttonColor: null },
            { textColor: null }
          ]
        },
        data: {
          theme: 'custom',
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
          buttonColor: '#3B82F6',
          textColor: '#111827',
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