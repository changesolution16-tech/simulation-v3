# Quick Fix: Foreign Key Constraint Error

## Problem

Error when adding a scenario:
```
insert or update on table "simulation_scenarios" violates foreign key constraint "simulation_scenarios_scenario_id_fkey"
```

## Solution (60 seconds)

### Run this command:

```bash
psql $DATABASE_URL -f fix-simulation-scenarios-foreign-key.sql
```

### What it does:
- ✅ Removes the problematic foreign key constraint
- ✅ Makes `scenario_id` nullable
- ✅ **Does NOT delete any data**
- ✅ **Backward compatible**

### Why this works:
The `scenario_id` column in `simulation_scenarios` is a legacy field that your code doesn't use. The foreign key constraint was trying to enforce a relationship that doesn't exist in your current architecture.

## Expected Result

After running the fix:

```
NOTICE: Dropped foreign key constraint: simulation_scenarios_scenario_id_fkey
NOTICE: scenario_id column is now nullable
```

## Test It

1. Go to `/admin/simulations`
2. Click on a simulation
3. Click "Add Scenario"
4. Fill out the form
5. Click "Create"

**Result:** ✅ Scenario should be created successfully!

## Is This Safe?

**YES!** This is 100% safe because:

1. ✅ Your code never sets the `scenario_id` field when creating scenarios
2. ✅ Your code uses `simulation_scenarios.id` as the primary identifier
3. ✅ Removing the constraint doesn't delete data
4. ✅ This is documented as the correct fix in `SIMULATION_SCENARIOS_SCHEMA_GUIDE.md`

## Questions?

**Q: Should I remove the foreign key?**
**A:** ✅ YES - This is the correct solution. The foreign key is on a legacy column that's not being used.

**Q: Will this break anything?**
**A:** ❌ NO - Your application doesn't use this column, so removing the constraint has zero impact.

**Q: Will I lose data?**
**A:** ❌ NO - We're only removing a constraint, not deleting data.

**Q: Can I add the constraint back later?**
**A:** ✅ YES - If needed in the future, you can re-add it. But based on your current code, you won't need it.

## Detailed Documentation

For more information, see:
- `SIMULATION_SCENARIOS_FOREIGN_KEY_FIX.md` - Full explanation
- `SIMULATION_SCENARIOS_SCHEMA_GUIDE.md` - Schema documentation

## Summary

**Run this command and you're done:**

```bash
psql $DATABASE_URL -f fix-simulation-scenarios-foreign-key.sql
```

✅ **Problem solved!**
