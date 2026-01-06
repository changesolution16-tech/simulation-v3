# Quick Start: Scenario Recovery (5 Minutes)

⏰ **Time Required:** 5-10 minutes
🎯 **Goal:** Save your 13 scenarios to the database permanently

---

## 🚨 BEFORE YOU START

**DO NOT REFRESH YOUR BROWSER YET!**
Your scenarios are only in memory right now.

---

## Step 1: Export (2 minutes)

### Quick Method:

1. **Keep Flow Builder open** (with your 13 scenarios visible)
2. Press `F12` to open DevTools
3. Click the **Console** tab
4. Copy/paste this entire script and press Enter:

```javascript
// Quick Export Script
(function() {
  const exportData = {
    exportDate: new Date().toISOString(),
    scenarios: []
  };

  // Try to extract from React components
  const findScenarios = () => {
    const allElements = Array.from(document.querySelectorAll('*'));

    // Look for scenario titles
    const titles = allElements
      .filter(el => el.textContent.includes('Challenge') && el.textContent.length < 200)
      .map(el => el.textContent.trim())
      .filter((v, i, a) => a.indexOf(v) === i && v.includes(':'));

    return titles;
  };

  const scenarios = findScenarios();
  console.log('Found scenario titles:', scenarios);

  if (scenarios.length > 0) {
    console.log(`✅ Found ${scenarios.length} scenarios!`);
    console.log('📋 Please copy these titles and send them to me:');
    scenarios.forEach((title, i) => {
      console.log(`${i + 1}. ${title}`);
    });
    copy(JSON.stringify(scenarios, null, 2));
    console.log('');
    console.log('✅ Titles copied to clipboard!');
    console.log('Paste them in a message to me.');
  } else {
    console.log('⚠️ Could not auto-detect. Please use React DevTools method.');
  }

  return scenarios;
})();
```

5. **If this works:**
   - You'll see a list of scenario titles in the console
   - They're copied to your clipboard
   - Paste them in a message to me

6. **If this doesn't work:**
   - Go to the full guide: `SCENARIO_EXPORT_AND_MIGRATION_GUIDE.md`
   - Use the React DevTools method (takes 3 more minutes)

---

## Step 2: Wait for My Response (1 minute)

I'll create a migration script with your specific scenario titles and structure.

---

## Step 3: Import to Database (2 minutes)

Once I provide the import script:

1. Save the file I give you
2. Run in terminal:
   ```bash
   node import-scenarios-to-database.mjs
   ```
3. Watch for success messages

---

## Step 4: Verify (1 minute)

1. Run verification:
   ```bash
   node verify-scenarios-in-database.mjs
   ```

2. Should show:
   ```
   ✅ Found 13 scenarios in database
   ```

3. **NOW you can refresh the browser safely!**

---

## Alternative: Manual List Method (Fastest if scripts fail)

If the automated scripts don't work, just tell me:

1. **List of scenario titles** (copy from screen)
2. **Their levels** (0, 1, 2, 3) if visible
3. **Which connects to which** (if you can see)

Example format:
```
Level 0:
- Challenge 1: The Opening Scenario

Level 1:
- Challenge 2A: The Performance Shortcut
- Challenge 2B: Another Option

...
```

I'll manually create the database entries for you!

---

## What If I Already Refreshed?

If you already refreshed and lost the scenarios:

1. Don't panic - check browser history/cache
2. Look for any screenshots you might have taken
3. Check if there's a backup in localStorage:
   - F12 > Application tab > Local Storage
   - Look for any keys related to scenarios
4. Let me know and we'll explore recovery options

---

## After Recovery

Once scenarios are in the database:

1. ✅ Refresh browser - scenarios will load from database
2. ✅ They won't disappear anymore
3. ✅ Other users can see them
4. ✅ Simulations will work properly

---

## Need Help?

Just message me with:
- What step you're on
- What you see (screenshot helps)
- Any error messages

I'll guide you through it! 🚀
