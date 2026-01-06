# Scenario Export and Migration Guide

## Overview

Your 13 scenarios with hierarchy levels 0-3 are currently only in your browser's memory. This guide will help you export them and save them permanently to the database.

## 🚨 CRITICAL: Do Not Refresh the Browser Yet!

Your scenarios exist only in the browser's React component state. If you refresh the page or close the browser, they will be lost!

---

## Step 1: Export Your Scenarios from Browser

### Option A: Automated Browser Console Script (Recommended)

1. **Keep the Flow Builder open** in your browser (you should see all 13 scenarios)

2. **Open Browser DevTools**
   - Press `F12` OR
   - Right-click anywhere and select "Inspect"

3. **Go to the Console tab**

4. **Copy and paste the entire content** of `export-scenarios-from-browser.js` into the console

5. **Press Enter** to execute

6. **Check for the download**
   - A file named `scenarios-export-[timestamp].json` should download
   - If it works, you'll see a success message in the console

7. **If the script works, proceed to Step 2!**

### Option B: Manual Export with React DevTools

If the automated script doesn't work:

1. **Install React Developer Tools** (if not installed)
   - Chrome: [React DevTools Extension](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
   - Firefox: [React DevTools Add-on](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

2. **Open Flow Builder** (make sure you can see all scenarios)

3. **Open React DevTools**
   - Press F12
   - Click the "⚛️ Components" tab

4. **Find ScenarioFlowBuilder**
   - Use the search box or scroll through the component tree
   - Look for `ScenarioFlowBuilder`

5. **Find the nodes state**
   - Click on ScenarioFlowBuilder
   - In the right panel, look for "hooks" or "state"
   - Find an array state called "nodes" (it should have 13 items)

6. **Copy the data**
   - Right-click on the nodes array
   - Select "Copy value" or "Store as global variable"
   - If it stores as `temp1`, go to Console tab and run:
     ```javascript
     copy(JSON.stringify(temp1, null, 2))
     ```

7. **Save to file**
   - Paste into a text editor (VS Code, Notepad++, etc.)
   - Wrap it in this structure:
     ```json
     {
       "exportDate": "2025-01-03T00:00:00Z",
       "totalScenarios": 13,
       "scenarios": [
         /* PASTE YOUR COPIED DATA HERE */
       ],
       "connections": []
     }
     ```
   - Save as `scenarios-export.json` in the project folder

### Option C: Quick List Method

If both methods above fail, do this quickly:

1. **List all scenario titles** you see in the Flow Builder
2. **Note their hierarchy levels** (0, 1, 2, or 3)
3. **Note which scenarios connect to which** (if visible)
4. **Send me this information** and I'll help create the database entries manually

---

## Step 2: Verify Your Export File

Before proceeding, verify your export file:

1. **Open the JSON file** in a text editor

2. **Check these key things:**
   - `totalScenarios` should be 13
   - `scenarios` array should have 13 items
   - Each scenario should have:
     - `title` (e.g., "Challenge 2A: The Performance Shortcut...")
     - `hierarchyLevel` (should be 0, 1, 2, or 3)
     - `options` array (the choices for that scenario)

3. **If everything looks good, continue to Step 3**

---

## Step 3: Import Scenarios to Database

1. **Make sure you have the export file**
   - Place `scenarios-export.json` in the project root folder
   - OR note the full path to the file

2. **Open a terminal** in your project folder

3. **Run the import script:**
   ```bash
   node import-scenarios-to-database.mjs
   ```

   Or if the file is in a different location:
   ```bash
   node import-scenarios-to-database.mjs /path/to/your/scenarios-export.json
   ```

4. **Watch the output**
   - The script will show progress as it imports each scenario
   - It will create connections between scenarios
   - At the end, it will show a summary

5. **Look for success messages:**
   ```
   ✅ Inserted 13 scenarios
   ✅ Import complete!
   📊 Database Summary:
      - Total Scenarios: 13
      - Total Options: XX
   ```

---

## Step 4: Verify in Flow Builder

1. **Refresh your browser** (it's now safe to refresh!)

2. **Go to Admin Dashboard → Flow Builder**

3. **You should see all 13 scenarios:**
   - Challenge scenarios at different levels (0-3)
   - Connections between scenarios preserved
   - Hierarchy levels correctly set

4. **Test the connections:**
   - Click on scenarios to see their options
   - Verify connections lead to the right next scenarios

---

## Step 5: Link Scenarios to Simulation

After scenarios are in the database, you need to link them to a simulation:

1. **Go to Admin Dashboard → Simulations**

2. **Create a new simulation OR edit existing one**

3. **In the "Scenario Flow" step:**
   - Add all 13 scenarios
   - The first one (Level 0) should be set as the entry point
   - Verify the sequence makes sense

4. **Save the simulation**

---

## Troubleshooting

### Export Script Doesn't Work
- Try Option B (React DevTools method)
- Make sure you're on the Flow Builder page with scenarios visible
- Check browser console for any error messages

### Import Script Fails with "Authentication Error"
- Make sure you're logged in as an admin user
- Check that your `.env` file has correct Supabase credentials
- Verify RLS policies allow scenario creation

### Scenarios Don't Appear After Import
- Check browser console for errors
- Verify the import script showed success messages
- Try running this in browser console to check database:
  ```javascript
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    'YOUR_SUPABASE_URL',
    'YOUR_SUPABASE_ANON_KEY'
  );
  const { data } = await supabase.from('scenarios').select('title, hierarchy_level');
  console.log(data);
  ```

### Connections Are Missing
- Verify the export file has correct `nextScenarioId` values in options
- Check that the import script logged successful option creation
- Manually check connections in the database or Flow Builder

---

## Getting Help

If you encounter issues:

1. **Check the error messages** - they often tell you exactly what's wrong

2. **Share with me:**
   - The error message
   - The export JSON file (or relevant parts)
   - What step you're stuck on

3. **Provide context:**
   - What you can see in the Flow Builder currently
   - What the import script output showed
   - Any browser console errors

---

## Prevention: Don't Lose Scenarios Again!

After this is fixed, to prevent losing work in the future:

1. **Always save after creating scenarios** - Look for save/update buttons

2. **Enable browser notifications** - The app should notify when saved

3. **Periodic exports** - Occasionally export your scenarios as backup

4. **Check database** - Verify scenarios persist by refreshing the page

5. **Watch for errors** - If you see error messages when saving, don't ignore them!

---

## Summary Checklist

- [ ] Export scenarios from browser (using one of the three methods)
- [ ] Verify export file has all 13 scenarios
- [ ] Run import script to populate database
- [ ] Check import script shows success
- [ ] Refresh Flow Builder and verify scenarios appear
- [ ] Create/update simulation and link scenarios
- [ ] Set entry point (Level 0 scenario)
- [ ] Test simulation flow

---

## Questions?

If you need help at any step, just let me know where you're stuck and I'll guide you through it!
