# Fix for "study_streak" Column Error

## Problem
Your code was trying to access `study_streak` and `last_study_date` columns that didn't exist in the database, causing a PostgreSQL error:
```
error: column "study_streak" does not exist
```

## Solution

### Option 1: Fresh Database Setup (RECOMMENDED)
If you haven't committed important data yet, drop and recreate your database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Drop the existing database
DROP DATABASE IF EXISTS projectflow;

# Create new database
CREATE DATABASE projectflow;

# Connect to the new database
\c projectflow

# Run the updated schema (which now includes the missing columns)
\i backend/src/models/schema.sql

# Seed test data
\i backend/src/models/seed.sql

# Exit
\q
```

### Option 2: Migrate Existing Database (IF YOU HAVE DATA)
If you need to preserve existing data, run the migration:

```bash
# Connect to your existing database
psql -U postgres -d projectflow

# Run the migration to add the missing columns
\i backend/src/models/migration-add-streak.sql

# Exit
\q
```

## Changes Made

1. **Updated Schema** (`backend/src/models/schema.sql`)
   - Added `study_streak INTEGER DEFAULT 0` to users table
   - Added `last_study_date DATE` to users table

2. **Improved userRoutes.js** (`backend/src/routes/userRoutes.js`)
   - Added error handling for missing columns (gracefully handles the 42703 error)
   - Added streak logic: increments if user studied yesterday, resets if streak is broken
   - Added check to prevent counting the same day twice
   - Added helpful logging messages
   - Added presentation comments for your portfolio

3. **Created Migration File** (`backend/src/models/migration-add-streak.sql`)
   - Safe migration that won't error if columns already exist
   - Uses `IF NOT EXISTS` to be idempotent

## How the Streak Feature Works

- **First task completion:** streak = 1
- **Consecutive day completion:** streak increments (e.g., 1 → 2 → 3)
- **Gap in streak:** resets to 1
- **Same day multiple tasks:** doesn't double-count
- **last_study_date:** tracks the last day a streak update occurred

## Testing After Fix

1. **Restart your backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Try completing a task** - it should now work without the column error

3. **Check the logs** - you should see either:
   - "Streak update error" (if columns still don't exist)
   - "Already updated today" (if you complete multiple tasks same day)
   - Success response with new streak value

## Verification

After migration, verify columns exist:
```bash
psql -U postgres -d projectflow

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
```

Should show:
```
id              | integer
email           | character varying
password_hash   | character varying
name            | character varying
study_streak    | integer
last_study_date | date
created_at      | timestamp with time zone
```

## Need Help?

If you still see errors:
1. Make sure PostgreSQL is running
2. Verify you ran the migration or created fresh database
3. Check that the backend server restarted after schema changes
4. Look at the console logs for specific error messages
