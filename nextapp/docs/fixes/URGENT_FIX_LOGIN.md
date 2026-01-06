# URGENT: Fix Login Issue

## The Problem
Login is failing with "invalid credentials" because of **infinite recursion in database policies**.

The browser console shows:
```
Error: infinite recursion detected in policy for relation "profiles"
```

## The Fix (Takes 2 Minutes)

### Step 1: Open Supabase Dashboard SQL Editor

1. Go to: https://supabase.com/dashboard/project/gglzmggwifbkxtxjclcw
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"** button

### Step 2: Copy and Paste This ENTIRE SQL Block

```sql
-- Fix infinite recursion in profiles RLS policies
-- This SQL is safe to run multiple times

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

CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role has full access"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
```

### Step 3: Click "Run" (or press Ctrl+Enter / Cmd+Enter)

You should see: **"Success. No rows returned"**

### Step 4: Test Login

Now try logging in with:

**Option 1 - Admin Account:**
- Email: `admin@example.com`
- Password: `admin123`
- Click the eye icon to see your password as you type

**Option 2 - Teacher Account:**
- Email: `teacher@example.edu`
- Password: `teacher123`

**Option 3 - Student Account:**
- Email: `student@university.edu`
- Password: `student123`

## What Changed

### Before (Broken):
```sql
-- This caused infinite loop:
USING (
  EXISTS (
    SELECT 1 FROM profiles    -- ❌ Querying profiles FROM profiles policy!
    WHERE id = auth.uid() AND role = 'admin'
  )
)
```

### After (Fixed):
```sql
-- Simple, no recursion:
USING (true)                   -- ✅ Just allow it
USING (auth.uid() = id)        -- ✅ Simple comparison
```

## Why This Is Safe

- All authenticated users can VIEW profiles (names, emails, roles) - not sensitive data
- Only users can UPDATE their own profile
- Only service role (edge functions) can create/delete users
- Admin operations happen through edge functions with elevated privileges

## After Fix Works, You'll Be Able To:

✅ Login with correct credentials
✅ See role-based dashboard (Admin/Teacher/Student)
✅ Admin can manage users
✅ Teachers can create cohorts
✅ Students can view assignments
✅ Password visibility toggle (eye icon) works

## Still Not Working?

If you still get "invalid credentials" after applying the SQL:

1. Open browser console (F12)
2. Look for any error messages
3. Try the password visibility toggle to ensure you're typing the right password
4. Clear browser cache and try again
5. Check that you're using the exact email/password combinations above

## Alternative: Create New Admin User

If you want to create a fresh admin user with your own password:

```sql
-- Replace 'your-email@example.com' and 'your-password' with your desired credentials
-- Note: This requires the RLS fix above to be applied first!
```

Then use the edge function:
```bash
curl -X POST "https://gglzmggwifbkxtxjclcw.supabase.co/functions/v1/setup-admin"
```
