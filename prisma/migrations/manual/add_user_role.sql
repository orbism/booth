-- Add UserRole enum
CREATE TYPE IF NOT EXISTS `UserRole` AS ENUM ('ADMIN', 'USER');

-- Add role field to User table with default value of 'USER'
ALTER TABLE `User` ADD COLUMN `role` ENUM('ADMIN', 'USER') DEFAULT 'USER' NOT NULL; 