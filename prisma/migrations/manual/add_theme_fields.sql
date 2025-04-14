-- Add theme-related fields to Settings table if they don't exist

-- Check if theme column exists and add it if not
SELECT COUNT(*) INTO @themeExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'theme';

SET @query = IF(@themeExists = 0, 
    'ALTER TABLE Settings ADD COLUMN theme VARCHAR(20) DEFAULT "custom"', 
    'SELECT "theme column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if backgroundColor column exists and add it if not
SELECT COUNT(*) INTO @bgColorExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'backgroundColor';

SET @query = IF(@bgColorExists = 0, 
    'ALTER TABLE Settings ADD COLUMN backgroundColor VARCHAR(20) NULL', 
    'SELECT "backgroundColor column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if borderColor column exists and add it if not
SELECT COUNT(*) INTO @borderColorExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'borderColor';

SET @query = IF(@borderColorExists = 0, 
    'ALTER TABLE Settings ADD COLUMN borderColor VARCHAR(20) NULL', 
    'SELECT "borderColor column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if buttonColor column exists and add it if not
SELECT COUNT(*) INTO @buttonColorExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'buttonColor';

SET @query = IF(@buttonColorExists = 0, 
    'ALTER TABLE Settings ADD COLUMN buttonColor VARCHAR(20) NULL', 
    'SELECT "buttonColor column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if textColor column exists and add it if not
SELECT COUNT(*) INTO @textColorExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'textColor';

SET @query = IF(@textColorExists = 0, 
    'ALTER TABLE Settings ADD COLUMN textColor VARCHAR(20) NULL', 
    'SELECT "textColor column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;