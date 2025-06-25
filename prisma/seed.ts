// prisma/seed.ts

import { PrismaClient, SubscriptionTier, SubscriptionDuration, SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to add days to a date
function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

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
                    role: 'ADMIN',
                    username: 'admin',
                    organizationName: 'BoothBoss Admin',
                }
            });
            console.log(`Created admin user: ${adminUser.email}`);
        } else {
            console.log(`Using existing admin user: ${adminUser.email}`);
            
            // Update admin role if needed
            if (adminUser.role !== 'ADMIN') {
                await prisma.user.update({
                    where: { id: adminUser.id },
                    data: { 
                        role: 'ADMIN',
                        username: 'admin',
                        organizationName: 'BoothBoss Admin',
                    }
                });
                console.log(`Updated admin role for: ${adminUser.email}`);
            }
        }
        
        // Create or update admin subscription
        let adminSubscription = await prisma.subscription.findUnique({
            where: { userId: adminUser.id }
        });
        
        if (!adminSubscription) {
            adminSubscription = await prisma.subscription.create({
                data: {
                    userId: adminUser.id,
                    tier: SubscriptionTier.ADMIN,
                    duration: SubscriptionDuration.ANNUAL,
                    status: SubscriptionStatus.ACTIVE,
                    startDate: new Date(),
                    endDate: addDays(new Date(), 365),
                    maxMedia: -1, // Unlimited
                    maxEmails: -1, // Unlimited
                    maxVideoDuration: -1, // Unlimited
                    maxDays: -1, // Unlimited
                    customDomain: true,
                    analyticsAccess: true,
                    filterAccess: true,
                    videoAccess: true,
                    aiEnhancement: true,
                    journeyBuilder: true,
                    brandingRemoval: true,
                    prioritySupport: true
                }
            });
            console.log(`Created admin subscription for: ${adminUser.email}`);
        } else {
            // Update subscription if needed
            await prisma.subscription.update({
                where: { id: adminSubscription.id },
                data: {
                    tier: SubscriptionTier.ADMIN,
                    duration: SubscriptionDuration.ANNUAL,
                    status: SubscriptionStatus.ACTIVE,
                    endDate: addDays(new Date(), 365),
                    maxMedia: -1, // Unlimited
                    maxEmails: -1, // Unlimited
                    maxVideoDuration: -1, // Unlimited
                    maxDays: -1, // Unlimited
                    customDomain: true,
                    analyticsAccess: true,
                    filterAccess: true,
                    videoAccess: true,
                    aiEnhancement: true,
                    journeyBuilder: true,
                    brandingRemoval: true,
                    prioritySupport: true
                }
            });
            console.log(`Updated admin subscription for: ${adminUser.email}`);
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
            companyName: 'Bureau of Internet Culture',
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF',
            theme: 'custom',
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            buttonColor: '#3B82F6',
            textColor: '#111827',
            notes: 'Default settings created during installation.',
            showBoothBossLogo: false, // Admin doesn't need branding
            // Use the connect syntax for relations
            user: {
                connect: { id: adminUser.id }
            }
        };
        
        // Actually create the settings
        const settings = await prisma.settings.create({ data });
        
        console.log(`Created default settings with ID: ${settings.id}`);
        
        // Create default event URL for admin
        const defaultEventUrl = await prisma.eventUrl.findFirst({
            where: { 
                userId: adminUser.id,
                urlPath: 'admin-demo'
            }
        });
        
        if (!defaultEventUrl) {
            await prisma.eventUrl.create({
                data: {
                    userId: adminUser.id,
                    urlPath: 'admin-demo',
                    eventName: 'Admin Demo Event',
                    isActive: true,
                    eventStartDate: new Date(),
                    eventEndDate: addDays(new Date(), 30)
                }
            });
            console.log('Created default event URL for admin');
        }
        
        console.log('Seed script completed successfully');
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