# Assignment Learners Not Showing - Quick Fix Summary

## Problem
The "LDP Assignment 2025" showed 0 learners even though 4 students were in the assigned cohort.

## Root Cause
**Supabase relationship ambiguity error (PGRST201)**

The `assignment_learners` table has TWO foreign keys to `profiles`:
- `learner_id` → profiles (who is assigned)
- `graded_by` → profiles (who graded it)

The query `profiles(full_name, email)` was ambiguous - Supabase didn't know which relationship to use.

## The Fix

### Change 1: Specify Explicit Relationship
**File**: `src/lib/assignments.ts`

```typescript
// ❌ Before (ambiguous)
profiles(full_name, email)

// ✅ After (explicit)
profiles!assignment_learners_learner_id_fkey(full_name, email)
```

### Change 2: Fix Role Query
**File**: `src/lib/assignments.ts`

```typescript
// ❌ Before (wrong role name)
.eq('role', 'student')

// ✅ After (correct role name)
.eq('role', 'learner')
```

## Testing
Run the diagnostic:
```bash
node diagnose-assignment-learners.mjs
```

Expected output:
```
✅ Found 4 assignment learners
   1. Akilah Davy (student@university.edu)
   2. M Johnson (michael.johnson@university.edu)
   3. fdfsdf (judithdavy@yahoo.com)
   4. Marcia Garcia (maria.garcia@university.edu)
```

## What Was Fixed
1. ✅ `getAssignmentLearners()` - Teachers can now see all assigned learners
2. ✅ `getLearnerAssignments()` - Learners can see their assignments with profile data
3. ✅ `searchLearners()` - Search now queries correct role ('learner' not 'student')

## Build Status
✅ `npm run build` - Successful, no errors

## Impact
- **Before**: 0 learners shown (data existed but query failed silently)
- **After**: All 4 learners visible with correct profile information

## Key Learning
When a table has multiple foreign keys to the same target table, always use explicit relationship syntax:
```
target_table!foreign_key_constraint_name(fields)
```

## Files Modified
- `src/lib/assignments.ts` (3 fixes)
- `diagnose-assignment-learners.mjs` (new diagnostic tool)

See `ASSIGNMENT_LEARNERS_FIX.md` for detailed documentation.
