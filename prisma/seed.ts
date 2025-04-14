// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import { createAdminUser } from '../src/lib/admin';

const prisma = new PrismaClient();

async function main() {
    // Clean up existing data if needed
    await prisma.settings.deleteMany({});

    // Create default settings
    const settings = await prisma.settings.create({
        data: {
            eventName: 'Photo Booth Demo',
            adminEmail: process.env.SMTP_USER || 'admin@example.com',
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
        }
    });

    console.log(`Created default settings with ID: ${settings.id}`);
    
    // Create admin user if ADMIN_EMAIL is set
    if (process.env.ADMIN_EMAIL) {
        try {
            const admin = await createAdminUser();
            console.log(`Admin user created/verified: ${admin.email}`);
        } catch (error) {
            console.error('Failed to create admin user:', error);
        }
    }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });