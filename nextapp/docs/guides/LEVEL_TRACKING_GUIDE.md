# Level-Based Progress Tracking Guide

## Overview

Your simulation system now tracks progress by **hierarchy levels** instead of individual scenarios. This means a learner progressing through 13 scenarios across 4 levels will see "Level 1 of 4", "Level 2 of 4", etc.

## How It Works

### 1. Max Level Calculation

When a simulation instance is created, the system calculates `max_level` by finding the highest `hierarchy_level` value among all scenarios in the simulation:

```typescript
// Example: If scenarios have hierarchy_level values: [0, 0, 1, 1, 2, 2, 3]
// max_level = 3 (the highest value)
// Display shows: "Level X of 4" (because we add 1 to make it 1-indexed)
```

### 2. Level Completion Tracking

As learners progress, the system detects when they move to a new hierarchy level:

- Level 0 → Level 1: `levels_completed` = 1
- Level 1 → Level 2: `levels_completed` = 2
- Level 2 → Level 3: `levels_completed` = 3

### 3. Display Formula

All UI components show:
- **Current Level**: `(current_scenario.hierarchy_level ?? 0) + 1`
- **Total Levels**: `(simulation.max_level ?? 0) + 1`
- **Display**: "Level X of Y"

## Troubleshooting

### Issue: Seeing "Level 1 of 2" instead of expected levels

**Diagnosis Steps:**

1. **Check if scenarios have hierarchy_level set:**
   ```bash
   node diagnose-level-tracking.mjs
   ```

2. **Most common cause:** Scenarios don't have `hierarchy_level` values assigned
   - Solution: Set hierarchy_level on your scenarios (0, 1, 2, 3, etc.)
   - Use the Admin Dashboard → Scenarios → Edit each scenario
   - Or use the Auto-Calculate feature if available

### Issue: "0 levels completed" on results page

**Diagnosis:**

This happens when:
1. The simulation instance wasn't initialized with proper max_level
2. Level transitions aren't being detected
3. The hierarchy_level values aren't set on scenarios

**Solution:**

1. **Ensure scenarios have hierarchy_level set**
   - Each scenario must have a `hierarchy_level` value (0, 1, 2, 3, etc.)
   - Level 0 = root/starting scenarios
   - Level 1 = first decision branch
   - Level 2 = second decision branch
   - And so on...

2. **Check simulation structure**
   - Run the diagnostic script to see actual values
   - Verify that scenarios are properly linked to the simulation
   - Ensure is_end_scenario is marked on terminal nodes

## Setting Hierarchy Levels

### Manual Method

In the Admin Dashboard:
1. Go to Scenarios
2. Click Edit on each scenario
3. Set the "Hierarchy Level" field
4. Save

### Automatic Method (if available)

Some systems can auto-calculate hierarchy levels based on the scenario graph structure.

## Database Schema

### simulation_instances table columns:
- `max_level` (integer): Highest hierarchy level in the simulation (0-indexed)
- `levels_completed` (integer): Current hierarchy level reached by learner (0-indexed)
- `decision_count` (integer): Total number of decisions made

### scenarios table columns:
- `hierarchy_level` (integer): Position in the decision tree (0 = root, 1 = first branch, etc.)
- `is_end_scenario` (boolean): Marks terminal/ending scenarios

## Example Scenario Structure

```
Simulation: "Customer Service Challenge"
- Scenario A (hierarchy_level: 0, is_end_scenario: false) - "Initial Contact"
  ├─ Scenario B (hierarchy_level: 1, is_end_scenario: false) - "Gather Information"
  │  ├─ Scenario D (hierarchy_level: 2, is_end_scenario: false) - "Propose Solution"
  │  │  └─ Scenario G (hierarchy_level: 3, is_end_scenario: true) - "Resolution"
  │  └─ Scenario E (hierarchy_level: 2, is_end_scenario: true) - "Escalate"
  └─ Scenario C (hierarchy_level: 1, is_end_scenario: false) - "Set Expectations"
     ├─ Scenario F (hierarchy_level: 2, is_end_scenario: true) - "Follow-up"
     └─ Scenario H (hierarchy_level: 2, is_end_scenario: true) - "Close"

max_level = 3
Total display: "Level X of 4" (levels 1, 2, 3, 4 in UI)
Scenarios: 8 total
Actual paths completed: 4 (since only one path is taken per playthrough)
```

## Key Points

1. **Hierarchy levels are 0-indexed** in the database but displayed as 1-indexed in the UI
2. **Learners complete levels, not all scenarios** - they follow one path through the branching structure
3. **max_level** represents the deepest level in the simulation, not the number of scenarios
4. **levels_completed** increments only when moving to a higher level, not on every scenario

## Code Locations

- Level tracking logic: `src/components/simulation/ScenarioFlowEngine.tsx`
- Display components: All simulation pages (QuestionPage, FeedbackPage, etc.)
- Analytics: `src/lib/analytics.ts`
- Results display: `src/components/simulation/Results.tsx`

## Running Diagnostics

To diagnose level tracking issues:

```bash
node diagnose-level-tracking.mjs
```

This will show:
- Whether the RPC function exists
- Current simulations and their structure
- Scenario hierarchy levels
- Recent simulation instances with their level data
