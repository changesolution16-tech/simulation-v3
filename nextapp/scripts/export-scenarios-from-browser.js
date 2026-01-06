/**
 * BROWSER CONSOLE SCRIPT TO EXPORT SCENARIOS
 *
 * INSTRUCTIONS:
 * 1. Open the Flow Builder in your browser (Admin Dashboard > Flow Builder)
 * 2. Open browser DevTools (F12 or right-click > Inspect)
 * 3. Go to the Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to execute
 * 6. The script will download a JSON file with all your scenarios
 *
 * This will export all scenarios currently visible in the Flow Builder,
 * including their connections, hierarchy levels, and all metadata.
 */

(function exportScenarios() {
  console.log('🔍 Starting scenario export...');

  // Try to find React Fiber nodes to access component state
  function findReactState() {
    // Method 1: Try to find the canvas/container element
    const canvas = document.querySelector('[class*="canvas"]') ||
                   document.querySelector('[class*="flow"]') ||
                   document.querySelector('div[style*="overflow"]');

    if (!canvas) {
      console.error('❌ Could not find Flow Builder canvas element');
      return null;
    }

    // Method 2: Access React Fiber from DOM element
    const fiberKey = Object.keys(canvas).find(key =>
      key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
    );

    if (fiberKey) {
      let fiber = canvas[fiberKey];

      // Traverse up to find the component with scenarios state
      let attempts = 0;
      while (fiber && attempts < 50) {
        const state = fiber.memoizedState;
        const props = fiber.memoizedProps;

        // Look for nodes/scenarios in state
        if (state) {
          let current = state;
          while (current) {
            if (current.memoizedState && Array.isArray(current.memoizedState)) {
              const data = current.memoizedState;
              // Check if this looks like scenario data
              if (data.length > 0 && data[0].title && data[0].options) {
                console.log('✅ Found scenarios in React state!');
                return data;
              }
            }
            current = current.next;
          }
        }

        fiber = fiber.return;
        attempts++;
      }
    }

    console.log('⚠️ Could not find scenarios in React Fiber, trying alternative methods...');
    return null;
  }

  // Method 3: Look for scenarios in window/global scope (if exposed)
  function findInGlobalScope() {
    // Check if scenarios are exposed anywhere
    if (window.__SCENARIOS__) return window.__SCENARIOS__;
    if (window.scenarios) return window.scenarios;
    return null;
  }

  // Try to extract scenarios
  let scenarios = findReactState() || findInGlobalScope();

  if (!scenarios || scenarios.length === 0) {
    console.error('❌ No scenarios found in browser state');
    console.log('');
    console.log('📋 ALTERNATIVE METHOD:');
    console.log('Please try this instead:');
    console.log('1. In the Flow Builder, check browser DevTools > Components tab (React DevTools)');
    console.log('2. Find the ScenarioFlowBuilder component');
    console.log('3. Look for the "nodes" state');
    console.log('4. Copy the nodes array data');
    console.log('5. Send that data to me');
    return;
  }

  console.log(`✅ Found ${scenarios.length} scenarios!`);

  // Process and structure the data
  const exportData = {
    exportDate: new Date().toISOString(),
    totalScenarios: scenarios.length,
    scenarios: scenarios.map(scenario => ({
      id: scenario.id,
      title: scenario.title,
      description: scenario.description,
      difficulty: scenario.difficulty,
      topicId: scenario.topicId,
      isEndScenario: scenario.isEndScenario,
      hierarchyLevel: scenario.hierarchyLevel,
      autoCalculateLevel: scenario.autoCalculateLevel,
      position: scenario.position,
      contentStatus: scenario.content_status || 'draft',
      options: scenario.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        nextScenarioId: opt.nextScenarioId,
        skillImpact: opt.skillImpact || {},
        feedback: opt.feedback || {
          beginner: '',
          intermediate: '',
          advanced: ''
        }
      }))
    })),
    connections: []
  };

  // Calculate connections
  scenarios.forEach(scenario => {
    scenario.options.forEach(option => {
      if (option.nextScenarioId) {
        const targetScenario = scenarios.find(s => s.id === option.nextScenarioId);
        exportData.connections.push({
          from: scenario.title,
          to: targetScenario?.title || 'Unknown',
          fromId: scenario.id,
          toId: option.nextScenarioId,
          optionText: option.text,
          optionId: option.id
        });
      }
    });
  });

  console.log('');
  console.log('📊 Export Summary:');
  console.log(`   - Total Scenarios: ${exportData.totalScenarios}`);
  console.log(`   - Total Connections: ${exportData.connections.length}`);

  // Show scenarios by level
  const byLevel = {};
  scenarios.forEach(s => {
    const level = s.hierarchyLevel ?? 'unset';
    byLevel[level] = (byLevel[level] || 0) + 1;
  });
  console.log(`   - By Level:`, byLevel);

  // Download as JSON file
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `scenarios-export-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('');
  console.log('✅ Export complete! File downloaded.');
  console.log('📁 Look for: scenarios-export-[timestamp].json in your Downloads folder');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Locate the downloaded JSON file');
  console.log('2. Share it with me or use the migration script to import it');

  return exportData;
})();
