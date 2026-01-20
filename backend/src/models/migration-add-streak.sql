-- Migration: Add study_streak and last_study_date columns to users table
-- Run this if your database already exists and is missing these columns

-- Add the missing columns with defaults
ALTER TABLE users
ADD COLUMN IF NOT EXISTS study_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_study_date DATE;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users';
