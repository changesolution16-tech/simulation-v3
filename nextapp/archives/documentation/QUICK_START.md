# Quick Start Guide - 30 Minutes to Deployment

This guide will get your Soft Skills Training Simulation platform running in 30 minutes.

## Prerequisites Check (5 minutes)

Before starting, ensure you have:
- [ ] Node.js v18 or v20 installed (`node --version`)
- [ ] npm v9+ installed (`npm --version`)
- [ ] A Supabase account (sign up at supabase.com)
- [ ] A text editor (VS Code, Sublime, etc.)

## Step 1: Setup Supabase (10 minutes)

### 1.1 Create Project
```
1. Go to https://app.supabase.com
2. Click "New Project"
3. Name: "soft-skills-training"
4. Password: [Create strong password]
5. Region: [Choose closest to users]
6. Click "Create new project"
7. Wait 2 minutes for initialization
```

### 1.2 Get Credentials
```
1. Go to Project Settings (gear icon)
2. Click "API" in left sidebar
3. Copy "Project URL" → Save to notepad
4. Copy "anon public" key → Save to notepad
```

### 1.3 Apply Database Schema
```
1. Go to SQL Editor (left sidebar)
2. Click "New Query"
3. Open: migration-package/database/complete-schema.sql
4. Copy entire contents
5. Paste into SQL Editor
6. Click "Run" (or press Ctrl+Enter)
7. Wait 30-60 seconds
8. Should see "Success. No rows returned"
```

### 1.4 Create Admin User
```
1. Go to Authentication → Users
2. Click "Add User" → "Create New User"
3. Email: your@email.com
4. Password: [secure password]
5. Toggle "Auto Confirm Email" ON
6. Click "Create User"
```

### 1.5 Set Admin Role
```
1. Go back to SQL Editor
2. Run this (replace with your email):

UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'your@email.com';

3. Should see "Success. Updated 1 row(s)"
```

## Step 2: Setup Application (10 minutes)

### 2.1 Extract Source Code
```bash
# Extract the source code archive
tar -xzf migration-package/source-code.tar.gz -C ~/my-deployment
cd ~/my-deployment
```

### 2.2 Install Dependencies
```bash
npm install
# Takes 2-3 minutes, installs ~200 packages
```

### 2.3 Configure Environment
```bash
# Create .env file
nano .env

# Add these lines (use your Supabase values):
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Save: Ctrl+O, Enter, Ctrl+X
```

### 2.4 Test Locally
```bash
npm run dev
```

Should see:
```
VITE v5.4.19  ready in 208 ms
➜  Local:   http://localhost:5173/
```

Open browser to http://localhost:5173 and test login!

## Step 3: Deploy to Netlify (10 minutes)

### 3.1 Build Production Version
```bash
npm run build
# Creates dist/ folder with optimized files
```

### 3.2 Deploy via Netlify CLI
```bash
# Install Netlify CLI (one time only)
npm install -g netlify-cli

# Login to Netlify
netlify login
# Opens browser, click "Authorize"

# Deploy
netlify deploy --prod

# When prompted:
# - Create & configure a new site
# - Team: [Select your team]
# - Site name: soft-skills-training (or custom)
# - Publish directory: dist
```

### 3.3 Configure Environment Variables
```
1. Go to https://app.netlify.com
2. Select your site
3. Go to Site Settings → Environment Variables
4. Click "Add a variable"
5. Add VITE_SUPABASE_URL with your URL
6. Add VITE_SUPABASE_ANON_KEY with your key
7. Click "Save"
```

### 3.4 Redeploy with Variables
```bash
netlify deploy --prod
```

### 3.5 Configure Supabase Redirect
```
1. Go to Supabase Dashboard
2. Authentication → URL Configuration
3. Site URL: https://your-site.netlify.app
4. Add Redirect URL: https://your-site.netlify.app/**
5. Save
```

## Step 4: Test Everything (5 minutes)

### 4.1 Test Login
```
1. Go to your Netlify URL
2. Login with admin credentials
3. Should see admin dashboard
```

### 4.2 Create Test Simulation
```
1. Click "Simulations" in admin panel
2. Click "Create New Simulation"
3. Fill in:
   - Title: "Test Scenario"
   - Description: "Testing the system"
   - Difficulty: Beginner
4. Click "Save & Continue"
5. Add 2-3 stages with questions
6. Save
```

### 4.3 Test as Learner
```
1. Create a learner account (or use different browser)
2. Login as learner
3. Start the test simulation
4. Answer questions
5. View results
```

## Success Checklist

After following this guide, you should have:

- [ ] Supabase project with all tables created
- [ ] Admin user created and can login
- [ ] Application running locally on localhost:5173
- [ ] Application deployed to Netlify
- [ ] Can create simulations as admin
- [ ] Can take simulations as learner
- [ ] Scoring system working
- [ ] Results displaying correctly

## Troubleshooting

### "Invalid API Key" Error
- Check .env file has correct values
- No extra spaces or quotes
- Rebuild: `npm run build`
- Redeploy: `netlify deploy --prod`

### "Cannot read properties of null" Error
- Database migrations not applied
- Go back to Step 1.3
- Verify all tables exist in Supabase

### Login Works but Dashboard Empty
- Check user role in database:
  ```sql
  SELECT email, role FROM user_profiles;
  ```
- Should show role = 'admin'

### Simulation Not Saving
- Check browser console (F12)
- Verify RLS policies:
  ```sql
  SELECT * FROM pg_policies WHERE schemaname = 'public';
  ```
- Should have multiple policies listed

## Next Steps

Now that your platform is running:

1. **Customize Branding**: Edit login page, colors, logo
2. **Create Content**: Build real leadership simulations
3. **Add Users**: Invite teachers and learners
4. **Setup Cohorts**: Organize learners into groups
5. **Configure BRAVIN**: Set up leadership metrics

Refer to the full documentation in:
- `ADMIN_GUIDE.md` - How to use admin features
- `USER_GUIDE.md` - Guide for learners
- `DEVELOPER_GUIDE.md` - Customization guide

## Support

If you encounter issues:
1. Check TROUBLESHOOTING.md
2. Review error logs in browser console
3. Check Supabase logs in dashboard
4. Verify all steps were completed

---

**Estimated Time**: 30-35 minutes  
**Difficulty**: Beginner-Intermediate  
**Cost**: $0 (using free tiers)
