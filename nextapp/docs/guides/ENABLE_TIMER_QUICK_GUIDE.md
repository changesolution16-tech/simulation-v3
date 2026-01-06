# Quick Guide: Enable Timer on Question Pages

## Problem
The timer is not showing on scenario question pages.

## Root Cause
**Your database is currently empty.** There are no simulations or scenarios to display.

## Quick Fix Steps

### Option 1: Using the Admin UI (Recommended)

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Log in as admin** (or create an admin account)

3. **Create a Simulation:**
   - Go to Admin Dashboard
   - Navigate to "Simulations" tab
   - Click "Create New Simulation"
   - Fill in the basic details
   - Click "Create"

4. **Add Scenarios:**
   - Click "Add Scenario" or "Edit Scenarios"
   - Create at least one scenario with options

5. **Enable Timer Settings:**
   When creating/editing a scenario, scroll to the "Decision Timer Configuration" section and set:

   - ✅ **Enable Timer** (check this box)
   - ✅ **Timer Visible** (check this box)
   - **Display Location:** Select "Question Page" or "All Pages"
   - **Timer Type:** Select "Count Up" or "Countdown"
   - **Time Limit:** Set a time limit in seconds (for countdown)
   - **Warning Threshold:** 30 seconds (default is fine)

6. **Save and Test:**
   - Save the scenario
   - Publish the simulation
   - Start the simulation as a learner
   - The timer should now appear on the question page!

### Option 2: Using Service Role Key (For Development)

If you have the Supabase Service Role Key:

1. **Add the key to `.env`:**
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_actual_key_here
   ```

2. **Run the seed script:**
   ```bash
   node seed-database.mjs
   ```

3. **Create test scenario with timer:**
   ```bash
   node create-test-scenario-with-timer.mjs
   ```

## Verify It's Working

### Check the Database:
```bash
node check-timer-config.mjs
```

You should see output showing scenarios with timer settings:
```
Timer Enabled: true
Timer Visible: true
Display Location: question_page
✓ Should show on question page: YES
```

### Check the Browser Console:

When you navigate to a question page, you should see:
```
[QuestionPage Timer Debug] {
  timerEnabled: true,
  timerVisible: true,
  timerDisplayLocation: "question_page",
  shouldShowTimer: true,
  message: "Timer WILL display"
}
```

## What the Timer Looks Like

When working correctly, the timer appears in the **top-right corner** of the question page:

```
┌────────────────────────────┐
│ 🕐 0:45  │ Level 1 of 3   │
└────────────────────────────┘
```

## Troubleshooting

### Timer Still Not Showing?

1. **Check browser console** - Look for the debug log message
2. **Verify all three settings are enabled:**
   - timer_enabled = true
   - timer_visible = true
   - timer_display_location = 'question_page' or 'all'
3. **Check that you're on a question page** (not introduction or feedback)
4. **Refresh the page** after saving changes

### Common Mistakes

❌ **Timer Enabled but not Visible**
- Make sure BOTH "Enable Timer" AND "Timer Visible" are checked

❌ **Display Location is "Hidden"**
- Change to "Question Page" or "All Pages"

❌ **Wrong Page**
- Timer only shows on question pages (where you select an option)
- Check the "Display Location" setting to show on other pages

## Need More Help?

See the comprehensive guide: `TIMER_NOT_SHOWING_FIX.md`

## Summary

The timer isn't showing because your database is empty. Create a simulation with scenarios, enable the timer settings, and it will work!
