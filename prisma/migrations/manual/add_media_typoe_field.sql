-- Add mediaType field to BoothSession table

-- Check if mediaType column exists and add it if not
SELECT COUNT(*) INTO @mediaTypeExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'BoothSession' AND COLUMN_NAME = 'mediaType';

SET @query = IF(@mediaTypeExists = 0, 
    'ALTER TABLE BoothSession ADD COLUMN mediaType VARCHAR(191) DEFAULT "photo"', 
    'SELECT "mediaType column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;