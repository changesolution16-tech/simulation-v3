# Fix: stages_completed Constraint Violation

## Problem

When selecting a response on the **second scenario** in a simulation, the error occurred:

```
Warning: Your response may not have been saved.
Error: new row for relation "simulation_instances" violates check constraint "simulation_instances_stages_max_check"
```

## Root Cause

The database has a constraint to ensure data integrity:

```sql
CHECK (stages_completed <= COALESCE(max_stage, stages_completed))
```

This means `stages_completed` cannot exceed `max_stage`.

### The Problem Flow:

1. User starts simulation with `max_stage = 2`
2. User completes first scenario → `stages_completed = 1` ✓
3. User selects option in second scenario
4. Function tries to set `stages_completed = 2` ✓
5. **BUT** if the logic tried to set it to `3` or higher → ❌ Constraint violation

### Why It Happened:

The `update_simulation_progress` function was using:

```sql
stages_completed = GREATEST(COALESCE(stages_completed, 0), p_current_stage)
```

This would set `stages_completed` to whatever value was passed in `p_current_stage`, without checking if it exceeds `max_stage`.

## Solution

Updated the `update_simulation_progress` function to **cap the value at max_stage**:

```sql
stages_completed = GREATEST(
  COALESCE(stages_completed, 0),
  LEAST(p_current_stage, COALESCE(v_max_stage, p_current_stage))
)
```

### How It Works:

1. `LEAST(p_current_stage, max_stage)` → Caps the incoming value at max_stage
2. `GREATEST(stages_completed, capped_value)` → Takes the higher of current or new value
3. Result: Never exceeds max_stage ✓

## Examples

| Scenario | stages_completed | p_current_stage | max_stage | Result | Explanation |
|----------|------------------|-----------------|-----------|--------|-------------|
| Normal progression | 0 | 1 | 5 | 1 | Sets to 1 |
| Second scenario | 1 | 2 | 5 | 2 | Sets to 2 |
| **Edge case** | 2 | 6 | 5 | 5 | Caps at 5 (prevents error) |
| Already at max | 5 | 6 | 5 | 5 | Stays at 5 |

## Changes Made

### Migration Applied
**File:** `supabase/migrations/fix_stages_completed_constraint_violation.sql`

**Changes:**
- Modified `update_simulation_progress()` function
- Added logic to retrieve and respect `max_stage`
- Used `LEAST()` to cap values before assignment

### Frontend Change
**File:** `src/components/simulation/QuestionPage.tsx`

**Line 114:** Changed to use decision count instead of hierarchy level:
```typescript
// Before: Used hierarchyLevel which could be arbitrary
const currentStage = currentScenario.hierarchyLevel ?? 0;

// After: Use actual decision count (sequential: 1, 2, 3...)
const currentStage = activeSession.decisionHistory.length + 1;
```

This ensures we're tracking **how many decisions have been made** rather than some arbitrary hierarchy value.

## Testing

The fix has been validated with test cases showing:

✅ Normal progression works (1 → 2 → 3...)
✅ Values are capped at max_stage
✅ No constraint violations
✅ Backward compatible with existing data

## Impact

### Before Fix:
- ❌ Constraint violation on 2nd+ scenarios
- ❌ Error message shown to user
- ❌ Response not saved
- ❌ User experience broken

### After Fix:
- ✅ All scenarios progress smoothly
- ✅ stages_completed properly tracked
- ✅ No constraint violations
- ✅ Responses saved successfully

## Additional Context

This error was **not** a session expiry issue (despite the misleading error message). It was a **database constraint violation** caused by trying to set `stages_completed` to a value higher than `max_stage`.

The enhanced error logging now shows the specific database error, making diagnosis much easier:

```typescript
console.error('[QuestionPage] Full error object:', JSON.stringify(error, null, 2));
```

## Related Fixes

This fix works in conjunction with:
- **Session Expiry Fix** - Prevents auth-related save failures
- **Enhanced Error Logging** - Shows specific error messages
- **DOM Nesting Fix** - Fixes React validation warnings

All three fixes combined ensure a smooth simulation experience.

## Database Validation

To verify the constraint is working correctly:

```sql
-- Check current constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'simulation_instances_stages_max_check';

-- Verify function exists
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'update_simulation_progress';

-- Test with actual data (won't violate constraint now)
SELECT
  id,
  stages_completed,
  max_stage,
  decision_count,
  CASE
    WHEN stages_completed <= COALESCE(max_stage, stages_completed) THEN '✓ Valid'
    ELSE '✗ Violation'
  END as constraint_status
FROM simulation_instances
WHERE status = 'in_progress'
ORDER BY created_at DESC
LIMIT 10;
```

## Build Status

✅ Project builds successfully
✅ Migration applied successfully
✅ No TypeScript errors
✅ Function tested and validated
