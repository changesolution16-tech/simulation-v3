# Troubleshooting Guide

Common issues and their solutions for the Soft Skills Training Simulation platform.

## Database Issues

### Error: "relation does not exist"

**Cause**: Database tables not created  
**Solution**:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- If empty, re-run complete-schema.sql
```

### Error: "row-level security policy violation"

**Cause**: RLS policies not applied or user lacks permissions  
**Solution**:
```sql
-- Check policies exist
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';

-- Check user role
SELECT email, role FROM user_profiles WHERE email = 'your@email.com';

-- Fix role if needed
UPDATE user_profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### Error: "duplicate key value violates unique constraint"

**Cause**: Trying to insert data that already exists  
**Solution**:
```sql
-- Find duplicate
SELECT id, email FROM users GROUP BY id, email HAVING COUNT(*) > 1;

-- Delete duplicate (keep most recent)
DELETE FROM users WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
        FROM users
    ) t WHERE t.rn > 1
);
```

## Authentication Issues

### Login Returns "Invalid login credentials"

**Checks**:
```
1. Verify email is confirmed in Supabase Auth
2. Check password is correct
3. Verify user exists:
   SELECT * FROM auth.users WHERE email = 'your@email.com';
```

**Solution**:
```sql
-- Reset user password in Supabase
-- Go to Authentication → Users → [user] → Reset Password
```

### Login Succeeds But Dashboard is Blank

**Cause**: User profile not created or role not set  
**Solution**:
```sql
-- Check if profile exists
SELECT * FROM user_profiles WHERE email = 'your@email.com';

-- Create if missing
INSERT INTO user_profiles (id, email, role, full_name)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'your@email.com'),
    'your@email.com',
    'admin',
    'Your Name'
);
```

### Session Expires Too Quickly

**Solution**:
```javascript
// In supabase client config (already set in code)
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

## Application Issues

### Build Fails with "Module not found"

**Cause**: Dependencies not installed  
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### "CORS Error" in Browser Console

**Cause**: Supabase URL not configured correctly  
**Solution**:
```
1. Check .env file has correct VITE_SUPABASE_URL
2. Verify URL has no trailing slash
3. Rebuild application
```

### Videos Not Playing

**For YouTube Videos**:
```
- URL format must be: https://www.youtube.com/watch?v=VIDEO_ID
- Not: https://youtu.be/VIDEO_ID
- Check video is public, not private
```

**For Custom Videos**:
```
1. Go to Supabase Storage
2. Check bucket exists: "simulation-videos"
3. Verify bucket is public
4. Test URL directly in browser
```

### Simulations Not Showing for Learners

**Checks**:
```sql
-- Verify simulation is published
SELECT id, title, published FROM simulations;

-- Update if needed
UPDATE simulations SET published = true WHERE id = 'simulation-id';

-- Check RLS policies allow read
SELECT * FROM pg_policies WHERE tablename = 'simulations';
```

## Scoring Issues

### Scores Always Show 0%

**Cause**: Competency weights not configured  
**Solution**:
```sql
-- Check competencies exist
SELECT * FROM competencies WHERE simulation_id = 'your-simulation-id';

-- Verify weights are set
SELECT * FROM competency_weight_matrices 
WHERE competency_id IN (
    SELECT id FROM competencies WHERE simulation_id = 'your-simulation-id'
);

-- If missing, create via admin UI:
-- Simulations → Edit → Competencies → Set Weights
```

### Assessment Not Saving

**Check**:
```sql
-- Test insert permission
INSERT INTO assessments (user_id, simulation_id, score, attempt_number)
VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    (SELECT id FROM simulations LIMIT 1),
    75.0,
    1
);

-- If error, check RLS policy
```

## Deployment Issues

### Netlify Deploy Fails

**Common Causes**:
```bash
# Check build locally first
npm run build

# If success, check Netlify logs
netlify logs

# Common fix: clear cache
netlify build --clear-cache
```

### Environment Variables Not Working

**Solution**:
```
1. Variables must start with VITE_ prefix
2. Restart dev server after changes
3. For production, redeploy after changing vars
4. Check variables don't have quotes in Netlify UI
```

### Site Loads But Shows 404 on Refresh

**Cause**: Server not configured for SPA routing  
**Solution**:
```bash
# Ensure _redirects file exists in dist/
cat dist/_redirects

# Should contain:
/*    /index.html   200
```

## Performance Issues

### Slow Page Load

**Checks**:
```
1. Check network tab in browser DevTools
2. Look for slow API calls
3. Check database indexes exist:

SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

**Solutions**:
```sql
-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_assessments_user 
ON assessments(user_id);

CREATE INDEX IF NOT EXISTS idx_simulation_instances_user 
ON simulation_instances(user_id);
```

### Database Queries Timing Out

**Solution**:
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Add indexes as needed
-- Enable query plan:
EXPLAIN ANALYZE SELECT * FROM assessments WHERE user_id = 'xxx';
```

## Data Migration Issues

### Import Fails with Duplicate IDs

**Solution**:
```sql
-- Generate new UUIDs on import
INSERT INTO simulations (id, title, description, ...)
VALUES (gen_random_uuid(), 'Title', 'Desc', ...)
ON CONFLICT (id) DO NOTHING;
```

### Foreign Key Constraint Violations

**Solution**:
```sql
-- Disable triggers temporarily
ALTER TABLE simulation_stages DISABLE TRIGGER ALL;

-- Import data
-- [run your imports]

-- Re-enable triggers
ALTER TABLE simulation_stages ENABLE TRIGGER ALL;

-- Verify data integrity
SELECT * FROM simulation_stages 
WHERE simulation_id NOT IN (SELECT id FROM simulations);
```

## Security Issues

### Password Reset Not Working

**Check**:
```
1. Supabase → Auth → Email Templates
2. Verify SMTP configured
3. Check spam folder
4. Verify redirect URL in Supabase settings
```

### Unauthorized Access to Admin Panel

**Immediate Fix**:
```sql
-- Verify all admin-only tables have policies
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT IN (SELECT tablename FROM pg_policies);

-- Example admin-only policy:
CREATE POLICY "Admin only access" ON simulations
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);
```

## Still Having Issues?

### Diagnostic Steps

1. **Check Browser Console** (F12 → Console)
   - Look for red errors
   - Note exact error messages

2. **Check Network Tab** (F12 → Network)
   - Filter by "Fetch/XHR"
   - Look for 400/500 errors
   - Check request/response details

3. **Check Supabase Logs**
   - Go to Supabase Dashboard
   - Logs & Reports → API Logs
   - Filter by error level

4. **Test Database Connection**
   ```bash
   # Run diagnostic script
   node check-database-connection.mjs
   ```

5. **Verify Environment**
   ```bash
   # Check Node version
   node --version  # Should be v18 or v20
   
   # Check installed packages
   npm list --depth=0
   
   # Verify build
   npm run build -- --debug
   ```

### Getting Help

If the issue persists:

1. **Document the Issue**:
   - Exact error message
   - Steps to reproduce
   - Screenshots if applicable
   - Browser/OS information

2. **Check Logs**:
   - Browser console logs
   - Supabase API logs
   - Server logs (if self-hosted)

3. **Review Documentation**:
   - MIGRATION_INSTRUCTIONS.md
   - QUICK_START.md
   - README files in code

4. **Common Resources**:
   - Supabase Docs: https://supabase.com/docs
   - Vite Docs: https://vitejs.dev
   - React Docs: https://react.dev

---

**Last Updated**: November 2024  
**Version**: 1.0
