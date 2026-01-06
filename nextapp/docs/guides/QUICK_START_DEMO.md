# Quick Start Guide for Demo

## Pre-Demo Checklist (5 Minutes)

### 1. Run Validation Script
```bash
node validate-demo-simulation.mjs
```

**Expected Output**: "No critical errors" or "All validation checks passed"

If you see critical errors, **DO NOT proceed with demo** - fix them first.

### 2. Verify Build
```bash
npm run build
```

**Expected Output**: "✓ built in ~10s" with no errors

### 3. Check Published Simulations

1. Log in as admin
2. Navigate to Admin Dashboard
3. Check that at least one simulation is marked as "Published"
4. If not, publish a simulation

## Demo Flow Testing (10 Minutes)

### Test 1: Admin - Create Scenario

1. Go to Admin → Scenarios → Flow Builder
2. Click "Add Scenario"
3. Fill in details with videos
4. Click Save
5. **Verify**: Page doesn't show errors
6. **Verify**: Refresh page - scenario still there with connections intact

### Test 2: Learner - Play Simulation

1. Log out and log in as learner
2. Navigate to available simulations
3. Start a published simulation
4. **Verify**: Landing page displays correctly
5. **Verify**: Videos play without errors
6. Make choices through 2-3 scenarios
7. **Verify**: Feedback displays correctly
8. **Verify**: Can reach results page

### Test 3: Video Upload

1. Log in as admin
2. Go to scenario editor
3. Upload a video file
4. **Verify**: Upload completes successfully
5. Save scenario
6. **Verify**: Video reference saved correctly (check console for "[VideoValidation]" - should show no errors)

## Common Issues & Quick Fixes

### "Session expired" message
**Fix**: Refresh browser and log in again

### "Connection mismatch" in console
**Fix**: System auto-recovers - wait 1 second for reload

### "Validation failed" when saving
**Fix**: Check error message, common issues:
- UUID in feedback text - re-enter text
- Missing required fields - fill in all fields
- Invalid video URL - re-upload or re-select video

### Scenario connections disappear
**Fix**:
1. Check console for errors
2. Re-establish connections in Flow Builder
3. Save again
4. Refresh to verify they persisted

## Monitoring During Demo

### Browser Console
Keep developer console open (F12) and watch for:

**Good Signs** (these are fine):
- `[ScenarioFlowBuilder] Scenario saved successfully`
- `[QueryHelper] Query successful`
- `[SimulationPlayer] Started simulation instance`

**Warning Signs** (investigate after demo):
- `⚠️ WARNING:` messages
- `[VideoValidation] Detected UUID`

**Stop Demo If You See**:
- `❌ ERROR:` messages
- `infinite recursion detected`
- Multiple failed saves

### Network Tab
If simulation won't load:
1. Open Network tab (F12)
2. Filter by "supabase"
3. Look for red (failed) requests
4. Check if 401 (unauthorized) - session expired
5. Check if 500 (server error) - database issue

## Emergency Recovery

### If Simulation Won't Load
1. Open console
2. Check for session errors
3. Refresh and log in again
4. If still fails, try different simulation

### If Save Keeps Failing
1. Check console for specific validation errors
2. Fix errors mentioned
3. If unclear, reload page and try again
4. Last resort: Create new scenario instead of editing

### If Videos Won't Play
1. Check video URL in console logs
2. If contains UUID, video reference is corrupted
3. Go to scenario editor
4. Re-upload or re-select video
5. Save scenario

## Demo Tips

### Show These Features
1. ✅ Flow builder with visual scenario connections
2. ✅ Drag-and-drop scenario positioning
3. ✅ Video integration (YouTube, Vimeo, uploads)
4. ✅ Multiple difficulty levels
5. ✅ Feedback system with videos
6. ✅ Simulation playback with branching paths
7. ✅ Results and competency tracking

### Avoid During Demo
1. ❌ Editing multiple scenarios simultaneously
2. ❌ Rapid save operations (wait 1-2 seconds between saves)
3. ❌ Deleting scenarios that are used in simulations
4. ❌ Uploading very large video files (>100MB)
5. ❌ Demonstrating features that haven't been tested

## Post-Demo

### If Issues Occurred
1. Note what happened and when
2. Check console logs for errors
3. Run validation script: `node validate-demo-simulation.mjs`
4. Review any critical errors
5. Check `DEMO_PREPARATION_COMPLETE.md` for troubleshooting

### Success Indicators
- ✅ All scenarios saved successfully
- ✅ Learners completed simulations without errors
- ✅ Videos played correctly
- ✅ Feedback displayed properly
- ✅ Connections between scenarios worked
- ✅ No critical console errors

## Contact for Support

If you encounter issues not covered here:
1. Check browser console for detailed error logs
2. Run: `node validate-demo-simulation.mjs`
3. Review error messages with "[Context]" prefixes
4. Check `DEMO_PREPARATION_COMPLETE.md` for detailed troubleshooting

## Validation Script Output Explained

**✅ Green checkmarks**: Everything working correctly
**⚠️ Yellow warnings**: Non-critical issues, review but can proceed
**❌ Red errors**: Critical issues, MUST fix before demo

**Example Good Output:**
```
✅ Database connection successful
✅ No RLS policy recursion detected
✅ Found 2 published simulation(s)
✅ All scenario connections are valid
✅ No failed video uploads

Total Issues: 0
Critical Errors: 0
Warnings: 0
```

**Example Issue Output:**
```
❌ Landing video URL contains UUID: 123e4567...
❌ Option "Choose A" has UUID in beginner feedback

Total Issues: 2
Critical Errors: 2
Warnings: 0

❌ Critical errors found. Please fix before demo.
```

## Time Estimates

- Pre-demo validation: 5 minutes
- Demo flow testing: 10 minutes
- Typical demo length: 20-30 minutes
- Emergency recovery: 2-5 minutes

## Final Check Before Demo

Right before starting:
1. [ ] Validation script passed
2. [ ] Build successful
3. [ ] At least one published simulation exists
4. [ ] Logged in as admin
5. [ ] Browser console open (F12)
6. [ ] Internet connection stable
7. [ ] Backup tab open with login page (in case of session issues)

Good luck with your demo! 🎉
