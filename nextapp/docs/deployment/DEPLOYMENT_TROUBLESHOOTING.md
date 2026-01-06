# Deployment Troubleshooting Guide

## Issue: Login Works Locally but Not on Published Site

### Problem 1: Environment Variables Not Set

**Symptoms**:
- Can't login on published site
- Console shows: "⚠️ Supabase is not configured properly!"
- Styling may look different

**Solution**:

#### For Netlify:
1. Go to: **Site Settings → Build & deploy → Environment variables**
2. Add these variables:
   ```
   VITE_SUPABASE_URL = https://gglzmggwifbkxtxjclcw.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnbHptZ2d3aWZia3h0eGpjbGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzQwNDYsImV4cCI6MjA3NjcxMDA0Nn0.N1RXMKEc9KeTVWoljsKZEzgcO6avl8VhpNG1xULf0xg
   ```
3. Click **Save**
4. Go to **Deploys** → **Trigger deploy** → **Clear cache and deploy**

#### For Vercel:
1. Go to: **Project Settings → Environment Variables**
2. Add the same variables above
3. Click **Save**
4. Go to **Deployments** → Click "..." → **Redeploy**

#### For AWS Amplify:
1. Go to: **App Settings → Environment variables**
2. Add the variables
3. Redeploy

#### For Custom Server/EC2:
Create `.env` file in your project root:
```bash
VITE_SUPABASE_URL=https://gglzmggwifbkxtxjclcw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnbHptZ2d3aWZia3h0eGpjbGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzQwNDYsImV4cCI6MjA3NjcxMDA0Nn0.N1RXMKEc9KeTVWoljsKZEzgcO6avl8VhpNG1xULf0xg
```

---

### Problem 2: CSS Not Loading (Styling Looks Different)

**Symptoms**:
- Site looks unstyled or different from local
- Missing colors, layouts, etc.

**Causes**:
1. CSS file not included in build
2. Wrong base path
3. Cache issues

**Solutions**:

#### Check 1: Verify CSS in Build
```bash
# Local check
ls -lh dist/assets/*.css
# Should show: index-[hash].css (~70KB)
```

#### Check 2: Clear Browser Cache
1. Open published site
2. Press: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
3. Or: **F12** → **Network tab** → Check "Disable cache"

#### Check 3: Verify in Browser Console
Open DevTools (F12) and check:
- **Console tab**: Look for 404 errors on CSS files
- **Network tab**: Look for failed CSS requests
- **Elements tab**: Check if `<link>` tags exist for CSS

#### Check 4: Rebuild and Deploy
```bash
# Clean rebuild
rm -rf dist node_modules/.vite
npm install
npm run build
# Then redeploy
```

---

### Problem 3: Supabase Authentication Issues

**Symptoms**:
- Login button does nothing
- "Invalid credentials" for working accounts

**Check Database User Exists**:

```sql
-- Connect to Supabase SQL Editor
-- https://supabase.com/dashboard/project/gglzmggwifbkxtxjclcw/sql/new

-- Check if user exists
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'judithdavy@changesltd.com';

-- Check profile
SELECT * FROM profiles
WHERE email = 'judithdavy@changesltd.com';
```

**If User Doesn't Exist**, create it:
```sql
-- This should be done through Supabase dashboard or signup flow
-- Go to: Authentication → Users → Add user
```

**Reset Password** (if needed):
1. Go to Supabase Dashboard
2. **Authentication → Users**
3. Find user: judithdavy@changesltd.com
4. Click "..." → **Send password reset email**
5. Or set new password directly

---

### Problem 4: CORS or Network Errors

**Symptoms**:
- Console errors: "CORS policy" or "Network error"
- Can't connect to Supabase

**Solutions**:

#### Check Supabase URL Allowed
1. Go to: https://supabase.com/dashboard/project/gglzmggwifbkxtxjclcw/auth/url-configuration
2. Add your deployed URL to **Site URL** and **Redirect URLs**:
   ```
   https://your-site.netlify.app
   https://your-site.vercel.app
   ```
3. Save and redeploy

#### Check Supabase Service Status
Visit: https://status.supabase.com/

---

### Problem 5: Different Build Output

**Symptoms**:
- Local works fine
- Deployed version behaves differently

**Verify Build is Clean**:
```bash
# Clean everything
rm -rf dist node_modules/.vite

# Fresh install
npm install

# Build
npm run build

# Test locally first
npm run preview
# Open: http://localhost:4173
# Try login with: judithdavy@changesltd.com
```

---

## Quick Diagnostic Checklist

Open your published site and check (F12 console):

```javascript
// Run these in browser console

// 1. Check environment variables loaded
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has Anon Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// 2. Check Supabase client
console.log('Supabase configured:', window.supabase ? 'Yes' : 'No');

// 3. Check CSS loaded
console.log('Stylesheets:', document.styleSheets.length);

// 4. Check for errors
// Look at Console tab for red errors
```

**Expected Output**:
```
Supabase URL: https://gglzmggwifbkxtxjclcw.supabase.co
Has Anon Key: true
Supabase configured: Yes
Stylesheets: 1 or more
```

**If you see**:
```
Supabase URL: undefined
Has Anon Key: false
```
→ **Environment variables not set!** Follow Problem 1 solution.

---

## Testing After Fixes

### Test Login:
1. Go to your deployed site
2. Open DevTools (F12)
3. Try login with: `judithdavy@changesltd.com`
4. Watch Console for errors
5. Should redirect to `/dashboard` on success

### Test Styling:
1. Compare local vs deployed side-by-side
2. Check header, buttons, colors match
3. Verify logo appears
4. Check responsive design works

---

## Common Deployment Platforms Setup

### Netlify (Recommended)

**Deploy Command**:
```bash
npm run build
```

**Publish Directory**:
```
dist
```

**Environment Variables**:
```
VITE_SUPABASE_URL=https://gglzmggwifbkxtxjclcw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Build Settings** (already in `netlify.toml`):
- Redirects configured
- Headers configured
- Cache optimized

### Vercel

**Deploy Command**: Auto-detected (vite)

**Output Directory**: `dist`

**Environment Variables**: Same as Netlify

**Framework Preset**: Vite

### AWS Amplify

**Build Settings**:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

**Environment Variables**: Same as above

---

## Get Deployment URL

### Netlify:
- Domain shows in dashboard
- Format: `https://your-site.netlify.app`

### Vercel:
- Shows after deployment
- Format: `https://your-site.vercel.app`

### AWS:
- CloudFront or Amplify URL
- Can add custom domain

---

## Emergency Recovery

If nothing works:

1. **Download fresh copy**:
   - Get source code from this project
   - Get `.env` file with correct values

2. **Create new deployment**:
   ```bash
   # Install dependencies
   npm install

   # Verify .env exists with correct values
   cat .env

   # Build
   npm run build

   # Test locally
   npm run preview

   # If works, deploy to new site
   ```

3. **Contact Supabase Support** if database issues:
   - https://supabase.com/dashboard/support

---

## Working Test Credentials

**Email**: judithdavy@changesltd.com
**Role**: Admin
**Access**: Full system access

These should work on both local and deployed versions once environment variables are set correctly.

---

## Support Files

- `netlify.toml` - Netlify configuration
- `vercel.json` - Vercel configuration
- `.env` - Environment variables (local only)
- `.env.example` - Template for environment variables

---

## Final Checklist

Before marking as "deployed and working":

- [ ] Environment variables set in deployment platform
- [ ] Redeployed with clear cache
- [ ] CSS loads correctly (inspect DevTools)
- [ ] Can login with test account
- [ ] No console errors
- [ ] Site URL added to Supabase allowed URLs
- [ ] Mobile responsive works
- [ ] All routes work (no 404s)

---

**Most Common Issue**: Environment variables not set in deployment platform!

**Quick Fix**: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your deployment platform's environment variables, then redeploy with cache cleared.
