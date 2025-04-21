-- Add filters fields to Settings table

-- Check if filtersEnabled column exists and add it if not
SELECT COUNT(*) INTO @filtersEnabledExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'filtersEnabled';

SET @query = IF(@filtersEnabledExists = 0, 
    'ALTER TABLE Settings ADD COLUMN filtersEnabled BOOLEAN DEFAULT false', 
    'SELECT "filtersEnabled column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if enabledFilters column exists and add it if not
SELECT COUNT(*) INTO @enabledFiltersExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'enabledFilters';

SET @query = IF(@enabledFiltersExists = 0, 
    'ALTER TABLE Settings ADD COLUMN enabledFilters TEXT NULL', 
    'SELECT "enabledFilters column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;