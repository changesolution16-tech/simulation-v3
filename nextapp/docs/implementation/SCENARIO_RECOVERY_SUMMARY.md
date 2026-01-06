# Scenario Recovery - Implementation Summary

## What Was Done

I've created a complete solution to export your 13 scenarios from the browser and save them permanently to the Supabase database.

## Files Created

### 1. **export-scenarios-from-browser.js**
   - Browser console script to automatically extract scenarios from React state
   - Attempts to find scenarios in the component tree
   - Downloads as JSON file
   - **Use this first** - it's the easiest method

### 2. **export-scenarios-manual.md**
   - Detailed instructions for manual export methods
   - React DevTools walkthrough
   - Alternative approaches if automation fails
   - **Use this if** the automated script doesn't work

### 3. **import-scenarios-to-database.mjs**
   - Node.js script to import scenarios into Supabase database
   - Creates all scenarios with proper hierarchy levels
   - Establishes connections between scenarios
   - Preserves all metadata
   - **Run after** you have the export JSON file

### 4. **verify-scenarios-in-database.mjs**
   - Verification script to check database contents
   - Shows scenarios organized by level
   - Displays connections and relationships
   - Identifies entry points and end scenarios
   - **Run after import** to confirm success

### 5. **SCENARIO_EXPORT_AND_MIGRATION_GUIDE.md**
   - Complete step-by-step guide
   - Covers all export methods
   - Import instructions
   - Troubleshooting section
   - **Read this** for comprehensive instructions

### 6. **QUICK_START_SCENARIO_RECOVERY.md**
   - 5-minute quick start guide
   - Simplified process
   - Fast track for common scenarios
   - **Start here** if you want the fastest path

## Current Situation

### ✅ What We Know:
- You have **13 scenarios** visible in the Flow Builder
- They're organized in **4 hierarchy levels** (0, 1, 2, 3)
- Titles include phrases like "Challenge 2A: The Performance Shortcut - The Numbers Look Good - But Something's Off"
- They have **connections** between them (scenario flow)

### ❌ The Problem:
- Scenarios exist **only in browser memory** (React component state)
- They are **NOT in the database** (verified by querying Supabase)
- If you refresh the page, **they will be lost**
- Database shows: 0 scenarios, 0 simulations, 0 connections

### ⚠️ Critical:
**DO NOT REFRESH THE BROWSER** until scenarios are exported and imported to the database!

## Next Steps for You

### Immediate Actions (Choose One Path):

#### Path A: Automated Export (Recommended)
1. Open Flow Builder (keep it open!)
2. Press F12 → Console tab
3. Run `export-scenarios-from-browser.js` script
4. Download JSON file
5. Run `node import-scenarios-to-database.mjs`
6. Verify with `node verify-scenarios-in-database.mjs`

#### Path B: Manual Export (If Path A Fails)
1. Follow instructions in `export-scenarios-manual.md`
2. Use React DevTools to extract scenario data
3. Save as JSON file
4. Run import script
5. Verify

#### Path C: Quick List (Fastest Fallback)
1. List all scenario titles you see
2. Note their levels (0-3)
3. Send to me
4. I'll create import script with your specific data
5. You run it

## Expected Results

After successful import:

### Database Will Have:
- ✅ 13 scenarios in the `scenarios` table
- ✅ ~40-50 options in the `scenario_options` table (assuming 3-4 options per scenario)
- ✅ Proper hierarchy levels (0, 1, 2, 3) set for each scenario
- ✅ Connections between scenarios via `next_scenario_id`

### Flow Builder Will Show:
- ✅ All 13 scenarios after refresh
- ✅ Proper layout with connections
- ✅ Hierarchy levels visible
- ✅ Can edit and save without losing data

### Simulations Will:
- ✅ Link to these scenarios
- ✅ Have a proper entry point (Level 0 scenario)
- ✅ Flow through the correct path
- ✅ Work for learners

## Why This Happened

The scenarios were created in the Flow Builder UI, but likely:
1. Save button wasn't clicked, OR
2. There was an authentication issue, OR
3. RLS policies blocked the save, OR
4. A JavaScript error prevented the save

The Flow Builder's `loadScenarios()` function queries the database (`supabase.from('scenarios').select('*')`), which returned empty, but the React state maintained the scenario data you created.

## Prevention Going Forward

After this is fixed:

1. **Always verify saves** - Check for success notifications
2. **Periodic exports** - Download backup JSON files regularly
3. **Test persistence** - Refresh page to confirm data persists
4. **Monitor errors** - Watch browser console for save failures
5. **Use verification script** - Run periodically to check database

## Technical Details

### Database Schema:
- **scenarios table**: Main scenario data with hierarchy levels
- **scenario_options table**: Response choices with connections
- **simulations table**: Simulation metadata and entry points
- **simulation_scenarios table**: Links scenarios to simulations

### Import Process:
1. Read export JSON
2. Create scenarios in database (with UUIDs)
3. Map old IDs to new database IDs
4. Create options with updated foreign keys
5. Establish connections via `next_scenario_id`
6. Preserve hierarchy levels and metadata

### Verification Process:
1. Query all scenarios from database
2. Organize by hierarchy level
3. Check connections and relationships
4. Identify entry points and end scenarios
5. Verify simulation links

## Support

If you encounter any issues:

1. **Check error messages** - They usually explain the problem
2. **Share with me:**
   - Error message
   - What step failed
   - Export JSON (if available)
   - Screenshots of Flow Builder
3. **Don't panic** - We have multiple recovery methods

## Files to Run (In Order)

```bash
# Step 1: Export (in browser console)
# Copy and run: export-scenarios-from-browser.js

# Step 2: Import to database
node import-scenarios-to-database.mjs

# Step 3: Verify success
node verify-scenarios-in-database.mjs

# Step 4: (Optional) Build project
npm run build
```

## Success Criteria

You'll know it worked when:
- ✅ Import script shows "✅ Import complete!"
- ✅ Verify script shows "✅ Found 13 scenarios in database"
- ✅ Flow Builder loads scenarios after refresh
- ✅ All connections are preserved
- ✅ Hierarchy levels are correct (0-3)

---

## Ready to Start?

Choose your path:
- **Fast track**: Read `QUICK_START_SCENARIO_RECOVERY.md`
- **Detailed guide**: Read `SCENARIO_EXPORT_AND_MIGRATION_GUIDE.md`
- **Need help**: Just ask me and I'll guide you step by step!

**Remember: Don't refresh your browser until export is complete!** 🚨
