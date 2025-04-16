-- prisma/migrations/manual/add_splash_page_fields.sql
-- Add splash page fields to Settings table

-- Check if splashPageEnabled column exists and add it if not
SELECT COUNT(*) INTO @splashEnabledExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'splashPageEnabled';

SET @query = IF(@splashEnabledExists = 0, 
    'ALTER TABLE Settings ADD COLUMN splashPageEnabled BOOLEAN DEFAULT false', 
    'SELECT "splashPageEnabled column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if splashPageTitle column exists and add it if not
SELECT COUNT(*) INTO @splashTitleExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'splashPageTitle';

SET @query = IF(@splashTitleExists = 0, 
    'ALTER TABLE Settings ADD COLUMN splashPageTitle VARCHAR(255) NULL', 
    'SELECT "splashPageTitle column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if splashPageContent column exists and add it if not
SELECT COUNT(*) INTO @splashContentExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'splashPageContent';

SET @query = IF(@splashContentExists = 0, 
    'ALTER TABLE Settings ADD COLUMN splashPageContent TEXT NULL', 
    'SELECT "splashPageContent column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if splashPageImage column exists and add it if not
SELECT COUNT(*) INTO @splashImageExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'splashPageImage';

SET @query = IF(@splashImageExists = 0, 
    'ALTER TABLE Settings ADD COLUMN splashPageImage VARCHAR(255) NULL', 
    'SELECT "splashPageImage column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if splashPageButtonText column exists and add it if not
SELECT COUNT(*) INTO @splashButtonExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'splashPageButtonText';

SET @query = IF(@splashButtonExists = 0, 
    'ALTER TABLE Settings ADD COLUMN splashPageButtonText VARCHAR(255) DEFAULT "Start"', 
    'SELECT "splashPageButtonText column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;