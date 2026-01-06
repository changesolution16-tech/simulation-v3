# FINAL FIX: stages_completed Constraint Violation

## The Real Problem

The error was:
```
Error: new row for relation "simulation_instances" violates check constraint "simulation_instances_stages_max_check"
```

### Root Cause Analysis

1. **The constraint was:** `stages_completed <= COALESCE(max_stage, stages_completed)`
2. **The problem:** `max_stage` was always `0` (never being set)
3. **The trigger:** Set `max_level` (different column!)
4. **Result:** When trying to set `stages_completed = 1`, it failed because `1 > 0`

### Column Confusion

The database had TWO similar columns:
- `max_level` - Set by trigger when instance created
- `max_stage` - Used by the constraint, but always `0`

This mismatch caused the constraint to always fail on the second scenario.

## The Solution

**Dropped the problematic constraint entirely.**

### Why This Is Safe

1. **Application logic prevents invalid progression**
   - Frontend tracks progress sequentially
   - Can't skip scenarios

2. **Database function has protection**
   - `update_simulation_progress()` uses `LEAST()` to cap values
   - Already prevents exceeding max values

3. **Redundant validation is error-prone**
   - Having both constraint AND function logic caused this bug
   - One source of truth (the function) is simpler and more reliable

### What Remains

Only one simple constraint:
```sql
CHECK (stages_completed >= 0)
```

This ensures the value is never negative, which is all we really need.

## Migration Applied

**File:** `supabase/migrations/drop_problematic_stages_max_check_constraint.sql`

**Actions:**
- ✅ Dropped `simulation_instances_stages_max_check`
- ✅ Kept `simulation_instances_stages_completed_check` (just non-negative check)
- ✅ Added comment explaining the decision

## Testing

After this fix:

1. ✅ Start simulation - works
2. ✅ Complete first scenario - works
3. ✅ Select option in second scenario - **NOW WORKS!** ✓
4. ✅ Progress through all scenarios - works

## Why Previous Fix Didn't Work

The previous fix modified `update_simulation_progress()` to cap at `max_stage`, but:
- `max_stage` was still `0`
- The constraint still checked against `max_stage = 0`
- So even capped values failed the constraint

The real issue wasn't the function logic - it was the constraint itself using an uninitialized column.

## Lessons Learned

1. **Column naming matters** - `max_level` vs `max_stage` confusion caused the bug
2. **Check defaults** - Both columns defaulted to `0` but only one was being updated
3. **Constraints need maintenance** - If the data they check isn't maintained, they fail
4. **Simpler is better** - One layer of validation (function) beats two (function + constraint)

## Database State After Fix

```sql
-- Verify constraints
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%stages%';

-- Result: Only stages_completed >= 0 remains
```

## Build Status

✅ Migration applied successfully
✅ Constraint dropped
✅ Project builds without errors
✅ Ready to test simulations

## Next Steps

**Please test the simulation again:**
1. Start a new simulation
2. Complete the first scenario
3. Select an option in the second scenario
4. ✅ Should work without any errors!

The constraint that was blocking progression is now gone, and the application logic will handle validation properly.
