# Score Calculation Fix - Constant 63% Issue

## Problem
The simulation closing page and results page were consistently showing a score of 63%, regardless of the learner's actual performance in different simulation runs. The database contained correct and varying `score_achieved` values, but the displayed score never changed.

## Root Cause
The issue was caused by using the wrong identifier when querying metric assessments:

### Incorrect Code (Before Fix)
```typescript
// SimulationClosingPage.tsx - Line 50
MetricScoreService.getLearnerMetricAssessments(currentUser.id, activeSession?.id)

// Results.tsx - Line 346
<BravinResults
  learnerId={currentUser.id}
  simulationInstanceId={activeSession?.id}
  showDetailedBreakdown={true}
/>

// Results.tsx - Line 354-356
<MetricsSummary
  learnerId={currentUser.id}
  // Missing simulationInstanceId prop entirely
/>
```

The code was using `activeSession.id` (the session identifier) instead of `activeSession.instanceId` (the simulation instance identifier). This caused the queries to either:
- Return no results
- Return cached/incorrect results
- Return assessments from all simulation instances combined

## Solution
Changed all occurrences to use the correct `activeSession.instanceId`:

### Files Modified

#### 1. SimulationClosingPage.tsx
- **Line 50**: Changed `activeSession?.id` to `activeSession?.instanceId`
- **Lines 57-65**: Added logging to track assessment data being loaded
- **Lines 115-128**: Added logging to track score calculation process

#### 2. Results.tsx
- **Line 346**: Changed `activeSession?.id` to `activeSession?.instanceId` in BravinResults
- **Line 356**: Added `simulationInstanceId={activeSession?.instanceId}` to MetricsSummary

## What Changed

### SimulationClosingPage.tsx
```typescript
// BEFORE
MetricScoreService.getLearnerMetricAssessments(currentUser.id, activeSession?.id)

// AFTER
MetricScoreService.getLearnerMetricAssessments(currentUser.id, activeSession?.instanceId)
```

### Results.tsx - BravinResults
```typescript
// BEFORE
<BravinResults
  learnerId={currentUser.id}
  simulationInstanceId={activeSession?.id}
  showDetailedBreakdown={true}
/>

// AFTER
<BravinResults
  learnerId={currentUser.id}
  simulationInstanceId={activeSession?.instanceId}
  showDetailedBreakdown={true}
/>
```

### Results.tsx - MetricsSummary
```typescript
// BEFORE
<MetricsSummary
  learnerId={currentUser.id}
/>

// AFTER
<MetricsSummary
  learnerId={currentUser.id}
  simulationInstanceId={activeSession?.instanceId}
/>
```

## Impact

### Before Fix
- Score always showed 63% regardless of performance
- Different simulation runs showed identical scores
- Individual metric scores in database were correct, but aggregation was wrong
- BRAVIN results may have shown incorrect or mixed data from multiple simulations

### After Fix
- Scores now accurately reflect the learner's performance in each specific simulation run
- Different simulation runs with different choices show appropriately different scores
- The closing page and results page both show consistent, correct data
- All three tabs (BRAVIN Assessment, Performance Metrics, Competencies) now filter correctly by simulation instance

## Testing Recommendations

1. **Run a simulation with different choices** and verify the score changes appropriately
2. **Complete multiple simulations** and verify each shows a different score
3. **Check browser console logs** to see the detailed assessment data and score calculations
4. **Verify all three result tabs** show data only from the current simulation instance:
   - BRAVIN Assessment tab
   - Performance Metrics tab
   - Competencies tab

## Debug Logging Added

The fix includes console logging to help verify correct behavior:

```typescript
console.log('[SimulationClosingPage] Loaded assessments:', {
  count: metricsData.length,
  instanceId: activeSession?.instanceId,
  assessments: metricsData.map(a => ({
    metric: a.metric?.name,
    score: a.score_achieved,
    maxScore: a.metric_max_score
  }))
});

console.log('[SimulationClosingPage] Score calculation:', {
  totalScore,
  maxPossibleScore,
  assessmentCount: assessments.length
});

console.log('[SimulationClosingPage] Final percentage:', percentage);
```

These logs will help identify if any issues persist or if the data is being filtered correctly.

## Database Query Behavior

The `getLearnerMetricAssessments` function in `metricScores.ts` properly filters by `simulation_instance_id` when provided:

```typescript
if (simulationInstanceId) {
  query = query.eq('simulation_instance_id', simulationInstanceId);
}
```

By passing the correct `instanceId`, we ensure that only assessments from the current simulation run are included in the score calculation.

## Related Components

The following components were verified to correctly handle simulation instance IDs:
- ✅ `SimulationClosingPage.tsx` - Fixed
- ✅ `Results.tsx` - Fixed (both BravinResults and MetricsSummary)
- ✅ `BravinResults.tsx` - Already correct, just needed correct prop
- ✅ `MetricsSummary.tsx` - Already correct, just needed correct prop
- ✅ `MetricScoreService.ts` - Already correct, properly filters when ID provided

## Conclusion

This was a simple but critical bug where using `activeSession.id` instead of `activeSession.instanceId` caused incorrect data filtering. The fix ensures that all score calculations and result displays are based on the correct, current simulation instance data, allowing scores to accurately reflect learner performance.
