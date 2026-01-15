# Fix Profile UUID Default Value

## Problem

The `profiles` table has an `id` column of type UUID, but it doesn't have a default value set. When creating new users, the INSERT statement doesn't specify an `id`, causing the database to fail with an error.

## Solution

The `id` column needs to have `gen_random_uuid()` set as its default value so that PostgreSQL automatically generates a UUID when new rows are inserted without an explicit `id`.

## How to Apply the Fix

### Option 1: Run the SQL File Directly

1. Connect to your PostgreSQL database using your preferred tool (pgAdmin, psql, etc.)
2. Run the SQL file:
   ```bash
   psql $DATABASE_URL -f fix-profile-uuid.sql
   ```

### Option 2: Copy and Paste SQL

Copy and paste the following SQL into your database query tool:

```sql
-- Enable the pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add UUID default generation to the profiles table
ALTER TABLE profiles
ALTER COLUMN id SET DEFAULT gen_random_uuid();
```

### Option 3: Run via Node Script (if DATABASE_URL is configured)

If your `.env` file has valid database credentials, you can run:

```bash
node fix-profile-uuid-default.mjs
```

## Verification

After applying the fix, you can verify it worked by running:

```sql
SELECT column_name, column_default, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'id';
```

You should see `gen_random_uuid()` as the `column_default`.

## What This Fixes

After applying this fix, user creation will work properly because:
- When the API inserts a new user without specifying an `id`
- PostgreSQL will automatically generate a UUID using `gen_random_uuid()`
- The user will be created successfully with a unique UUID identifier

## Files Created

- `fix-profile-uuid.sql` - SQL script to apply the fix
- `fix-profile-uuid-default.mjs` - Node.js script to apply the fix (requires valid DATABASE_URL)
- `FIX-PROFILE-UUID-README.md` - This documentation
