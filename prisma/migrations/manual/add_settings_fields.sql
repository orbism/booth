-- First, get the existing admin user ID (or create one if doesn't exist)
SET @adminId = (SELECT id FROM User WHERE email = 'admin@example.com' LIMIT 1);

-- Create the admin user if it doesn't exist
SET @adminPassword = '$2a$12$XVVDUJxQq1uhvPzYYu.xmeh4m5AQjbS1I/kYFJcA6ClhpA4B3QwP.'; -- Admin123!

SET @stmt = CONCAT('INSERT INTO User (id, name, email, password, createdAt, updatedAt) 
    SELECT "admin", "Admin", "admin@example.com", "', @adminPassword, '", NOW(), NOW() 
    WHERE NOT EXISTS (SELECT 1 FROM User WHERE email = "admin@example.com" LIMIT 1)');

PREPARE insert_admin FROM @stmt;
EXECUTE insert_admin;
DEALLOCATE PREPARE insert_admin;

-- Get the admin ID again (in case it was just created)
SET @adminId = (SELECT id FROM User WHERE email = 'admin@example.com' LIMIT 1);

-- Add default values for userId and timestamps in Settings
ALTER TABLE Settings
ADD COLUMN updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
ADD COLUMN createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
ADD COLUMN userId VARCHAR(191) DEFAULT @adminId,
ADD UNIQUE INDEX Settings_userId_key (userId);

-- Add showBoothBossLogo and customCss columns to Settings
ALTER TABLE Settings
ADD COLUMN showBoothBossLogo BOOLEAN DEFAULT TRUE,
ADD COLUMN customCss TEXT NULL;

-- Add userId column to User table
ALTER TABLE User 
ADD COLUMN role ENUM('ADMIN', 'USER') DEFAULT 'USER';

-- Set admin role
UPDATE User SET role = 'ADMIN' WHERE email = 'admin@example.com';

-- Add mediaCount and emailsSent columns to User
ALTER TABLE User
ADD COLUMN mediaCount INT NOT NULL DEFAULT 0,
ADD COLUMN emailsSent INT NOT NULL DEFAULT 0;

-- Add SaaS fields to User
ALTER TABLE User 
ADD COLUMN username VARCHAR(191) NULL,
ADD COLUMN organizationName VARCHAR(191) NULL,
ADD COLUMN organizationSize VARCHAR(191) NULL,
ADD COLUMN industry VARCHAR(191) NULL,
ADD UNIQUE INDEX User_username_key (username);

-- Update admin username
UPDATE User SET username = 'admin', organizationName = 'BoothBoss Admin' WHERE email = 'admin@example.com';

-- Add eventUrl fields to BoothSession
ALTER TABLE BoothSession 
ADD COLUMN eventUrl VARCHAR(191) NULL;

-- Add user tracking to BoothAnalytics
ALTER TABLE BoothAnalytics 
ADD COLUMN userId VARCHAR(191) NULL,
ADD COLUMN eventUrl VARCHAR(191) NULL;

-- Create storage settings columns if they don't exist
ALTER TABLE Settings
ADD COLUMN storageProvider VARCHAR(191) DEFAULT 'auto',
ADD COLUMN blobVercelEnabled BOOLEAN DEFAULT TRUE, 
ADD COLUMN localUploadPath VARCHAR(191) DEFAULT 'uploads',
ADD COLUMN storageBaseUrl VARCHAR(191) NULL; 