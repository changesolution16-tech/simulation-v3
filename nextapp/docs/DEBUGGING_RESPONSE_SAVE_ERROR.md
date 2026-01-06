# Debugging "Your Response May Not Have Been Saved" Error

## Current Status

The session expiry fix has been implemented, but if you're still seeing the error, we need to identify the root cause.

## Enhanced Error Logging

I've added comprehensive logging to help diagnose the issue. When you see the error, check the browser console for these messages:

### 1. Session Validation Logs
```
[QuestionPage] Option selected: <option-id>
[QuestionPage] Validating session...
[QuestionPage] Session validation result: true/false
```

**If `sessionValid` is `false`:** The session expired and couldn't be refreshed
- Check if `[SessionKeepalive]` refresh messages appear
- Verify Supabase is configured correctly
- Check network tab for auth refresh calls

### 2. Data Preparation Logs
```
[QuestionPage] Session valid, proceeding with save...
[QuestionPage] Saving response to database... {
  instance_id: "...",
  scenario_id: "...",
  option_id: "...",
  response_order: 1,
  time_to_decision_seconds: 10,
  viewed_videos: false,
  video_watch_time_seconds: 0,
  responded_at: "2025-..."
}
```

**What to check:**
- All UUIDs should be valid (not null or undefined)
- `instance_id` must exist
- `scenario_id` and `option_id` should match simulation data

### 3. Error Details Logs
```
[QuestionPage] CRITICAL: Failed to save learner response: {...}
[QuestionPage] Error details: {
  code: "...",
  message: "...",
  details: "...",
  hint: "..."
}
[QuestionPage] Full error object: {...}
```

## Common Error Codes & Solutions

### Code: `PGRST301` - JWT Expired
**Symptom:** Permission denied / JWT errors
**Solution:** Session expiry - should be handled automatically by retry logic
**Action:** Check if retry logs appear, verify `refreshSession()` is working

### Code: `23505` - Duplicate Key
**Symptom:** "duplicate key value violates unique constraint"
**Solution:** Response already saved (harmless)
**Action:** None needed - error is now suppressed automatically

### Code: `PGRST116` or `42501` - Permission Denied
**Symptom:** RLS policy blocking insert
**Possible causes:**
1. User's `auth.uid()` doesn't match `simulation_instances.learner_id`
2. `instance_id` doesn't exist in `simulation_instances`
3. RLS policy configuration issue

**Action:** Check database:
```sql
-- Verify instance exists and belongs to user
SELECT id, learner_id, status
FROM simulation_instances
WHERE id = '<instance_id>';

-- Verify RLS policies are correct
SELECT * FROM pg_policies
WHERE tablename = 'learner_responses';
```

### No Error Code - Network Error
**Symptom:** "Failed to fetch" or "NetworkError"
**Solution:** Connection problem
**Action:** Check internet connection, Supabase status

### Code: `23503` - Foreign Key Violation
**Symptom:** "violates foreign key constraint"
**Possible causes:**
1. `scenario_id` doesn't exist in `scenarios` table
2. `option_id` doesn't exist in `scenario_options` table
3. `instance_id` doesn't exist in `simulation_instances` table

**Action:** Verify the referenced records exist

## Step-by-Step Debugging Process

### Step 1: Reproduce the Error
1. Open browser DevTools (F12)
2. Go to Console tab
3. Start a simulation
4. Progress to where the error occurs
5. Select an option
6. **Copy ALL console logs** starting from `[QuestionPage] Option selected`

### Step 2: Check Network Tab
1. Open Network tab in DevTools
2. Filter by "supabase"
3. Look for the failed `learner_responses` request
4. Check:
   - Request payload (what data was sent)
   - Response status (400, 401, 403, 500, etc.)
   - Response body (error details from Supabase)

### Step 3: Verify Session
In the console, run:
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);
console.log('User ID:', session?.user?.id);
console.log('Expires at:', new Date(session?.expires_at * 1000));
```

### Step 4: Check Simulation Instance
In the console, run:
```javascript
// Get current user ID
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user.id);

// Find active instance
const { data: instances } = await supabase
  .from('simulation_instances')
  .select('*')
  .eq('learner_id', user.id)
  .eq('status', 'in_progress')
  .order('created_at', { ascending: false })
  .limit(1);

console.log('Active instances:', instances);
```

### Step 5: Test RLS Policy Manually
```javascript
// Try to insert a test record
const testData = {
  instance_id: '<your-instance-id>',
  scenario_id: '<your-scenario-id>',
  option_id: '<your-option-id>',
  response_order: 999,
  time_to_decision_seconds: 1,
  viewed_videos: false,
  video_watch_time_seconds: 0
};

const { data, error } = await supabase
  .from('learner_responses')
  .insert(testData)
  .select();

console.log('Test insert result:', { data, error });

// Clean up test record
if (data) {
  await supabase.from('learner_responses').delete().eq('id', data[0].id);
}
```

## Specific Error Messages & Meanings

### "Authentication issue detected. Please try refreshing the page."
- Session expired and retry failed
- User might need to log in again
- Check if keepalive is running: Look for `[SessionKeepalive]` logs

### "Please check your internet connection."
- Network request failed
- Supabase might be unreachable
- Check browser's network tab

### "Error: <specific database error>"
- Database-level issue (constraint, foreign key, etc.)
- Review the specific error message
- Check database schema and data integrity

## What to Report

If the error persists, please provide:

1. **Full console logs** from when you select an option
2. **Network tab screenshot** showing the failed request
3. **Error message text** from the alert
4. **Which scenario** the error occurred on (1st, 2nd, etc.)
5. **Timing:** How long between starting simulation and the error?

## Quick Fixes to Try

1. **Refresh the page** - Clears any stale state
2. **Clear browser cache** - Remove old cached data
3. **Log out and log back in** - Get fresh session
4. **Try incognito/private mode** - Rule out extension interference
5. **Check Supabase dashboard** - Verify project is online

## Next Steps

Based on the console logs and network data, we can:
- Identify if it's session/auth related
- Check if RLS policies need adjustment
- Verify data integrity (foreign keys, UUIDs)
- Determine if it's a network/infrastructure issue
- Add specific handling for the error type encountered
