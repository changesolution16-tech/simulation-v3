# Fix for simulation_scenarios Foreign Key Constraint Error

## Problem Description

When attempting to add a new scenario through the admin interface, you encounter this error:

```
insert or update on table "simulation_scenarios" violates foreign key constraint "simulation_scenarios_scenario_id_fkey"
```

## Root Cause

The `simulation_scenarios` table has a foreign key constraint on the `scenario_id` column that references the `scenarios` table. However:

1. **The `scenario_id` column is LEGACY/OPTIONAL** and not actively used by the current codebase
2. **The code does NOT set `scenario_id`** when creating new scenarios
3. The foreign key constraint tries to validate a reference that doesn't exist

### Code Evidence

Looking at `/src/app/api/simulations/[id]/scenarios/route.ts` (lines 117-135):

```typescript
const [scenario] = await sql`
  INSERT INTO simulation_scenarios (
    simulation_id,           // ✅ Set
    scenario_name,           // ✅ Set
    question_text,           // ✅ Set
    hierarchy_level,         // ✅ Set
    video_url,               // ✅ Set
    // ... other fields ...
    // ❌ scenario_id is NOT in this list
  ) VALUES (...)
`;
```

Notice that `scenario_id` is **not included** in the INSERT statement. The current architecture uses `simulation_scenarios.id` as the primary identifier, not `scenario_id`.

## Why This Column Exists

### Historical Context

Your application has **two tables** for storing scenario data:

1. **`scenarios` table** - Original/legacy table for reusable scenario templates
2. **`simulation_scenarios` table** - Current table for scenarios within specific simulations

The `scenario_id` column in `simulation_scenarios` was intended to link back to a template in the `scenarios` table, but this pattern is no longer used.

### Current Architecture

```
simulations (id, title, ...)
    ↓
simulation_scenarios (id, simulation_id, scenario_name, ...)
    ↓
scenario_options (id, scenario_id → simulation_scenarios.id)
    ↓
learner_responses (scenario_id → simulation_scenarios.id)
```

Notice that **everything references `simulation_scenarios.id`**, not `scenarios.id`.

## Solution: Remove the Foreign Key Constraint

### Why It's Safe to Remove

1. ✅ **Not Used by Code**: The application never sets `scenario_id`
2. ✅ **Documented as Legacy**: Per `SIMULATION_SCENARIOS_SCHEMA_GUIDE.md` line 38: "Optional legacy link"
3. ✅ **No Data Loss**: Removing the constraint doesn't delete data, just removes validation
4. ✅ **Backward Compatible**: Existing rows with `scenario_id` set will remain unchanged

### What We Keep

- ✅ The `scenario_id` column itself (for backward compatibility)
- ✅ All existing data
- ✅ The ability to manually set `scenario_id` if needed in the future

### What We Remove

- ❌ The foreign key constraint that enforces `scenario_id` must exist in `scenarios` table

## How to Fix

### Quick Fix (Run This Command)

```bash
psql $DATABASE_URL -f fix-simulation-scenarios-foreign-key.sql
```

### What the Fix Does

1. **Finds and drops** the foreign key constraint on `scenario_id`
2. **Ensures** `scenario_id` is nullable (can be NULL)
3. **Adds documentation** to the column explaining it's legacy/optional
4. **Verifies** the fix was successful

### Expected Output

```
NOTICE: Dropped foreign key constraint: simulation_scenarios_scenario_id_fkey
NOTICE: scenario_id column is now nullable

 column_name  | data_type | is_nullable | column_default
--------------+-----------+-------------+----------------
 scenario_id  | uuid      | YES         | NULL

(0 rows returned from foreign key check - this is good!)
```

The last query returning 0 rows means **no foreign key constraints** remain on the `scenario_id` column.

## Alternative Solutions (Not Recommended)

### Alternative 1: Always Set scenario_id

You could modify the code to always create a row in the `scenarios` table first, then reference it:

```typescript
// Step 1: Create in scenarios table
const [template] = await sql`
  INSERT INTO scenarios (title, question_text, ...)
  VALUES (...)
  RETURNING id
`;

// Step 2: Create in simulation_scenarios referencing template
const [scenario] = await sql`
  INSERT INTO simulation_scenarios (
    simulation_id,
    scenario_id,  // Now set to template.id
    scenario_name,
    ...
  ) VALUES (...)
`;
```

**Why NOT recommended:**
- ❌ Adds unnecessary complexity
- ❌ Duplicates data across two tables
- ❌ Breaks the current simple architecture
- ❌ No benefit for the use case

### Alternative 2: Drop the scenario_id Column Entirely

```sql
ALTER TABLE simulation_scenarios DROP COLUMN scenario_id;
```

**Why NOT recommended:**
- ⚠️ Destructive change (can't undo without backup)
- ⚠️ May break if anyone is using this column
- ⚠️ More aggressive than necessary

### Alternative 3: Make the Foreign Key Deferrable

```sql
ALTER TABLE simulation_scenarios
  DROP CONSTRAINT simulation_scenarios_scenario_id_fkey;

ALTER TABLE simulation_scenarios
  ADD CONSTRAINT simulation_scenarios_scenario_id_fkey
  FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
  DEFERRABLE INITIALLY DEFERRED;
```

**Why NOT recommended:**
- ❌ Doesn't solve the root issue (scenario_id still not being set)
- ❌ Just delays the error to end of transaction
- ❌ Adds unnecessary complexity

## Recommended Solution: Remove the Constraint ✅

The **best solution** is to remove the foreign key constraint because:

1. ✅ **Simple**: One SQL script, runs in seconds
2. ✅ **Safe**: No data loss, backward compatible
3. ✅ **Aligned with Code**: Matches how the application actually works
4. ✅ **Future-Proof**: Doesn't prevent adding the constraint back later if needed
5. ✅ **Non-Breaking**: Existing scenarios continue to work

## After Running the Fix

### 1. Verify It Works

Try creating a new scenario through the admin interface:

1. Go to `/admin/simulations`
2. Click on a simulation
3. Click "Add Scenario"
4. Fill out the form
5. Click "Create"

**Expected:** ✅ Scenario is created successfully without errors

### 2. Check the Database

```sql
-- Verify no foreign key constraint exists
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'simulation_scenarios'
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name LIKE '%scenario_id%';

-- Should return: 0 rows
```

### 3. Verify Existing Scenarios Still Work

```sql
-- Check existing scenarios
SELECT
  id,
  simulation_id,
  scenario_id,
  scenario_name
FROM simulation_scenarios
LIMIT 5;

-- All should display correctly
-- scenario_id can be NULL (most will be)
-- Some old rows might have scenario_id set (that's OK)
```

## Understanding the Two Tables

### When to Use `scenarios` Table

Use this for:
- ❓ Reusable scenario templates (not currently implemented)
- ❓ Scenario library/marketplace (future feature)
- ❓ Sharing scenarios across simulations (not currently used)

**Current Status:** ⚠️ This table exists but is not actively used by the current UI

### When to Use `simulation_scenarios` Table

Use this for:
- ✅ Scenarios created within a specific simulation
- ✅ All current scenario creation via admin UI
- ✅ Learner simulation flow
- ✅ Response tracking

**Current Status:** ✅ Actively used, primary scenario storage

## Testing Checklist

After applying the fix:

- [ ] Can create new scenario without errors
- [ ] Can edit existing scenarios
- [ ] Can delete scenarios
- [ ] Learners can play simulations
- [ ] Introduction page displays correctly
- [ ] Question page displays correctly
- [ ] Feedback page displays correctly
- [ ] Responses are recorded correctly

## Long-Term Recommendations

### Option A: Keep Current Architecture (Recommended)

Continue using `simulation_scenarios` as the primary table:

**Pros:**
- ✅ Matches current code
- ✅ Simple architecture
- ✅ No migration needed
- ✅ Already working well

**Cons:**
- ⚠️ Can't easily share scenarios across simulations
- ⚠️ No scenario template library

### Option B: Implement Template System (Future Enhancement)

Build out the `scenarios` table as a template library:

1. Admin creates scenario templates in `scenarios` table
2. When adding to a simulation, copy template to `simulation_scenarios`
3. Set `simulation_scenarios.scenario_id` to reference the template
4. Allow updates to template or instance independently

**Pros:**
- ✅ Reusable scenarios
- ✅ Scenario marketplace potential
- ✅ Version control

**Cons:**
- ⚠️ More complex
- ⚠️ Requires UI development
- ⚠️ Migration effort

### Option C: Consolidate to One Table (Major Refactor)

Merge both tables into one with a `is_template` flag:

**Pros:**
- ✅ Simpler schema
- ✅ No duplication

**Cons:**
- ❌ Major breaking change
- ❌ Significant refactoring
- ❌ Migration complexity
- ❌ Not worth the effort

## Recommendation: **Option A** ✅

Keep the current architecture with `simulation_scenarios` as the primary table. If you need templates in the future, implement **Option B**.

## Summary

1. ✅ **Problem Identified**: Foreign key constraint on unused `scenario_id` column
2. ✅ **Solution Created**: SQL script to remove the constraint
3. ✅ **Safe to Apply**: No data loss, backward compatible
4. ✅ **Quick Fix**: Run one SQL file
5. ✅ **Tested Approach**: Aligns with current code architecture

## Run the Fix Now

```bash
psql $DATABASE_URL -f fix-simulation-scenarios-foreign-key.sql
```

Then try creating a scenario again - it should work! ✅

---

**Question Answered:** Yes, you should remove the foreign key constraint. It's safe, necessary, and the correct solution.
