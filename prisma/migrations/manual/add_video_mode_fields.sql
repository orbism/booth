-- Add capture mode fields to Settings table

-- Check if captureMode column exists and add it if not
SELECT COUNT(*) INTO @captureModeExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'captureMode';

SET @query = IF(@captureModeExists = 0, 
    'ALTER TABLE Settings ADD COLUMN captureMode VARCHAR(191) DEFAULT "photo"', 
    'SELECT "captureMode column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Photo Mode Settings
-- Check if photoOrientation column exists and add it if not
SELECT COUNT(*) INTO @photoOrientationExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'photoOrientation';

SET @query = IF(@photoOrientationExists = 0, 
    'ALTER TABLE Settings ADD COLUMN photoOrientation VARCHAR(191) DEFAULT "portrait-standard"', 
    'SELECT "photoOrientation column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if photoDevice column exists and add it if not
SELECT COUNT(*) INTO @photoDeviceExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'photoDevice';

SET @query = IF(@photoDeviceExists = 0, 
    'ALTER TABLE Settings ADD COLUMN photoDevice VARCHAR(191) DEFAULT "ipad"', 
    'SELECT "photoDevice column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if photoResolution column exists and add it if not
SELECT COUNT(*) INTO @photoResolutionExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'photoResolution';

SET @query = IF(@photoResolutionExists = 0, 
    'ALTER TABLE Settings ADD COLUMN photoResolution VARCHAR(191) DEFAULT "medium"', 
    'SELECT "photoResolution column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if photoEffect column exists and add it if not
SELECT COUNT(*) INTO @photoEffectExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'photoEffect';

SET @query = IF(@photoEffectExists = 0, 
    'ALTER TABLE Settings ADD COLUMN photoEffect VARCHAR(191) DEFAULT "none"', 
    'SELECT "photoEffect column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if printerEnabled column exists and add it if not
SELECT COUNT(*) INTO @printerEnabledExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'printerEnabled';

SET @query = IF(@printerEnabledExists = 0, 
    'ALTER TABLE Settings ADD COLUMN printerEnabled BOOLEAN DEFAULT false', 
    'SELECT "printerEnabled column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if aiImageCorrection column exists and add it if not
SELECT COUNT(*) INTO @aiImageCorrectionExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'aiImageCorrection';

SET @query = IF(@aiImageCorrectionExists = 0, 
    'ALTER TABLE Settings ADD COLUMN aiImageCorrection BOOLEAN DEFAULT false', 
    'SELECT "aiImageCorrection column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Video Mode Settings
-- Check if videoOrientation column exists and add it if not
SELECT COUNT(*) INTO @videoOrientationExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'videoOrientation';

SET @query = IF(@videoOrientationExists = 0, 
    'ALTER TABLE Settings ADD COLUMN videoOrientation VARCHAR(191) DEFAULT "portrait-standard"', 
    'SELECT "videoOrientation column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if videoDevice column exists and add it if not
SELECT COUNT(*) INTO @videoDeviceExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'videoDevice';

SET @query = IF(@videoDeviceExists = 0, 
    'ALTER TABLE Settings ADD COLUMN videoDevice VARCHAR(191) DEFAULT "ipad"', 
    'SELECT "videoDevice column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if videoResolution column exists and add it if not
SELECT COUNT(*) INTO @videoResolutionExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'videoResolution';

SET @query = IF(@videoResolutionExists = 0, 
    'ALTER TABLE Settings ADD COLUMN videoResolution VARCHAR(191) DEFAULT "medium"', 
    'SELECT "videoResolution column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if videoEffect column exists and add it if not
SELECT COUNT(*) INTO @videoEffectExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'videoEffect';

SET @query = IF(@videoEffectExists = 0, 
    'ALTER TABLE Settings ADD COLUMN videoEffect VARCHAR(191) DEFAULT "none"', 
    'SELECT "videoEffect column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if videoDuration column exists and add it if not
SELECT COUNT(*) INTO @videoDurationExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Settings' AND COLUMN_NAME = 'videoDuration';

SET @query = IF(@videoDurationExists = 0, 
    'ALTER TABLE Settings ADD COLUMN videoDuration INT DEFAULT 10', 
    'SELECT "videoDuration column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;