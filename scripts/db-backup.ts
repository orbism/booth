import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backupData() {
  console.log('Starting database backup...');
  
  try {
    // Backup users
    const users = await prisma.user.findMany();
    console.log(`Backing up ${users.length} users...`);
    
    // Backup settings
    const settings = await prisma.settings.findMany();
    console.log(`Backing up ${settings.length} settings...`);
    
    // Backup booth sessions
    const boothSessions = await prisma.boothSession.findMany();
    console.log(`Backing up ${boothSessions.length} booth sessions...`);
    
    // Backup analytics
    const analytics = await prisma.boothAnalytics.findMany();
    console.log(`Backing up ${analytics.length} analytics records...`);
    
    // Backup event logs
    const eventLogs = await prisma.boothEventLog.findMany();
    console.log(`Backing up ${eventLogs.length} event logs...`);
    
    // Backup journey data
    const journeys = await prisma.journey.findMany();
    console.log(`Backing up ${journeys.length} journeys...`);
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '../backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    // Generate timestamp for the backup
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    
    // Write backup data to files
    fs.writeFileSync(
      path.join(backupDir, `users-${timestamp}.json`),
      JSON.stringify(users, null, 2)
    );
    
    fs.writeFileSync(
      path.join(backupDir, `settings-${timestamp}.json`),
      JSON.stringify(settings, null, 2)
    );
    
    fs.writeFileSync(
      path.join(backupDir, `booth-sessions-${timestamp}.json`),
      JSON.stringify(boothSessions, null, 2)
    );
    
    fs.writeFileSync(
      path.join(backupDir, `analytics-${timestamp}.json`),
      JSON.stringify(analytics, null, 2)
    );
    
    fs.writeFileSync(
      path.join(backupDir, `event-logs-${timestamp}.json`),
      JSON.stringify(eventLogs, null, 2)
    );
    
    fs.writeFileSync(
      path.join(backupDir, `journeys-${timestamp}.json`),
      JSON.stringify(journeys, null, 2)
    );
    
    console.log(`Backup completed successfully. Files stored in ${backupDir}`);
  } catch (error) {
    console.error('Error during backup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupData(); 