# Troubleshooting: Feedback Showing UUID Instead of Text

## Problem
When viewing scenario feedback, you see a UUID (like `e6f53a46-55ac-43ad-955a-f0cf8b3eb63c`) instead of the actual feedback text.

## Diagnostic Steps

### Step 1: Check Your Database Data

Run the diagnostic script to see what's actually in your database:

```bash
node diagnose-feedback-issue.mjs
```

This will show you:
- All scenarios and their options
- The actual content of feedback fields
- Whether UUIDs are present in feedback text
- All video-related fields that might be causing issues

### Step 2: Reproduce the Issue with Logging

I've added comprehensive logging throughout the application. Follow these steps:

1. **Open your browser's Developer Console** (F12 or Right-click → Inspect → Console)

2. **Create or Edit a Scenario:**
   - Go to Admin Dashboard → Scenarios
   - Either create a new scenario or edit an existing one
   - Fill in all fields including feedback text

3. **Watch the Console for These Key Log Messages:**

   **When Loading a Scenario for Editing:**
   ```
   [ScenarioEditModal] Loading option 0: {
     id: "...",
     text: "...",
     feedback_type: "object",  // Should be "object", not "string"
     feedback_structure: { beginner: "...", intermediate: "...", advanced: "..." },
     feedback_beginner: "actual feedback text here"  // Should NOT be a UUID
   }
   ```

   **When Changing Feedback Text:**
   ```
   [ScenarioEditModal] updateOption called: {
     index: 0,
     field: "feedback_beginner",
     value: "your typed text",
     valueType: "string"  // Should always be "string"
   }
   ```

   **When Saving the Scenario:**
   ```
   [ScenarioEditModal] Saving option 0: {
     text: "...",
     feedback_beginner: "actual feedback text",  // Should NOT be a UUID
     feedback_intermediate: "...",
     feedback_advanced: "...",
     feedback_video_beginner: { source: "url", url: "..." }  // Video data separate
   }
   ```

### Step 3: Identify Where the Problem Occurs

Look for these warning signs in the console:

#### ⚠️ Bad Sign #1: feedback_type is "string"
```javascript
feedback_type: "string"  // BAD - should be "object"
```

This means the feedback object is being replaced with a string value.

#### ⚠️ Bad Sign #2: feedback_beginner contains a UUID
```javascript
feedback_beginner: "e6f53a46-55ac-43ad-955a-f0cf8b3eb63c"  // BAD - should be text
```

This means a UUID (probably from a video library ID or file ID) is being written to the feedback field.

#### ⚠️ Bad Sign #3: UUID Detection Warning
```
WARNING: Option abc123 has UUID in feedback field! This indicates data corruption.
```

This means the data was saved with UUIDs in the feedback fields.

### Step 4: Check Video Input Components

The issue might be related to how video inputs are being handled. Check if:

1. **When selecting a video from the library**, does the feedback text field change?
2. **When uploading a video file**, does the feedback text field get overwritten?
3. **When changing video sources** (URL → Library → Upload), do feedback fields stay intact?

### Step 5: Check the Network Tab

1. Open **Network** tab in Developer Tools
2. Create/edit a scenario and save it
3. Find the POST request to `scenario_options`
4. Check the **Payload** tab to see what's actually being sent:

```json
{
  "scenario_id": "...",
  "option_text": "...",
  "feedback_beginner": "This should be readable text, NOT a UUID",
  "feedback_video_url_beginner": "https://...",
  "feedback_video_library_id_beginner": "e6f53a46-...",  // UUID should be HERE
  "..."
}
```

**The UUID should ONLY appear in the video-related fields, NEVER in `feedback_beginner/intermediate/advanced`.**

## Common Causes and Solutions

### Cause 1: Video Library ID Being Written to Feedback Field

**Symptom:** When you select a video from the library, the feedback text changes to a UUID.

**Fix:** Check that the VideoInputSelectorWithLibrary component is calling:
```javascript
onChange={(input) => updateOption(index, 'feedback_video_beginner', input)}
// NOT
onChange={(input) => updateOption(index, 'feedback_beginner', input)}  // WRONG!
```

### Cause 2: updateOption Function Mixing Up Fields

**Symptom:** Console shows the correct value being passed, but wrong field gets updated.

**Fix:** Check the `updateOption` function logs to see if the `field` parameter is correct.

### Cause 3: Database Has Corrupted Data

**Symptom:** When loading an existing scenario, feedback fields already contain UUIDs.

**Fix:** You need to manually fix the database:
1. Run `node diagnose-feedback-issue.mjs` to identify corrupted records
2. Edit each affected scenario through the admin interface
3. Re-enter the correct feedback text
4. Save (the new validation will prevent saving UUIDs)

### Cause 4: Form State Initialization Issue

**Symptom:** The form loads with UUIDs already in the feedback fields.

**Fix:** Check the ScenarioEditModal initialization logs:
```javascript
[ScenarioEditModal] Loading option 0: {
  feedback_beginner: "..."  // If this is a UUID, the problem is in how the scenario is loaded
}
```

## Quick Fix for Immediate Use

If you need an immediate workaround while debugging:

1. **Always double-check feedback text before saving:**
   - Before clicking "Save", visually inspect each feedback textarea
   - If you see a UUID, delete it and re-type the feedback text
   - The new validation will warn you if UUIDs are detected

2. **Use the diagnostic script regularly:**
   ```bash
   node diagnose-feedback-issue.mjs
   ```
   This will help you catch corrupted data early.

3. **Check browser console for warnings:**
   - Any UUID detection will be logged with details
   - Look for patterns in when UUIDs appear

## Reporting the Issue

If you continue to see the problem, please provide:

1. **Console logs** from when you create/edit a scenario
2. **Network payload** from the save request
3. **Output** from `diagnose-feedback-issue.mjs`
4. **Steps to reproduce** - exactly what you clicked and when the UUID appeared

With this information, I can pinpoint the exact location where the feedback field is being corrupted.

## Prevention

The code now includes:
- ✅ Validation that prevents saving UUIDs in feedback fields
- ✅ Type guards that handle corrupted data gracefully
- ✅ Comprehensive logging to track data flow
- ✅ Warning messages when UUIDs are detected

These protections will help prevent the issue from recurring and make debugging easier if it does happen.
