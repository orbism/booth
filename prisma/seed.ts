// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed script...');
    
    try {
        // Clean up existing data if needed
        console.log('Cleaning up old settings...');
        await prisma.settings.deleteMany({});
        
        // Create default admin user
        const defaultEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        console.log(`Setting up admin user: ${defaultEmail}`);
        
        // Check for existing user
        let adminUser = await prisma.user.findUnique({
            where: { email: defaultEmail }
        });
        
        // Create user if it doesn't exist
        if (!adminUser) {
            const hashedPassword = await bcrypt.hash(
                process.env.ADMIN_PASSWORD || 'Admin123!', 
                12
            );
            
            adminUser = await prisma.user.create({
                data: {
                    name: 'Admin',
                    email: defaultEmail,
                    password: hashedPassword,
                }
            });
            console.log(`Created admin user: ${adminUser.email}`);
        } else {
            console.log(`Using existing admin user: ${adminUser.email}`);
        }
        
        // Create settings for the admin user
        console.log('Creating default settings...');
        
        // First create a raw object with our settings data
        const data = {
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
            // Use the connect syntax for relations
            user: {
                connect: { id: adminUser.id }
            }
        };
        
        // Actually create the settings
        const settings = await prisma.settings.create({ data });
        
        console.log(`Created default settings with ID: ${settings.id}`);
    } catch (error) {
        console.error('Error in seed script:', error);
        throw error;
    }
}

main()
  .catch((e) => {
    console.error('Failed to seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });