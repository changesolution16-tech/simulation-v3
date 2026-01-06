# Manual Scenario Export Instructions

If the browser console script doesn't work, follow these steps to manually export your scenarios:

## Method 1: Using React DevTools

1. **Install React DevTools** (if not already installed)
   - Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

2. **Open Flow Builder**
   - Go to Admin Dashboard
   - Click on "Scenario Flow Builder" or the Flow tab

3. **Open React DevTools**
   - Press F12 to open DevTools
   - Click on the "⚛️ Components" tab (React DevTools)

4. **Find ScenarioFlowBuilder Component**
   - In the component tree, search for "ScenarioFlowBuilder"
   - Click on it to select it

5. **Locate the "nodes" State**
   - On the right side, look for "hooks" or "state"
   - Find the state variable called "nodes" (it should be an array)

6. **Copy the Data**
   - Right-click on the "nodes" array
   - Select "Copy value" or "Store as global variable"
   - If stored as global variable (e.g., `temp1`), go to Console tab and type:
     ```javascript
     copy(temp1)
     ```
   - This copies the data to your clipboard

7. **Save to File**
   - Paste into a text editor
   - Save as `scenarios-export.json`

## Method 2: Using Browser Console

1. **Open Flow Builder** (make sure you can see all 13 scenarios)

2. **Open Browser Console** (F12 > Console tab)

3. **Run this command**:
   ```javascript
   // This will try to extract scenarios from the page
   const extractScenarios = () => {
     // Try to find all scenario nodes on the page
     const scenarioElements = document.querySelectorAll('[data-scenario-id], [class*="scenario"], [class*="node"]');

     console.log('Found elements:', scenarioElements.length);

     // If you can see scenario titles, list them:
     const titles = Array.from(document.querySelectorAll('*')).filter(el =>
       el.textContent.includes('Challenge') && el.textContent.length < 200
     ).map(el => el.textContent.trim()).filter((v, i, a) => a.indexOf(v) === i);

     console.log('Scenario titles found:', titles);

     return titles;
   };

   extractScenarios();
   ```

4. **If you see the titles**, tell me the output and I'll help extract more details

## Method 3: Screenshot and Manual Entry

If all else fails:

1. Take screenshots of the Flow Builder showing:
   - All scenario nodes with their titles
   - The hierarchy levels (0, 1, 2, 3)
   - The connections between scenarios

2. List out the scenario information:
   ```
   Level 0:
   - [Scenario Title]

   Level 1:
   - [Scenario Title] -> connects to: [...]
   - [Scenario Title] -> connects to: [...]

   Level 2:
   - [Scenario Title] -> connects to: [...]
   ...
   ```

3. Share this information with me and I'll create the database entries

## What I Need

At minimum, please provide:
1. All scenario titles
2. Their hierarchy levels (0-3)
3. How they connect to each other (which options lead to which scenarios)

The more detail you can provide, the better I can recreate them in the database!
