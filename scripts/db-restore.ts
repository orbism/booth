import { PrismaClient, SubscriptionTier, SubscriptionDuration, SubscriptionStatus, UserRole } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Function to find the most recent backup file
function findLatestBackup(type: string): string {
  const backupDir = path.join(__dirname, '../backup');
  const files = fs.readdirSync(backupDir)
    .filter(file => file.startsWith(type))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    throw new Error(`No ${type} backup files found`);
  }
  
  return path.join(backupDir, files[0]);
}

async function restoreData() {
  console.log('Starting database restoration...');
  
  try {
    // Load backed up data
    const usersFile = findLatestBackup('users');
    const settingsFile = findLatestBackup('settings');
    const boothSessionsFile = findLatestBackup('booth-sessions');
    
    console.log(`Loading users from ${usersFile}`);
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    
    console.log(`Loading settings from ${settingsFile}`);
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    
    console.log(`Loading booth sessions from ${boothSessionsFile}`);
    const boothSessions = JSON.parse(fs.readFileSync(boothSessionsFile, 'utf8'));
    
    // Restore Users with SaaS enhancements
    console.log(`\nRestoring ${users.length} users...`);
    
    for (const user of users) {
      // Skip if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email }
      });
      
      if (existingUser) {
        console.log(`User ${user.email} already exists, skipping...`);
        continue;
      }
      
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        password: user.password,
        role: user.role as UserRole,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
        // Add new SaaS fields
        username: user.username || user.email.split('@')[0],
        organizationName: user.organizationName || user.name,
        organizationSize: user.organizationSize || 'small',
        industry: user.industry || 'Other',
        mediaCount: 0,
        emailsSent: 0
      };
      
      const createdUser = await prisma.user.create({
        data: userData
      });
      
      console.log(`Restored user: ${createdUser.email}`);
      
      // Create subscription for this user
      const isAdmin = user.role === 'ADMIN';
      const subscriptionData = {
        userId: createdUser.id,
        tier: isAdmin ? SubscriptionTier.ADMIN : SubscriptionTier.FREE,
        duration: isAdmin ? SubscriptionDuration.ANNUAL : SubscriptionDuration.TRIAL,
        status: isAdmin ? SubscriptionStatus.ACTIVE : SubscriptionStatus.TRIAL,
        startDate: new Date(),
        endDate: addDays(new Date(), isAdmin ? 365 : 1),
        trialEndDate: !isAdmin ? addDays(new Date(), 1) : null,
        // Set limits based on tier
        maxMedia: isAdmin ? -1 : 10,
        maxEmails: isAdmin ? -1 : 5,
        maxVideoDuration: isAdmin ? -1 : 10,
        maxDays: isAdmin ? -1 : 1,
        // Set feature flags
        customDomain: isAdmin,
        analyticsAccess: isAdmin,
        filterAccess: isAdmin,
        videoAccess: true,
        aiEnhancement: isAdmin,
        journeyBuilder: isAdmin,
        brandingRemoval: isAdmin,
        prioritySupport: isAdmin
      };
      
      const subscription = await prisma.subscription.create({
        data: subscriptionData
      });
      
      console.log(`Created subscription for: ${createdUser.email}`);
      
      // Create default event URL for the user
      if (isAdmin) {
        await prisma.eventUrl.create({
          data: {
            userId: createdUser.id,
            urlPath: `${userData.username}-event`,
            eventName: 'Default Event',
            isActive: true,
            eventStartDate: new Date(),
            eventEndDate: addDays(new Date(), 30)
          }
        });
        console.log(`Created default event URL for: ${createdUser.email}`);
      }
    }
    
    // Restore Settings
    console.log(`\nRestoring ${settings.length} settings...`);
    
    for (const setting of settings) {
      // Skip if settings already exist for this user
      const existingSettings = await prisma.settings.findFirst({
        where: { userId: setting.userId }
      });
      
      if (existingSettings) {
        console.log(`Settings for user ${setting.userId} already exist, skipping...`);
        continue;
      }
      
      // Find the user these settings belong to
      const user = await prisma.user.findUnique({
        where: { id: setting.userId }
      });
      
      if (!user) {
        console.log(`User ${setting.userId} not found, cannot restore settings`);
        continue;
      }
      
      const settingData = {
        id: setting.id,
        eventName: setting.eventName,
        adminEmail: setting.adminEmail,
        countdownTime: setting.countdownTime,
        resetTime: setting.resetTime,
        emailSubject: setting.emailSubject,
        emailTemplate: setting.emailTemplate,
        smtpHost: setting.smtpHost,
        smtpPort: setting.smtpPort,
        smtpUser: setting.smtpUser,
        smtpPassword: setting.smtpPassword,
        companyName: setting.companyName,
        companyLogo: setting.companyLogo,
        primaryColor: setting.primaryColor,
        secondaryColor: setting.secondaryColor,
        theme: setting.theme,
        backgroundColor: setting.backgroundColor,
        borderColor: setting.borderColor,
        buttonColor: setting.buttonColor,
        textColor: setting.textColor,
        notes: setting.notes,
        customJourneyEnabled: setting.customJourneyEnabled,
        activeJourneyId: setting.activeJourneyId,
        journeyConfig: setting.journeyConfig,
        splashPageEnabled: setting.splashPageEnabled,
        splashPageTitle: setting.splashPageTitle,
        splashPageContent: setting.splashPageContent,
        splashPageImage: setting.splashPageImage,
        splashPageButtonText: setting.splashPageButtonText,
        captureMode: setting.captureMode,
        photoOrientation: setting.photoOrientation,
        photoDevice: setting.photoDevice,
        photoResolution: setting.photoResolution,
        photoEffect: setting.photoEffect,
        printerEnabled: setting.printerEnabled,
        aiImageCorrection: setting.aiImageCorrection,
        videoOrientation: setting.videoOrientation,
        videoDevice: setting.videoDevice,
        videoResolution: setting.videoResolution,
        videoEffect: setting.videoEffect,
        videoDuration: setting.videoDuration,
        filtersEnabled: setting.filtersEnabled,
        enabledFilters: setting.enabledFilters,
        storageProvider: setting.storageProvider,
        blobVercelEnabled: setting.blobVercelEnabled,
        localUploadPath: setting.localUploadPath,
        storageBaseUrl: setting.storageBaseUrl,
        // Add new SaaS fields
        showBoothBossLogo: user.role === 'ADMIN' ? false : true,
        customCss: null,
        // Connect to user
        userId: setting.userId,
        // Add timestamps
        createdAt: new Date(setting.createdAt),
        updatedAt: new Date(setting.updatedAt)
      };
      
      const createdSettings = await prisma.settings.create({
        data: settingData
      });
      
      console.log(`Restored settings for user: ${user.email}`);
    }
    
    // Restore Booth Sessions
    console.log(`\nRestoring ${boothSessions.length} booth sessions...`);
    
    for (const session of boothSessions) {
      // Skip if session already exists
      const existingSession = await prisma.boothSession.findUnique({
        where: { id: session.id }
      });
      
      if (existingSession) {
        console.log(`Session ${session.id} already exists, skipping...`);
        continue;
      }
      
      const sessionData = {
        id: session.id,
        userId: session.userId,
        userName: session.userName,
        userEmail: session.userEmail,
        photoPath: session.photoPath,
        mediaType: session.mediaType,
        filter: session.filter,
        createdAt: new Date(session.createdAt),
        shared: session.shared,
        emailSent: session.emailSent,
        templateUsed: session.templateUsed,
        eventName: session.eventName,
        // Add new field
        eventUrl: null
      };
      
      const createdSession = await prisma.boothSession.create({
        data: sessionData
      });
      
      console.log(`Restored booth session: ${createdSession.id}`);
      
      // If the session belongs to a user, update that user's mediaCount
      if (session.userId) {
        await prisma.user.update({
          where: { id: session.userId },
          data: { 
            mediaCount: { increment: 1 },
            // If this session's emailSent is true, increment emailsSent too
            ...(session.emailSent ? { emailsSent: { increment: 1 } } : {})
          }
        });
      }
    }
    
    console.log('\nData restoration completed successfully');
  } catch (error) {
    console.error('Error during restoration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData(); 