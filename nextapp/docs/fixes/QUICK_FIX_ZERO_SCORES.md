# Quick Fix: Zero Scores Issue

## Problem
Simulation complete scores showing as 0.

## Root Cause
Database migrations not applied to Supabase - the database is empty.

## Solution (5 minutes)

### Method 1: Supabase CLI (Fastest)

```bash
# Install CLI (if needed)
npm install -g supabase

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations
supabase db push
```

### Method 2: Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Click **SQL Editor**
3. Copy and paste this critical migration:
   - File: `supabase/migrations/20251103140000_create_leadership_challenges_beginner_simulation.sql`
4. Click **Run**

This creates a complete working simulation with all scores configured.

### Verify It Worked

```bash
node check-simulation-status.mjs
```

Expected: "Simulations in database: 1 (or more)"

## What This Fixes

- ✅ Creates simulation with 13 scenarios
- ✅ Adds 65 response options with metric scores
- ✅ Configures BRAVIN mappings (0-10 scale)
- ✅ Sets up 4 assessment metrics
- ✅ Defines 5 competencies with weights
- ✅ Enables full score calculations

## Test It

1. Start app: `npm run dev`
2. Create/login as user
3. Select "Leadership Challenges - Beginner Level"
4. Complete simulation
5. View Results - scores should be non-zero!

## Still Having Issues?

Run full diagnostic:
```bash
node diagnose-zero-scores.mjs
```

See `ZERO_SCORES_DIAGNOSIS_AND_FIX.md` for detailed troubleshooting.
