# Simulation Update Troubleshooting Guide

## Issue Summary
When clicking "Update Simulation" button, the system logs you out and returns to the login page.

## Root Cause Analysis

The update functionality at the database level **works correctly**. The issue is happening in the frontend during the update process.

## What I've Fixed

### 1. Improved Error Handling in SimulationService
- Removed the retry logic that could cause confusing behavior
- Added detailed logging to track the exact point of failure
- Better error messages that show the actual error details

### 2. Enhanced SimulationBuilder Error Handling
- Added try-catch blocks around update and create operations
- Improved logging to show user info before operations
- Better error feedback to users
- Prevents navigation away from the form if update fails

## How to Diagnose the Issue

### Step 1: Open Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Clear the console (trash icon)

### Step 2: Attempt to Update
1. Try to update a simulation
2. Watch the console for messages starting with `[SimulationBuilder]` and `[SimulationService]`

### Step 3: Look for These Messages

**Expected Success Flow:**
```
[SimulationBuilder] Current user: <user-id> <email> <role>
[SimulationBuilder] Saving simulation...
[SimulationBuilder] Updating existing simulation: <sim-id>
[SimulationService] Updating simulation: <sim-id>
[SimulationService] Update data: { ... }
[SimulationService] Update successful: <sim-id>
[SimulationBuilder] Update successful, calling onSuccess
```

**Failure Indicators:**
- "Update error:" - Database permission issue
- "Error code: 42501" - Permission denied
- "PGRST" errors - PostgREST/RLS policy issues
- "Session lost" - Authentication issue
- Any error about "currentUser" being null

### Step 4: Common Issues and Solutions

#### Issue: "You must be logged in"
**Cause:** User state lost in frontend
**Solution:**
1. Log out completely
2. Clear browser cache and localStorage
3. Log back in as admin or instructor

#### Issue: Permission denied (42501)
**Cause:** RLS policy preventing update
**Solution:** Check that you're logged in as the user who created the simulation, or as an admin

#### Issue: Session expires during update
**Cause:** Long idle time before clicking update
**Solution:**
1. Refresh the page
2. Log in again
3. Try the update again

#### Issue: Update seems to work but logs out anyway
**Cause:** Auth state listener reacting to profile fetch error
**Solution:** This should be fixed by the code changes. If it persists, check browser console for profile fetch errors

## Testing the Fix

Run this test to verify the update works:

```bash
node test-simulation-creation.mjs
```

This will:
1. Sign in as admin
2. Find a simulation
3. Update it
4. Verify the update succeeded
5. Verify the session remains valid

## Manual Testing Steps

1. **Clear Everything:**
   ```bash
   # In browser:
   - Press F12
   - Go to Application tab
   - Clear Storage -> Clear site data
   ```

2. **Fresh Login:**
   - Go to login page
   - Sign in as: `admin@example.com` / `admin123`
   - Verify you see the admin dashboard

3. **Update Simulation:**
   - Go to Simulations tab
   - Select a category
   - Click Edit on a simulation
   - Make a small change (e.g., change description)
   - Click through to the Review step
   - Click "Update Simulation"
   - **Watch the browser console**

4. **Expected Result:**
   - Alert: "Simulation updated successfully!"
   - Returned to category simulations list
   - Still logged in

5. **If It Fails:**
   - Copy all console output
   - Share the error messages
   - Note at which step it fails

## Additional Debugging

If the issue persists after the fixes, add this to check auth state:

```javascript
// In browser console, check current auth:
const { data: { session } } = await supabase.auth.getSession()
console.log('Current session:', session ? 'Active' : 'None')
if (session) console.log('User:', session.user.email)
```

## Next Steps

The code has been updated with:
1. Better error handling
2. Detailed logging
3. Graceful error recovery

Try updating a simulation again and watch the browser console. Share any error messages you see, and I can provide a more specific fix.
