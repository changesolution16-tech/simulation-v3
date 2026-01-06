# Session Expiry Fix - "Your Score May Not Be Saved" Error

## Problem Description

Users were experiencing an error during simulations where:
1. On the **second scenario**, when selecting a response option
2. Error message: **"Your score may not be saved"**
3. User was **logged out** and redirected to the login page
4. Response data was **lost**

## Root Cause Analysis

### Primary Issues Identified:

1. **JWT Token Expiration**
   - Supabase JWT tokens have a default expiry time (typically 1 hour)
   - If a learner takes time between scenarios or pauses, the token can expire
   - The expired token caused authentication failures when trying to save responses

2. **RLS Policy Dependency**
   - The `learner_responses` table has Row Level Security (RLS) policies
   - These policies require `auth.uid()` to be valid for INSERT operations
   - Expired session = no valid `auth.uid()` = permission denied

3. **Inadequate Error Recovery**
   - Original code checked session once before saving
   - No automatic refresh mechanism
   - No retry logic for auth-related failures

## Solution Implemented

### 1. Session Keepalive Manager (`src/lib/sessionKeepalive.ts`)

Created a new service to proactively prevent token expiration:

**Features:**
- **Automatic refresh every 5 minutes** during simulations
- **Manual refresh on-demand** before critical operations
- **Smart expiry checking** (refreshes if token expires within 5 minutes)
- **Start/stop control** to prevent unnecessary refreshes

**Key Methods:**
```typescript
- SessionKeepaliveManager.start()           // Start auto-refresh
- SessionKeepaliveManager.stop()            // Stop auto-refresh
- SessionKeepaliveManager.ensureValidSession()  // Check & refresh if needed
```

### 2. Enhanced Supabase Client Configuration

**Updated:** `src/lib/supabase.ts`

Added:
- Auth state change listener for debugging
- Proper token refresh handling
- Client info headers

```typescript
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('[Supabase] Auth token refreshed successfully');
  }
});
```

### 3. Improved QuestionPage Error Handling

**Updated:** `src/components/simulation/QuestionPage.tsx`

**Before:** Simple session check that failed permanently
```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  alert('Session expired');
  navigate('/login');
}
```

**After:** Smart session validation with automatic recovery
```typescript
const sessionValid = await SessionKeepaliveManager.ensureValidSession();
if (!sessionValid) {
  // Only fails after attempted refresh
}
```

**Added retry logic** for auth-related database errors:
- Detects `PGRST301` errors (permission denied)
- Automatically refreshes session
- Retries the save operation once
- Only shows error if retry also fails

### 4. Integration Points

**IntroductionPage** (`src/components/simulation/IntroductionPage.tsx`)
- **Starts** keepalive when entering a simulation
- Ensures continuous session throughout simulation flow

**Results Page** (`src/components/simulation/Results.tsx`)
- **Stops** keepalive when simulation is complete
- Prevents unnecessary token refreshes after completion

## How It Works

### Normal Flow (No Issues):
1. User starts simulation → Keepalive starts (refresh every 5 min)
2. User selects option → Session checked (valid, continues)
3. Response saved → Success
4. Continues through simulation
5. Reaches results → Keepalive stops

### Recovery Flow (Token Expiring):
1. User at scenario 2, token near expiry (detected by keepalive)
2. **Automatic refresh happens in background**
3. User selects option → Session validated, fresh token available
4. Response saved → Success
5. User unaware any issue occurred

### Error Recovery Flow (Unexpected Expiry):
1. User selects option → Token expired
2. `ensureValidSession()` detects expired token
3. **Attempts automatic refresh**
4. If successful → Save proceeds normally
5. If refresh fails → Retry database operation with new token
6. Only show error if all recovery attempts fail

## Database RLS Policy

The fix works with the existing RLS policy in `learner_responses`:

```sql
CREATE POLICY "Learners can create responses via instance"
  ON learner_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM simulation_instances si
      WHERE si.id = instance_id
      AND si.learner_id = auth.uid()  -- Requires valid auth token
    )
  );
```

The session keepalive ensures `auth.uid()` is always valid when this check runs.

## Testing Recommendations

### Manual Testing:
1. **Normal flow:** Complete a simulation without pauses
2. **Slow flow:** Take 10+ minutes between scenarios
3. **Pause/resume:** Leave simulation open for 30+ minutes, then continue
4. **Token expiry:** Manually expire token (via browser DevTools) and test recovery

### Console Monitoring:
Watch for these log messages:
- `[SessionKeepalive] Session refreshed successfully` - Normal refresh
- `[QuestionPage] Session refreshed successfully` - Recovery worked
- `[QuestionPage] Retry successful - response saved` - Retry recovery worked

### Error Cases:
- Test with **no internet connection** (should show network error, not session error)
- Test with **invalid credentials** (should fail gracefully)
- Test **rapid scenario completion** (ensure no refresh conflicts)

## Configuration

### Refresh Interval
Default: 5 minutes (300,000ms)

To change, edit `src/lib/sessionKeepalive.ts`:
```typescript
private static readonly REFRESH_INTERVAL = 5 * 60 * 1000; // milliseconds
```

### Token Expiry Warning Threshold
Default: 5 minutes before expiry

To change, edit the `ensureValidSession()` method:
```typescript
if (timeUntilExpiry < 5 * 60) {  // seconds
```

## Benefits

1. **No more mid-simulation logouts** - Tokens stay fresh automatically
2. **Seamless user experience** - All recovery happens in background
3. **Data protection** - Multiple layers of recovery before failing
4. **Better error messages** - Users only see errors for real issues (network, permissions)
5. **Performance** - Only refreshes when needed, not on every action

## Monitoring & Debugging

### Enable Verbose Logging:
All keepalive operations are logged with `[SessionKeepalive]` prefix

### Check Session Health:
```javascript
// In browser console during simulation:
await SessionKeepaliveManager.ensureValidSession()
// Returns: true (valid) or false (failed)
```

### View Current Session:
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Expires at:', new Date(session.expires_at * 1000));
```

## Files Modified

1. **NEW:** `src/lib/sessionKeepalive.ts` - Session keepalive manager
2. **UPDATED:** `src/lib/supabase.ts` - Enhanced configuration
3. **UPDATED:** `src/components/simulation/QuestionPage.tsx` - Smart session validation
4. **UPDATED:** `src/components/simulation/IntroductionPage.tsx` - Start keepalive
5. **UPDATED:** `src/components/simulation/Results.tsx` - Stop keepalive

## Deployment Notes

No database migrations required. This is a client-side only fix.

No environment variable changes required.

Build tested successfully - no breaking changes.

## Future Enhancements

1. **Offline mode support** - Queue responses when offline
2. **Progressive retry** - Exponential backoff for failed saves
3. **User notification** - Toast message when token is refreshed
4. **Analytics** - Track how often refreshes occur
5. **Admin dashboard** - Monitor session health across users
