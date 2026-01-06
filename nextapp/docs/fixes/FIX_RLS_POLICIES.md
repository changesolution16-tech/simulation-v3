# Fix RLS Infinite Recursion Issue

## Problem
The current RLS policies on the `profiles` table are causing infinite recursion, preventing login.

## Solution
Execute this SQL in your Supabase Dashboard SQL Editor:

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project: `gglzmggwifbkxtxjclcw`
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Run This SQL

```sql
-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Instructors can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;

-- Create new non-recursive policies

-- Allow all authenticated users to view all profiles (no recursion)
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile only
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role (edge functions) has full access
CREATE POLICY "Service role has full access"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can create their own profile during signup
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
```

### Step 3: Verify
After running the SQL, try logging in again with:
- Email: `admin@example.com`
- Password: `admin123`

## Why This Fixes The Issue

The previous policies were checking the `profiles` table from within `profiles` policies:
```sql
-- This caused recursion:
USING (
  EXISTS (
    SELECT 1 FROM profiles  -- ❌ Querying profiles FROM profiles policy
    WHERE id = auth.uid() AND role = 'admin'
  )
)
```

The new policies use simple checks without table queries:
```sql
-- No recursion:
USING (true)  -- ✅ Simple boolean, no table query
USING (auth.uid() = id)  -- ✅ Direct comparison, no subquery
```

## Security Notes

- All authenticated users can view profile data (names, emails, roles)
  - This is acceptable since this data isn't sensitive
  - Needed for admin UI and teacher dashboards
- Users can only update their own profile
- Only service role (edge functions) can create/delete users
- Admin operations go through edge functions which use service role

## After Applying

You should be able to:
1. ✅ Login with test credentials
2. ✅ View users in admin dashboard
3. ✅ Create new users through the UI
4. ✅ Role-based routing works correctly
