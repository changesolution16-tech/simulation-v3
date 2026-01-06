# Complete Migration Guide: Soft Skills Training Simulation Platform

## Package Contents

This migration package contains everything needed to deploy the Soft Skills Training Simulation platform on a new server.

### Directory Structure
```
migration-package/
├── source-code/              # Complete application source code
├── database/                 # Database schema and migrations
├── documentation/            # Setup and configuration guides
├── deployment-configs/       # Server configuration files
└── MIGRATION_INSTRUCTIONS.md # This file
```

## Prerequisites

### Required Software
- **Node.js**: v18.x or v20.x (LTS versions)
- **npm**: v9.x or higher (comes with Node.js)
- **Git**: v2.x or higher
- **PostgreSQL**: v15.x or higher (via Supabase)

### Required Accounts
1. **Supabase Account** (free tier available)
   - Sign up at: https://supabase.com
   - Create a new project
   - Note down your credentials

2. **Server/Hosting** (choose one):
   - Netlify (recommended for quick deployment)
   - Vercel
   - AWS/DigitalOcean/Linode (for custom setup)
   - Your own VPS

## Step-by-Step Migration Process

### Phase 1: Database Setup (30-45 minutes)

1. **Create Supabase Project**
   ```
   - Go to https://app.supabase.com
   - Click "New Project"
   - Choose organization
   - Set project name: "soft-skills-training"
   - Set database password (save this securely!)
   - Choose region (closest to your users)
   - Wait for project to initialize (~2 minutes)
   ```

2. **Get Database Credentials**
   ```
   - Go to Project Settings → API
   - Copy "Project URL" (starts with https://xxx.supabase.co)
   - Copy "anon public" key
   - Save these for later
   ```

3. **Apply Database Migrations**
   ```bash
   # Option A: Using Supabase CLI (recommended)
   cd migration-package/database
   supabase db push
   
   # Option B: Manual SQL execution
   # - Go to Supabase SQL Editor
   # - Copy content from migration-package/database/schema.sql
   # - Click "Run"
   # - Verify: should show "Success" message
   ```

4. **Verify Database Structure**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   
   -- Expected tables (23 total):
   -- assignments, assessments, bravin_alignments, bravin_metrics,
   -- cohorts, competencies, feedback, simulation_instances, etc.
   ```

5. **Create Admin User**
   ```
   - Go to Authentication → Users
   - Click "Add User"
   - Email: your-admin@yourdomain.com
   - Password: (secure password)
   - Auto-confirm: Enable
   - Role: Keep as authenticated
   ```

6. **Set Admin Permissions**
   ```sql
   -- Run in SQL Editor (replace with your email)
   UPDATE user_profiles 
   SET role = 'admin' 
   WHERE email = 'your-admin@yourdomain.com';
   ```

### Phase 2: Application Setup (20-30 minutes)

1. **Extract Source Code**
   ```bash
   # Copy source-code folder to your deployment location
   cd /path/to/your/deployment/folder
   cp -r migration-package/source-code/* .
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # This will install ~200 packages, takes 2-3 minutes
   ```

3. **Configure Environment Variables**
   ```bash
   # Create .env file
   nano .env
   
   # Add these variables (replace with your values):
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Test Local Development**
   ```bash
   npm run dev
   # Should open on http://localhost:5173
   # Test login with admin credentials
   ```

### Phase 3: Production Build (10-15 minutes)

1. **Build Production Files**
   ```bash
   npm run build
   # Creates optimized files in dist/ folder
   # Build size: ~2.4 MB (51 files)
   ```

2. **Test Production Build Locally**
   ```bash
   npm run preview
   # Opens on http://localhost:4173
   # Verify all features work
   ```

### Phase 4: Deployment (varies by platform)

#### Option A: Netlify Deployment (Easiest - 10 minutes)

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   # Opens browser for authentication
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   # Follow prompts:
   # - Site name: soft-skills-training
   # - Publish directory: dist
   ```

4. **Configure Environment Variables**
   ```
   - Go to Netlify Dashboard
   - Site Settings → Environment Variables
   - Add:
     VITE_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY
   - Redeploy
   ```

#### Option B: Vercel Deployment (10 minutes)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   # Follow prompts
   ```

3. **Configure Environment Variables**
   ```
   - Go to Vercel Dashboard
   - Project Settings → Environment Variables
   - Add variables
   - Redeploy
   ```

#### Option C: Custom VPS Deployment (30-60 minutes)

1. **Server Requirements**
   ```
   - Ubuntu 22.04 LTS or similar
   - 2GB RAM minimum (4GB recommended)
   - 20GB disk space
   - Nginx or Apache
   - SSL certificate (Let's Encrypt)
   ```

2. **Upload Files**
   ```bash
   # From local machine
   scp -r dist/* user@your-server:/var/www/soft-skills-training/
   ```

3. **Configure Web Server**
   ```nginx
   # Nginx configuration
   server {
       listen 80;
       server_name your-domain.com;
       
       root /var/www/soft-skills-training;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. **Setup SSL**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

### Phase 5: Post-Deployment Configuration (15-20 minutes)

1. **Configure Supabase Auth**
   ```
   - Supabase Dashboard → Authentication → URL Configuration
   - Site URL: https://your-deployed-domain.com
   - Redirect URLs: https://your-deployed-domain.com/**
   ```

2. **Test Authentication**
   ```
   - Visit your deployed site
   - Try logging in with admin account
   - Verify dashboard loads
   ```

3. **Create Test Simulation**
   ```
   - Login as admin
   - Go to Simulations → Create New
   - Add basic scenario with 2-3 stages
   - Test as learner
   ```

4. **Configure Storage (if using video uploads)**
   ```
   - Supabase Dashboard → Storage
   - Create bucket: "simulation-videos"
   - Set as public
   - Configure CORS if needed
   ```

## Post-Migration Checklist

- [ ] Database connected and all tables created
- [ ] Admin user created and can login
- [ ] Application builds without errors
- [ ] Production site accessible via domain/URL
- [ ] Login/logout functionality works
- [ ] Can create simulations (admin)
- [ ] Can take simulations (learner)
- [ ] Scoring system works correctly
- [ ] Video playback works (YouTube and custom)
- [ ] Results page displays correctly
- [ ] Multi-language switching works (if enabled)
- [ ] All RLS policies active (check database)

## Common Issues and Solutions

### Issue: "Invalid API Key" Error
**Solution**: 
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct
- Check for extra spaces or quotes
- Rebuild application after changing .env

### Issue: "Row Level Security Policy Violation"
**Solution**:
```sql
-- Run this to check policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- If missing, re-run migration files
```

### Issue: Login Works But Dashboard Empty
**Solution**:
- Check browser console for errors
- Verify user has correct role in user_profiles table
- Check RLS policies allow read access

### Issue: Videos Not Playing
**Solution**:
- For YouTube: Verify URL format (youtube.com/watch?v=xxx)
- For custom videos: Check storage bucket permissions
- Check browser console for CORS errors

### Issue: Simulations Not Saving Scores
**Solution**:
```sql
-- Verify assessment tables
SELECT COUNT(*) FROM assessments;
SELECT COUNT(*) FROM assessment_metrics;

-- Check if inserts are being blocked
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%assessment%' 
ORDER BY calls DESC;
```

## Performance Optimization

### After Successful Migration

1. **Enable Database Indexes** (already in migrations)
2. **Setup CDN** (Netlify/Vercel handle this automatically)
3. **Enable Compression** (check server config)
4. **Monitor Performance**:
   - Supabase Dashboard → Database → Query Performance
   - Set up alerts for slow queries

## Security Hardening

### Immediate Steps After Deployment

1. **Review RLS Policies**
   ```sql
   -- Verify all tables have policies
   SELECT tablename 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename NOT IN (
       SELECT DISTINCT tablename FROM pg_policies
   );
   ```

2. **Enable Rate Limiting** (Supabase)
   - Already configured in migrations
   - Verify in Supabase dashboard

3. **Setup Backup Schedule**
   - Supabase does automatic backups (paid plans)
   - For free tier: export data weekly

4. **Monitor Auth Attempts**
   - Supabase Dashboard → Auth → Logs
   - Set up notifications for suspicious activity

## Maintenance Tasks

### Daily
- Check error logs
- Monitor user activity

### Weekly
- Review database performance
- Check storage usage
- Update dependencies if needed

### Monthly
- Backup database manually
- Review and update documentation
- Check for Supabase/npm package updates

## Support and Documentation

### Included Documentation Files
- `USER_GUIDE.md` - End user instructions
- `ADMIN_GUIDE.md` - Admin panel walkthrough
- `DEVELOPER_GUIDE.md` - Code structure and customization
- `API_REFERENCE.md` - Database schema and API endpoints
- `TROUBLESHOOTING.md` - Common problems and solutions

### Technical Support
- For Supabase issues: https://supabase.com/docs
- For React/Vite issues: Check respective documentation
- Application-specific: Refer to included documentation

## Rollback Procedure

If migration fails and you need to rollback:

1. **Database Rollback**
   ```sql
   -- Export current data first
   -- Then drop all tables
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```

2. **Restore Previous State**
   - If you have a backup, restore from it
   - Otherwise, start fresh with new Supabase project

3. **Application Rollback**
   - Simply remove deployed files
   - Redeploy previous version if available

## Success Metrics

After migration is complete, verify these metrics:

- **Page Load Time**: < 2 seconds (first load)
- **API Response Time**: < 200ms (database queries)
- **Login Success Rate**: > 99%
- **Simulation Completion Rate**: Track in admin dashboard
- **Error Rate**: < 1% of total requests

## Next Steps After Migration

1. **User Training**: Schedule sessions for administrators and teachers
2. **Content Creation**: Begin creating real simulations
3. **User Onboarding**: Add learners to the system
4. **Monitoring Setup**: Configure alerts and dashboards
5. **Backup Verification**: Test restore procedures

## Estimated Total Migration Time

- **Simple Setup** (Netlify + Supabase): 2-3 hours
- **Custom VPS Setup**: 4-6 hours
- **With Content Migration**: Add 2-4 hours
- **With Customization**: Add 4-8 hours

## Contact and Support

For migration assistance, refer to:
- Technical documentation in `/documentation` folder
- Database schema in `/database/schema.sql`
- Configuration examples in `/deployment-configs`

---

**Document Version**: 1.0  
**Last Updated**: November 2024  
**Application Version**: 0.1.0  
**Compatible With**: Supabase v2.x, Node.js v18-20
