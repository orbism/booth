-- Add subscription tiers enum
CREATE TYPE IF NOT EXISTS `SubscriptionTier` AS ENUM ('FREE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'ADMIN');

-- Add subscription durations enum
CREATE TYPE IF NOT EXISTS `SubscriptionDuration` AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'TRIAL');

-- Add subscription status enum
CREATE TYPE IF NOT EXISTS `SubscriptionStatus` AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'TRIAL');

-- Add SaaS fields to User table
ALTER TABLE `User` 
ADD COLUMN IF NOT EXISTS `username` VARCHAR(191) NULL,
ADD COLUMN IF NOT EXISTS `organizationName` VARCHAR(191) NULL,
ADD COLUMN IF NOT EXISTS `organizationSize` VARCHAR(191) NULL,
ADD COLUMN IF NOT EXISTS `industry` VARCHAR(191) NULL,
ADD COLUMN IF NOT EXISTS `mediaCount` INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `emailsSent` INT NOT NULL DEFAULT 0,
ADD UNIQUE INDEX IF NOT EXISTS `User_username_key` (`username`);

-- Create Subscription table
CREATE TABLE IF NOT EXISTS `Subscription` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tier` ENUM('FREE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'ADMIN') NOT NULL DEFAULT 'FREE',
  `duration` ENUM('MONTHLY', 'QUARTERLY', 'ANNUAL', 'TRIAL') NOT NULL DEFAULT 'TRIAL',
  `status` ENUM('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'TRIAL') NOT NULL DEFAULT 'TRIAL',
  `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `endDate` DATETIME(3) NOT NULL,
  `trialEndDate` DATETIME(3) NULL,
  `stripeCustomerId` VARCHAR(191) NULL,
  `stripeSubscriptionId` VARCHAR(191) NULL,
  `stripePriceId` VARCHAR(191) NULL,
  `maxMedia` INT NOT NULL DEFAULT 10,
  `maxEmails` INT NOT NULL DEFAULT 5,
  `maxVideoDuration` INT NOT NULL DEFAULT 10,
  `maxDays` INT NOT NULL DEFAULT 1,
  `customDomain` BOOLEAN NOT NULL DEFAULT false,
  `analyticsAccess` BOOLEAN NOT NULL DEFAULT false,
  `filterAccess` BOOLEAN NOT NULL DEFAULT false,
  `videoAccess` BOOLEAN NOT NULL DEFAULT true,
  `aiEnhancement` BOOLEAN NOT NULL DEFAULT false,
  `journeyBuilder` BOOLEAN NOT NULL DEFAULT false,
  `brandingRemoval` BOOLEAN NOT NULL DEFAULT false,
  `prioritySupport` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Subscription_userId_key` (`userId`),
  UNIQUE INDEX `Subscription_stripeCustomerId_key` (`stripeCustomerId`)
);

-- Create EventUrl table
CREATE TABLE IF NOT EXISTS `EventUrl` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `urlPath` VARCHAR(191) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `eventName` VARCHAR(191) NOT NULL,
  `eventStartDate` DATETIME(3) NULL,
  `eventEndDate` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE INDEX `EventUrl_urlPath_key` (`urlPath`),
  INDEX `EventUrl_userId_idx` (`userId`)
);

-- Add eventUrl field to BoothSession
ALTER TABLE `BoothSession` 
ADD COLUMN IF NOT EXISTS `eventUrl` VARCHAR(191) NULL;

-- Add SaaS Branding fields to Settings
ALTER TABLE `Settings` 
ADD COLUMN IF NOT EXISTS `showBoothBossLogo` BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS `customCss` TEXT NULL;

-- Add user tracking to BoothAnalytics
ALTER TABLE `BoothAnalytics` 
ADD COLUMN IF NOT EXISTS `userId` VARCHAR(191) NULL,
ADD COLUMN IF NOT EXISTS `eventUrl` VARCHAR(191) NULL; 