# Scenario Recovery - Quick Reference Card

## 🚨 URGENT: Your 13 Scenarios Need to Be Saved!

Your scenarios exist only in browser memory. Follow these steps to save them permanently.

---

## Three-Step Process

### Step 1: Export From Browser ⏱️ 2 minutes

**Option A: Automated (Try This First)**
```
1. Keep Flow Builder open with scenarios visible
2. Press F12 → Console tab
3. Copy/paste entire content of: export-scenarios-from-browser.js
4. Press Enter
5. Download JSON file
```

**Option B: Manual (If A Fails)**
```
1. Press F12 → ⚛️ Components tab (React DevTools)
2. Find "ScenarioFlowBuilder" component
3. Look for "nodes" state (array with 13 items)
4. Right-click → Copy value
5. Save to scenarios-export.json
```

**Option C: Quick List (Fastest Fallback)**
```
Just tell me:
- List of all scenario titles
- Their levels (0, 1, 2, 3)
- Which connects to which

I'll create the import for you!
```

### Step 2: Import To Database ⏱️ 2 minutes

```bash
node import-scenarios-to-database.mjs
```

Look for:
```
✅ Inserted 13 scenarios
✅ Import complete!
```

### Step 3: Verify ⏱️ 1 minute

```bash
node verify-scenarios-in-database.mjs
```

Should show:
```
✅ Found 13 scenarios in database
✅ Found XX scenario options
```

---

## Files You Need

| File | Purpose | When to Use |
|------|---------|-------------|
| `export-scenarios-from-browser.js` | Extract from browser | Step 1 - in browser console |
| `import-scenarios-to-database.mjs` | Save to database | Step 2 - in terminal |
| `verify-scenarios-in-database.mjs` | Check success | Step 3 - in terminal |

---

## Guides Available

| Guide | Best For | Time |
|-------|----------|------|
| `QUICK_START_SCENARIO_RECOVERY.md` | Fast track | 5 min |
| `SCENARIO_EXPORT_AND_MIGRATION_GUIDE.md` | Complete instructions | 15 min |
| `export-scenarios-manual.md` | Alternative methods | 10 min |
| `SCENARIO_RECOVERY_SUMMARY.md` | Full context | Reference |

---

## Common Issues & Quick Fixes

### "Export script doesn't find scenarios"
→ Use Option B (React DevTools method)

### "Import fails with authentication error"
→ Make sure you're logged in as admin in the app

### "No scenarios appear after import"
→ Check browser console, run verify script

### "I already refreshed the browser!"
→ Check browser history, look for screenshots, tell me what you remember

---

## After Recovery Checklist

- [ ] Run verify script - confirms 13 scenarios in database
- [ ] Refresh Flow Builder - scenarios should load
- [ ] Check connections - verify flow makes sense
- [ ] Create/link simulation
- [ ] Set entry point (Level 0 scenario)
- [ ] Test simulation as learner

---

## Emergency Contact

If stuck, tell me:
1. Which step you're on
2. What error you see
3. Screenshot of current state

I'll help you recover your scenarios! 🚀

---

## ⚠️ REMEMBER

**DO NOT REFRESH BROWSER UNTIL EXPORT IS COMPLETE!**

Once exported, you're safe to:
- ✅ Refresh browser
- ✅ Close browser
- ✅ Restart computer

Your scenarios will be in the database and load automatically.
