# Bolt.new Deployment Fix - Environment Variables Missing

## Problem
Your Bolt.new deployment shows "No Connection" because environment variables are not configured.

## Solution: Add Environment Variables in Bolt.new

### Step 1: Access Environment Variables
1. In your Bolt.new project, look for:
   - Settings icon (gear/cog)
   - "Environment Variables" menu
   - "Secrets" section
   - Or similar configuration area

### Step 2: Add Required Variables

Add these **exact** environment variables:

**Variable Name:** `VITE_SUPABASE_URL`
**Value:**
```
https://gglzmggwifbkxtxjclcw.supabase.co
```

**Variable Name:** `VITE_SUPABASE_ANON_KEY`
**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnbHptZ2d3aWZia3h0eGpjbGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzQwNDYsImV4cCI6MjA3NjcxMDA0Nn0.N1RXMKEc9KeTVWoljsKZEzgcO6avl8VhpNG1xULf0xg
```

### Step 3: Redeploy
After adding variables, you MUST:
- Click "Redeploy" or "Rebuild"
- Or trigger a new deployment
- The build process needs to run again with these variables

### Step 4: Verify Connection
After redeployment:
1. Open your deployment URL
2. Open browser console (F12)
3. You should NOT see warnings about missing environment variables
4. The "No Connection" banner should disappear

## Common Mistakes

❌ **Don't forget the prefix:** Variable names MUST start with `VITE_`
- ❌ Wrong: `SUPABASE_URL`
- ✅ Correct: `VITE_SUPABASE_URL`

❌ **Don't skip redeployment:** Adding variables alone is not enough - you must rebuild!

❌ **Don't add quotes:** Copy values exactly as shown, without extra quotes

## Test Login Credentials

Once connected, you can log in with:

**Admin Account:**
- Email: `judithdavy@changesltd.com`
- Password: (needs to be reset - see below)

**Test Instructor:**
- Email: `teacher@example.edu`
- Password: (needs to be reset - see below)

## Need to Reset Password?

1. On login page, click "Forgot Password"
2. Enter your email
3. Check email for reset link
4. Or contact admin for password assistance

## Still Not Working?

### Check Browser Console
1. Press F12 to open developer tools
2. Go to Console tab
3. Look for errors like:
   - "VITE_SUPABASE_URL is missing"
   - "Failed to fetch"
   - CORS errors

### Verify Supabase Configuration
Your Bolt.new URL must be allowed in Supabase:

1. Go to: https://supabase.com/dashboard/project/gglzmggwifbkxtxjclcw/auth/url-configuration
2. Add your Bolt.new URL to "Site URL"
3. Add your Bolt.new URL to "Redirect URLs" (with `/*` at the end)
4. Save changes

### Check Network Tab
1. F12 → Network tab
2. Try to log in
3. Look for failed requests to Supabase
4. Check if requests are being made to the correct URL

## Quick Verification Checklist

- [ ] Environment variables added in Bolt.new settings
- [ ] Variables named exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Project redeployed/rebuilt after adding variables
- [ ] Bolt.new URL added to Supabase auth configuration
- [ ] Browser console shows no missing variable warnings
- [ ] "No Connection" banner is gone

## Updated Features

This updated version includes:
- Better error messages showing which variables are missing
- Clearer connection status indicators
- Instructions in the error banner about environment variables

## Need Help?

If you're still seeing "No Connection" after following all steps:
1. Share your Bolt.new deployment URL
2. Share screenshot of browser console (F12)
3. Confirm environment variables are set in Bolt.new
