-- Add journey-related fields to Settings table

-- Check if customJourneyEnabled column exists and add it if not
SELECT COUNT(*) INTO @journeyEnabledExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'customJourneyEnabled';

SET @query = IF(@journeyEnabledExists = 0, 
    'ALTER TABLE Settings ADD COLUMN customJourneyEnabled BOOLEAN DEFAULT false', 
    'SELECT "customJourneyEnabled column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if journeyConfig column exists and add it if not
SELECT COUNT(*) INTO @journeyConfigExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'journeyConfig';

SET @query = IF(@journeyConfigExists = 0, 
    'ALTER TABLE Settings ADD COLUMN journeyConfig JSON NULL', 
    'SELECT "journeyConfig column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;