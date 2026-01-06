# Zero Scores Issue - Diagnosis and Fix

## Problem Statement
Simulation completion is showing scores of 0 for all assessment categories (BRAVIN, competencies, metrics).

## Root Cause Identified ✅

**The database is empty - no migrations have been applied to Supabase.**

### Diagnostic Results:
- ❌ Simulations table: 0 records
- ❌ Scenarios table: 0 records
- ❌ Assessment metrics: 0 records
- ❌ Competencies: 0 records

This explains why scores are 0 - there's literally no data or configuration in the database for the application to work with.

## Solution

### Step 1: Apply Database Migrations

You need to apply the SQL migrations to your Supabase database. There are two ways to do this:

#### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI if you haven't:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Apply all migrations:
   ```bash
   supabase db push
   ```

#### Option B: Manual Application via Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to: **SQL Editor**
3. Apply the migrations in chronological order (oldest first)
4. Start with the foundational migrations:
   - `20250605003318_pink_field.sql` (creates base schema)
   - `20251022141416_create_lti_moodle_simulation_schema.sql` (core simulation tables)
   - Continue through all migrations in order

**CRITICAL**: The most important migration for getting started is:
- `supabase/migrations/20251103140000_create_leadership_challenges_beginner_simulation.sql`

This migration creates a complete, working simulation with:
- 13 interconnected scenarios
- 65 response options with full configurations
- All metric scores configured (BRAVIN, Trust, EI, Ethics)
- 5 competencies with proper weightings
- Complete feedback at all difficulty levels
- Branching logic for multiple learning paths

### Step 2: Verify Migrations Were Applied

After applying migrations, run this verification script:

```bash
node check-simulation-status.mjs
```

Expected output:
```
Simulations in database: 1 (or more)
Simulation Details:
1. Leadership Challenges - Beginner Level
   Status: published
   Scenarios linked: 13

Assessment Metrics in system: 4
Competencies in system: 5
```

### Step 3: Run Comprehensive Diagnostics

Once migrations are applied, run the full diagnostic:

```bash
node diagnose-zero-scores.mjs
```

This will check:
- ✅ Simulation configuration
- ✅ Scenario options have metric scores
- ✅ BRAVIN mappings are configured
- ✅ Assessment metrics are defined
- ✅ Competency calculations are working

## Why This Happened

When you set up a Supabase project, it creates the database structure but doesn't automatically apply your custom migrations. You need to explicitly push your migration files to the database.

## What the Migrations Create

The migration files in `supabase/migrations/` define:

1. **Core Schema** (Table structure)
   - Users, profiles, authentication
   - Simulations and scenarios
   - Options and branching logic
   - Assessment metrics and competencies

2. **Data Seeding** (Sample content)
   - Pre-configured simulations
   - Scenario content with questions
   - Response options with feedback
   - Metric score mappings
   - BRAVIN impact configurations

3. **Security** (RLS policies)
   - Row-level security rules
   - Access control for different user roles
   - Data isolation between users

4. **Functions** (Database logic)
   - Score calculation procedures
   - Competency assessment functions
   - Analytics and reporting queries

## After Migrations Are Applied

Once your migrations are applied successfully:

1. **Login/Create Users**
   - You can create user accounts
   - Admin users can access the admin dashboard

2. **Start Simulations**
   - Navigate to the simulation browser
   - Select "Leadership Challenges - Beginner Level"
   - Complete the simulation

3. **View Results**
   - After completion, you'll see:
     - ✅ BRAVIN dimension scores (0-100 scale)
     - ✅ Individual metric assessments
     - ✅ Competency proficiency levels
     - ✅ Trust building summary
     - ✅ Performance analysis

## Troubleshooting

### If scores are still 0 after applying migrations:

1. **Check browser console for errors**
   ```
   Open DevTools > Console tab
   Look for red error messages during simulation
   ```

2. **Verify metric scores exist**
   ```bash
   node diagnose-zero-scores.mjs
   ```
   Look for "⚠️ WARNING: No metric scores configured"

3. **Check Supabase logs**
   - Dashboard > Logs > Database
   - Look for failed function calls or errors

4. **Verify RLS policies**
   - Dashboard > Authentication > Policies
   - Ensure policies allow reading assessment data

### Common Issues:

**Issue**: "No simulations found"
- **Fix**: Apply the migrations as described above

**Issue**: "BRAVIN Assessment Not Available"
- **Fix**: Scenarios need BRAVIN mappings configured (done by migrations)

**Issue**: "No metric scores configured"
- **Fix**: The `20251103140000` migration adds all metric scores

**Issue**: Scores showing but calculations seem wrong
- **Fix**: Check competency weight configurations in database

## Quick Test After Fix

To verify everything is working:

1. Apply all migrations
2. Run: `node check-simulation-status.mjs`
3. Start the dev server: `npm run dev`
4. Create a test user account
5. Navigate to "Leadership Challenges - Beginner Level"
6. Complete Challenge 1 (the first scenario)
7. Check that you can proceed to Challenge 2
8. Complete the full simulation
9. View Results page - should show:
   - Non-zero BRAVIN scores
   - Metric assessments
   - Competency calculations

## Need Help?

If after applying migrations you still see issues:

1. Check the Supabase Dashboard > Table Editor
   - Verify tables exist and have data
   - Look at `simulations` table - should have at least 1 row
   - Look at `scenario_option_metrics` - should have many rows

2. Run the diagnostic script and share output:
   ```bash
   node diagnose-zero-scores.mjs > diagnosis.txt
   ```

3. Check for any migration errors in Supabase logs

## Summary

**Root Cause**: Database migrations were not applied to Supabase, resulting in empty tables and no configuration data.

**Solution**: Apply all migrations from `supabase/migrations/` folder to your Supabase database using either:
- Supabase CLI: `supabase db push`
- Manual application via SQL Editor in Supabase Dashboard

**Verification**: Run `node check-simulation-status.mjs` to confirm data exists.

**Result**: Once migrations are applied, simulations will have proper configurations, metric scores will be calculated, and results pages will display meaningful data instead of zeros.
