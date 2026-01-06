# Session Expiry Fix - Quick Reference

## Problem Fixed
❌ **Before:** Users logged out on 2nd scenario with "Your score may not be saved" error
✅ **After:** Sessions stay alive throughout entire simulation with automatic refresh

## What Was Changed

### New File Created
- `src/lib/sessionKeepalive.ts` - Automatic session refresh manager

### Files Modified
- `src/lib/supabase.ts` - Better auth configuration
- `src/components/simulation/QuestionPage.tsx` - Smart session validation + retry
- `src/components/simulation/IntroductionPage.tsx` - Start keepalive
- `src/components/simulation/Results.tsx` - Stop keepalive

## How It Works

```
User starts simulation
    ↓
Keepalive starts (refresh every 5 min)
    ↓
User navigates through scenarios
    ↓
Token automatically refreshed in background
    ↓
User selects option → Session validated → Save succeeds
    ↓
Simulation completes → Keepalive stops
```

## Key Features

1. **Automatic refresh every 5 minutes** - Keeps token alive during simulations
2. **Smart pre-save validation** - Checks & refreshes before saving responses
3. **Automatic retry** - If save fails due to auth, refreshes and retries once
4. **Zero user disruption** - All recovery happens invisibly

## Console Messages to Watch

✅ **Good (Normal Operation):**
```
[SessionKeepalive] Starting session keepalive (refresh every 5 minutes)
[SessionKeepalive] Session refreshed successfully
[QuestionPage] ✓ Saved learner response
```

⚠️ **Warning (Recovery Working):**
```
[QuestionPage] Session not found, attempting to refresh...
[QuestionPage] Session refreshed successfully
[QuestionPage] ✓ Retry successful - response saved
```

❌ **Error (Real Problem):**
```
[QuestionPage] Unable to establish valid session
[QuestionPage] CRITICAL: Failed to save learner response
```

## Testing Checklist

- [ ] Complete simulation quickly (< 5 minutes)
- [ ] Complete simulation slowly (> 10 minutes between scenarios)
- [ ] Pause simulation for 30+ minutes, then continue
- [ ] Monitor console for refresh messages
- [ ] Verify no logout errors during normal use
- [ ] Verify responses save successfully at each scenario

## Quick Troubleshooting

**If users still get logged out:**
1. Check browser console for error details
2. Verify Supabase JWT settings haven't changed
3. Check RLS policies on `learner_responses` table
4. Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct

**If refreshes happen too often:**
- Increase `REFRESH_INTERVAL` in `sessionKeepalive.ts` (line 5)

**If refreshes don't happen enough:**
- Decrease `REFRESH_INTERVAL` (but don't go below 2 minutes)

## Rollback Instructions

If issues occur, revert these files:
```bash
git checkout HEAD~1 -- src/lib/sessionKeepalive.ts
git checkout HEAD~1 -- src/lib/supabase.ts
git checkout HEAD~1 -- src/components/simulation/QuestionPage.tsx
git checkout HEAD~1 -- src/components/simulation/IntroductionPage.tsx
git checkout HEAD~1 -- src/components/simulation/Results.tsx
npm run build
```

## Support

For issues or questions, check:
1. Full documentation: `SESSION_EXPIRY_FIX.md`
2. Browser console logs (look for `[SessionKeepalive]` and `[QuestionPage]` messages)
3. Supabase dashboard logs for auth errors
