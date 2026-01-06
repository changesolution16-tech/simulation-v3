# Timer Not Showing on Question Pages - Analysis and Fix

## Problem Summary
The decision timer is not appearing on question pages during scenario simulations.

## Root Cause Analysis

### 1. Database State
The database is currently **empty** - there are:
- 0 simulations
- 0 scenarios
- 0 profiles/users

This explains why the timer isn't showing - there's no data to display at all.

### 2. Timer Display Logic
The timer display is controlled by this condition in `QuestionPage.tsx` (lines 197-200):

```typescript
const shouldShowTimer = currentScenario?.timerEnabled &&
                        currentScenario?.timerVisible &&
                        (currentScenario?.timerDisplayLocation === 'question_page' ||
                         currentScenario?.timerDisplayLocation === 'all');
```

For the timer to show, **ALL** of these must be true:
- `timer_enabled` = `true`
- `timer_visible` = `true`
- `timer_display_location` = `'question_page'` OR `'all'`

### 3. Database Schema
The timer configuration columns exist in the `scenarios` table (added by migration `20251026022228_add_decision_timer_configuration.sql`):

- `timer_enabled` (boolean, default: false)
- `timer_visible` (boolean, default: false)
- `timer_display_location` (text, default: 'hidden')
- `timer_type` (text, default: 'count_up')
- `timer_limit_seconds` (integer, default: null)
- `show_timer_in_feedback` (boolean, default: true)
- `timer_warning_threshold_seconds` (integer, default: 30)

### 4. Data Flow
The data flows from database to component as:
1. Database columns: `timer_enabled`, `timer_visible`, `timer_display_location`
2. Transformed in `simulations.ts` (lines 461-463) to camelCase
3. Passed to `QuestionPage` component via `currentScenario` object
4. Evaluated in `shouldShowTimer` condition

## Solutions

### Solution 1: Set Up Database with Test Data (Recommended)

You need to populate the database with test data. Here's how:

#### Option A: Using Service Role Key (Fastest)
1. Get your Supabase Service Role Key from: https://supabase.com/dashboard/project/gglzmggwifbkxtxjclcw/settings/api
2. Add it to your `.env` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
   ```
3. Run the seed script:
   ```bash
   node seed-database.mjs
   ```
4. Run the scenario creation script:
   ```bash
   node create-test-scenario-with-timer.mjs
   ```

#### Option B: Using the Admin UI
1. Start the application: `npm run dev`
2. Navigate to the admin panel
3. Create a simulation
4. Add scenarios to the simulation
5. **IMPORTANT**: When editing each scenario, set:
   - ✓ Enable Timer
   - ✓ Timer Visible
   - Display Location: "Question Page" or "All"
   - Timer Type: "Count Up" or "Countdown"

### Solution 2: Update Default Values (For Future Scenarios)

To make the timer show by default on new scenarios, you could update the database migration or the scenario creation form defaults.

#### Update ScenarioCreationModal.tsx defaults (lines 53-55):
```typescript
timerEnabled: true,      // Changed from false
timerVisible: true,      // Changed from false
timerDisplayLocation: 'question_page' as const,  // Changed from 'hidden'
```

### Solution 3: Add Better Debugging

Add console logging to help diagnose timer issues in the future.

#### In QuestionPage.tsx (after line 200):
```typescript
const shouldShowTimer = currentScenario?.timerEnabled &&
                        currentScenario?.timerVisible &&
                        (currentScenario?.timerDisplayLocation === 'question_page' ||
                         currentScenario?.timerDisplayLocation === 'all');

// Debug logging
console.log('[Timer Debug]', {
  timerEnabled: currentScenario?.timerEnabled,
  timerVisible: currentScenario?.timerVisible,
  timerDisplayLocation: currentScenario?.timerDisplayLocation,
  timerType: currentScenario?.timerType,
  shouldShowTimer
});
```

## Verification Steps

Once you have data in the database:

1. **Check database values:**
   ```bash
   node check-timer-config.mjs
   ```

2. **Test in the app:**
   - Log in as admin
   - Start a simulation
   - Navigate to a question page
   - The timer should appear in the top right corner

3. **Look for the timer component:**
   - It appears as a compact badge with a clock icon
   - Shows elapsed time (count_up) or remaining time (countdown)
   - Has different colors based on state (blue, orange for warning, red for expired)

## Expected Timer Appearance

When working correctly, the timer appears as:
```
┌─────────────────┐
│ 🕐 0:45        │  <- Clock icon with time
└─────────────────┘
```

Location: Top right of the question page, next to the "Level X of Y" indicator.

## Common Issues

### Timer Still Not Showing?

1. **Check browser console** for errors
2. **Verify scenario data** is loading correctly
3. **Confirm timer settings** in the database match expectations
4. **Check that DecisionTimer component** is imported and rendering
5. **Ensure no CSS issues** are hiding the timer

### Timer Component Issues

The `DecisionTimer` component (lines 216-224 in QuestionPage.tsx) requires:
- `startTime`: timestamp when question started
- `timerType`: 'count_up' or 'countdown'
- `visible`: must be true
- `compact`: set to true for the question page

## Next Steps

1. ✓ **Set up database data** (use Option A or B above)
2. ✓ **Create a test scenario** with timer enabled
3. ✓ **Test the timer** by starting the simulation
4. ✓ **Verify timer behavior** (counting up, formatting, etc.)
5. ✓ **Check feedback page** timer display (if enabled)

## Files Modified in This Analysis

- Created: `check-timer-config.mjs` - Database checker
- Created: `check-all-scenario-data.mjs` - Comprehensive data checker
- Created: `check-auth-and-data.mjs` - Auth and data status checker
- Created: `create-test-scenario-with-timer.mjs` - Test data creator
- Created: `TIMER_NOT_SHOWING_FIX.md` - This document

## Related Code References

- Timer component: `src/components/simulation/DecisionTimer.tsx`
- Question page: `src/components/simulation/QuestionPage.tsx:197-224`
- Database migration: `supabase/migrations/20251026022228_add_decision_timer_configuration.sql`
- Data transformation: `src/lib/simulations.ts:461-467`
- Scenario creation: `src/components/admin/ScenarioCreationModal.tsx:53-55`
