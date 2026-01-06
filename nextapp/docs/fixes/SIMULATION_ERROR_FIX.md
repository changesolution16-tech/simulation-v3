# Simulation Response Save Error - Complete Fix

## Problem
When selecting an option in a simulation, you see:
- "Warning: Your response may not have been saved. Please check your internet connection."
- Then redirected to login screen

## Root Causes Found

### 1. ✅ **FIXED**: learner_responses RLS Policy
- Policy was checking for `attempt_id` but code uses `instance_id`
- **Status:** Fixed in migration `fix_learner_responses_rls_policy`

### 2. ✅ **FIXED**: Column Name Mismatch
- Code uses `stages_completed` but table had only `levels_completed`
- Code uses `max_stage` but table had only `max_level`
- Code uses `last_activity_at` but column didn't exist
- **Status:** Fixed in migration `fix_column_name_mismatch_and_auth_session`

### 3. ⚠️  **NEEDS TESTING**: Auth Session State
- Even with RLS policies fixed, browser may have:
  - Cached auth session that's invalid
  - Expired JWT token
  - Stale simulation session state

## Immediate Actions Required

### Step 1: Clear Browser State
**You MUST do this to test the fixes:**

1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Clear ALL of these:
   - **Local Storage** - Delete all entries
   - **Session Storage** - Delete all entries
   - **Cookies** - Delete Supabase auth cookies
4. **Close and reopen** the browser completely
5. Navigate to the login page and log in fresh

### Step 2: Test the Simulation Again

1. Log in with your credentials
2. Start a simulation
3. **Open DevTools Console** (F12 → Console tab)
4. Get to the first question
5. Select an option

### Step 3: Check Console Messages

You should see these SUCCESS messages:
```
[QuestionPage] ✓ Saved learner response with decision time: X seconds
[QuestionPage] ✓ Updated simulation progress to stage: X
[QuestionPage] ✓ Recorded metric assessments
[QuestionPage] ✓ Recorded Bravin metrics
[QuestionPage] ✓ Saved complete session state to database
```

### Step 4: If Still Failing

If you still see the error, check the console for the ACTUAL error:

Look for lines starting with:
- `[QuestionPage] CRITICAL: Failed to save learner response:`
- `[QuestionPage] CRITICAL ERROR saving decision:`

Copy the entire error message including:
- Error code
- Error message
- Error details
- Error hint

## What We Fixed

### Migration 1: RLS Policy for learner_responses
```sql
CREATE POLICY "Learners can create responses via instance"
  ON learner_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM simulation_instances si
      WHERE si.id = instance_id
      AND si.learner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM learner_attempts la
      WHERE la.id = attempt_id
      AND la.learner_id = auth.uid()
    )
  );
```

### Migration 2: Added Missing Columns
```sql
-- Added stages_completed (was only levels_completed)
ALTER TABLE simulation_instances ADD COLUMN stages_completed integer DEFAULT 0;

-- Added last_activity_at (didn't exist)
ALTER TABLE simulation_instances ADD COLUMN last_activity_at timestamptz DEFAULT now();

-- Added max_stage (was only max_level)
ALTER TABLE simulation_instances ADD COLUMN max_stage integer DEFAULT 0;

-- Added current_scenario_id for resume functionality
ALTER TABLE simulation_instances ADD COLUMN current_scenario_id uuid;
```

### Migration 3: Fixed record_metric_assessment Function
```sql
CREATE OR REPLACE FUNCTION record_metric_assessment(...)
RETURNS void AS $$
BEGIN
  -- Bypass RLS for this trusted function
  SET LOCAL row_security = off;

  -- Insert metric assessments...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Why You're Seeing This Error

The INSERT is failing because of one of these reasons:

1. **Cached auth state** - Browser has old/invalid session
2. **Expired JWT** - Token expired during simulation
3. **RLS policy not applied** - Migrations didn't apply (check with SQL query below)
4. **Network issue** - Actual connection problem

## Verification Queries

Run these in Supabase SQL Editor to verify fixes:

### Check RLS Policies
```sql
-- Verify learner_responses policy
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'learner_responses'
AND cmd = 'INSERT';
```

Should show: `"Learners can create responses via instance"`

### Check Columns Exist
```sql
-- Verify simulation_instances columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'simulation_instances'
AND column_name IN ('stages_completed', 'last_activity_at', 'max_stage', 'current_scenario_id');
```

Should return all 4 columns.

### Test Auth State
```sql
-- Check if you can see your own simulation instances
SELECT id, learner_id, status, created_at
FROM simulation_instances
WHERE learner_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;
```

If this returns rows, auth is working.

## Common Issues & Solutions

### Issue: "Invalid JWT" or "JWT expired"
**Solution:** Clear browser storage and log in again

### Issue: "Row level security policy violation"
**Solution:** Migrations weren't applied - verify policies exist

### Issue: "Column does not exist"
**Solution:** Column migration didn't run - verify columns exist

### Issue: Still redirected to login after selecting option
**Solution:** Check if `activeSession.instanceId` is null:
- Open DevTools Console
- Before selecting option, type: `window.localStorage`
- Check if simulation session data exists

## Testing Checklist

- [ ] Cleared browser Local Storage
- [ ] Cleared browser Session Storage
- [ ] Cleared browser Cookies
- [ ] Closed and reopened browser completely
- [ ] Logged in fresh
- [ ] Started a new simulation
- [ ] Opened DevTools Console (F12)
- [ ] Selected an option and checked console messages
- [ ] Saw SUCCESS messages (not errors)
- [ ] Was NOT redirected to login
- [ ] Continued to feedback/next scenario

## Next Steps If Still Broken

If after following ALL steps above it still fails:

1. **Copy the COMPLETE console error** from DevTools
2. **Take a screenshot** of the error
3. **Run this SQL query** and share results:
   ```sql
   SELECT
     (SELECT COUNT(*) FROM simulation_instances WHERE created_at > NOW() - INTERVAL '1 hour') as recent_instances,
     (SELECT COUNT(*) FROM learner_responses WHERE responded_at > NOW() - INTERVAL '1 hour') as recent_responses,
     (SELECT COUNT(*) FROM learner_metric_assessments WHERE created_at > NOW() - INTERVAL '1 hour') as recent_metrics;
   ```

4. **Check Supabase Dashboard** → Logs → Look for any error logs

## Success Indicators

You'll know it's working when:
✅ No error alert appears
✅ Console shows "✓ Saved learner response"
✅ You proceed to feedback page
✅ NOT redirected to login
✅ Database shows new records in `learner_responses`
✅ Database shows new records in `learner_metric_assessments`

---

**Status:** All database fixes applied successfully
**Action Required:** Clear browser state and test again
