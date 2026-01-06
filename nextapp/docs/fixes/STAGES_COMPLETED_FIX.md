# Stages Completed Display Fix

## Problem
The results page was showing "Stages Completed: 13/13" when the learner only completed 4 scenarios in their branching path. The number 13 represented the total number of scenarios across all possible paths in the simulation, not the actual stages the learner completed.

## Root Cause
The issue stemmed from confusion between different metrics:

1. **`max_stage`**: Maximum hierarchy level in the simulation (0-indexed, e.g., 3 for a 4-stage path)
2. **`stages_completed`**: Highest hierarchy level reached by learner (0-indexed, e.g., 3 means completed through stage 3)
3. **`decision_count`**: Actual number of decisions/scenarios the learner navigated (e.g., 4 decisions)
4. **Total scenarios**: Total count of all scenarios across all branches (e.g., 13 scenarios)

The previous code was adding 1 to `stages_completed` (converting from 0-indexed to 1-indexed) and showing it as a fraction of `max_stage + 1`, but this was displaying stage numbers rather than the count of scenarios completed in the learner's path.

## Solution
Updated both `SimulationClosingPage.tsx` and `Results.tsx` to display the correct metrics:

### Changes in SimulationClosingPage.tsx
- Changed "Stages Completed" to "Scenarios in Your Path"
- Now displays: `{decision_count}/{total_scenarios}` (e.g., "4/13")
- Updated subtitle to clarify: "Unique path through branching simulation"

### Changes in Results.tsx
1. **Stages Completed Card**: Now shows just the `decision_count` (e.g., "4") instead of a fraction
2. **Completion Status Badge**: Changed condition from comparing stage numbers to checking if decisions were made
3. **Stage Progression Indicator**: Now shows all completed decisions (all green) instead of partial progress through stages
4. **Branching Simulation Explanation**: Updated to reference the correct number of decisions made
5. **Simulation Type Card**: Simplified to always show "Branching" for simulations with instance data

## What Learners See Now

### Closing Page
- **Scenarios in Your Path**: 4/13
  - Subtitle: "Unique path through branching simulation"

### Results Page
- **Stages Completed**: 4
  - Shows the number of scenarios navigated in their path
- **Decisions Made**: 4
  - Shows the number of choice points
- **Simulation Type**: Branching
  - Indicates multiple paths were available

### Progression Indicator
- Shows 4 completed stages (all green checkmarks) representing the learner's actual path
- No longer shows incomplete stages that weren't part of their path

## Technical Details

### Data Model
The database correctly stores:
- `decision_count`: Number of scenarios completed by learner (e.g., 4)
- `stages_completed`: Highest stage number reached (0-indexed, e.g., 3)
- `max_stage`: Maximum stage in simulation (0-indexed, e.g., 3)
- `total_scenarios_completed`: Count of unique scenarios visited (e.g., 4)

### Display Logic
- Learner's path progress: Use `decision_count` (actual scenarios navigated)
- Total available content: Use `simulation.scenarios.length` (all scenarios across branches)
- Completion verification: Check `decision_count > 0` instead of comparing stage numbers

## Benefits
1. Clearer communication about branching simulations
2. Learners understand they completed their unique path, not all possible scenarios
3. Accurate representation of progress through their specific journey
4. Consistent metrics across all results pages

## Testing Recommendations
1. Complete a simulation with branching paths
2. Verify the closing page shows correct scenario count (e.g., 4/13)
3. Check that all progression indicators show completed status
4. Confirm explanatory text clarifies the branching nature
5. Test with simulations of different lengths to ensure formula works correctly
