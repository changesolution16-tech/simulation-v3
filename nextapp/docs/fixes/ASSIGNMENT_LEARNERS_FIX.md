# Assignment Learners Display Fix

## Problem Summary
The "LDP Assignment 2025" was created with the "LDP 2025" cohort assigned, which contains 4 learners. However, when viewing the assignment in the teacher dashboard, the learner list showed 0 learners.

## Root Cause
The issue was a **Supabase relationship ambiguity error** (PGRST201).

The `assignment_learners` table has TWO foreign key relationships to the `profiles` table:
1. `assignment_learners_learner_id_fkey` - Links `learner_id` to `profiles(id)`
2. `assignment_learners_graded_by_fkey` - Links `graded_by` to `profiles(id)`

When the frontend code queried:
```typescript
.select(`
  *,
  profiles(full_name, email)
`)
```

Supabase couldn't determine which relationship to use and returned an error:
> "Could not embed because more than one relationship was found for 'assignment_learners' and 'profiles'"

This caused the query to fail silently, returning 0 learners even though 4 learner records existed in the database.

## Diagnostic Evidence

### Database State
- ✅ Assignment exists: "ldp assignment 2025" (ID: `a01d2126-4af3-4b7f-a715-a567156db01c`)
- ✅ Cohort exists: "LDP 2025" (ID: `d2ce6bbd-36d5-4248-9306-971433889175`)
- ✅ Cohort has 4 active members:
  1. Akilah Davy (student@university.edu)
  2. M Johnson (michael.johnson@university.edu)
  3. fdfsdf (judithdavy@yahoo.com)
  4. Marcia Garcia (maria.garcia@university.edu)
- ✅ Assignment has 4 `assignment_learners` records
- ✅ Teacher role is 'instructor' (correct)
- ✅ RLS policies are correct

### The Error
```
Error code: PGRST201
Error message: Could not embed because more than one relationship was found for 'assignment_learners' and 'profiles'
Error hint: Try changing 'profiles' to one of the following:
  'profiles!assignment_learners_graded_by_fkey',
  'profiles!assignment_learners_learner_id_fkey'
```

## Solution

### Fix 1: Specify Explicit Relationship in `getAssignmentLearners()`

**File**: `src/lib/assignments.ts` (Line 351-356)

**Before**:
```typescript
const { data, error } = await supabase
  .from('assignment_learners')
  .select(`
    *,
    profiles(full_name, email)
  `)
  .eq('assignment_id', assignmentId);
```

**After**:
```typescript
const { data, error } = await supabase
  .from('assignment_learners')
  .select(`
    *,
    profiles!assignment_learners_learner_id_fkey(full_name, email)
  `)
  .eq('assignment_id', assignmentId);
```

The explicit relationship name `profiles!assignment_learners_learner_id_fkey` tells Supabase to use the `learner_id` foreign key, not the `graded_by` foreign key.

### Fix 2: Same Fix in `getLearnerAssignments()`

**File**: `src/lib/assignments.ts` (Line 321-327)

**Before**:
```typescript
const { data, error } = await supabase
  .from('assignment_learners')
  .select(`
    *,
    training_assignments(*)
  `)
  .eq('learner_id', learnerId)
```

**After**:
```typescript
const { data, error } = await supabase
  .from('assignment_learners')
  .select(`
    *,
    training_assignments(*),
    profiles!assignment_learners_learner_id_fkey(full_name, email)
  `)
  .eq('learner_id', learnerId)
```

### Fix 3: Correct Role Query in `searchLearners()`

**File**: `src/lib/assignments.ts` (Line 599)

**Before**:
```typescript
.eq('role', 'student')
```

**After**:
```typescript
.eq('role', 'learner')  // Students are stored as 'learner' in the database
```

This was a bonus fix - the code was searching for role 'student' but in the database, students are stored with role 'learner'.

## Testing

### Diagnostic Script
Created `diagnose-assignment-learners.mjs` to test the fix:

```bash
node diagnose-assignment-learners.mjs
```

**Results**:
```
✅ Signed in as: teacher@example.edu
✅ Profile role: instructor
✅ Assignment found: ldp assignment 2025
✅ Found 4 members in cohort
✅ Found 4 assignment learners  <-- This now works!
   1. Akilah Davy (student@university.edu)
   2. M Johnson (michael.johnson@university.edu)
   3. fdfsdf (judithdavy@yahoo.com)
   4. Marcia Garcia (maria.garcia@university.edu)
```

### Build Verification
```bash
npm run build
```
✅ Build successful with no errors

## Why This Happened

When creating the assignment, the code correctly:
1. ✅ Queried `cohort_members` to get learners
2. ✅ Inserted records into `assignment_learners`
3. ✅ All 4 learners were properly assigned

But when displaying the assignment:
1. ❌ The frontend query had ambiguous relationship syntax
2. ❌ Supabase returned an error instead of data
3. ❌ The error was not properly displayed to the user
4. ❌ The UI showed "0 learners" as if there were none

## Key Learnings

### 1. Foreign Key Ambiguity
When a table has multiple foreign keys to the same target table, you MUST use explicit relationship names in Supabase queries:

```typescript
// ❌ Ambiguous - will fail
profiles(field1, field2)

// ✅ Explicit - works correctly
profiles!foreign_key_constraint_name(field1, field2)
```

### 2. Error Handling
The error was silently caught and logged but not surfaced to the user. The UI showed "0 learners" which looked like there were no assignments, not like there was an error.

### 3. Database Naming Conventions
The database stores:
- Students as role = 'learner'
- Teachers as role = 'instructor'
- Admins as role = 'admin'

But the frontend code sometimes uses 'student' instead of 'learner', causing query mismatches.

## Files Changed

1. **src/lib/assignments.ts**
   - Fixed `getAssignmentLearners()` method (line ~351)
   - Fixed `getLearnerAssignments()` method (line ~321)
   - Fixed `searchLearners()` role query (line ~599)

2. **diagnose-assignment-learners.mjs** (new)
   - Diagnostic script to test assignment learner queries
   - Useful for debugging similar issues in the future

## Impact

### Before Fix
- ❌ Teachers could not see learners in assignments
- ❌ No visibility into who was assigned
- ❌ Could not track learner progress
- ❌ Appeared as if assignments had no learners

### After Fix
- ✅ All 4 learners now visible in assignment
- ✅ Teachers can see complete learner list
- ✅ Can track learner progress and status
- ✅ Assignment dashboard shows correct counts

## Related Documentation

- [Supabase Foreign Key Relationships](https://supabase.com/docs/guides/database/joins-and-nesting)
- [PostgREST Disambiguation](https://postgrest.org/en/stable/api.html#disambiguation)

## Future Recommendations

1. **Add Better Error Handling**: Surface relationship errors to users instead of showing empty lists

2. **Consistent Role Naming**: Standardize on either 'student'/'learner' throughout the codebase

3. **Type Safety**: Create TypeScript types for Supabase relationship names to catch these at compile time

4. **Query Testing**: Add unit tests for Supabase queries to catch relationship ambiguity errors early

5. **Diagnostic Tools**: Keep the diagnostic script updated as a debugging tool for similar issues
