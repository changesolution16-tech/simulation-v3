# Real-Time Metrics Tracking and Data Persistence

## Overview

This system implements comprehensive real-time tracking of learner progress, metrics, and scores throughout simulations. All data is saved immediately to the database as learners make decisions, ensuring no progress is lost even if they close their browser or experience connectivity issues.

## Key Principles

### 1. **Save-As-You-Go Architecture**
- Every decision is saved to the database IMMEDIATELY when made
- Metrics are calculated and stored in real-time
- No batch processing or end-of-simulation saves
- Database is the single source of truth, not frontend state

### 2. **Automatic Updates via Database Triggers**
- `learner_responses` INSERT triggers automatic updates to `simulation_instances`
- `decision_count` and `stages_completed` are incremented automatically
- No manual counting or calculation required in application code

### 3. **Data Consistency and Validation**
- Built-in validation functions detect and fix inconsistencies
- Reconciliation functions ensure counts match actual data
- Constraints prevent invalid data (negative counts, stages exceeding max)

## Database Schema

### simulation_instances Table (Enhanced)

```sql
-- Core tracking fields
id uuid PRIMARY KEY
learner_id uuid REFERENCES profiles(id)
simulation_id uuid REFERENCES simulations(id)
status text -- 'in_progress', 'completed', 'abandoned'

-- Real-time progress tracking
decision_count integer DEFAULT 0    -- Auto-incremented by trigger
stages_completed integer DEFAULT 0   -- Auto-updated to highest stage reached
max_stage integer                    -- Set at creation from simulation

-- Session state for resume functionality
current_scenario_id uuid
current_scenario_index integer
session_data jsonb                   -- Complete session state
last_activity_at timestamptz         -- For timeout detection

-- Engagement metrics
total_decision_time_seconds integer
video_watch_time_seconds integer
pause_count integer
resume_count integer

-- Progress tracking
competency_scores jsonb              -- Real-time competency tracking
decision_history jsonb               -- All decisions with timestamps
path_taken uuid[]                    -- Scenario IDs in order

-- Completion
completed_at timestamptz
final_score numeric                  -- Calculated percentage score
```

### Key Indexes

```sql
-- For efficient queries
idx_simulation_instances_learner_status (learner_id, status)
idx_simulation_instances_simulation_status (simulation_id, status)
idx_simulation_instances_last_activity (last_activity_at) WHERE status = 'in_progress'
idx_learner_responses_instance_scenario (instance_id, scenario_id)
```

## Database Functions

### Automatic Update Function

```sql
CREATE FUNCTION update_simulation_instance_on_response()
```

**Triggered by:** INSERT on `learner_responses`
**Purpose:** Automatically updates simulation metrics in real-time

**Updates:**
- Increments `decision_count`
- Updates `stages_completed` to highest stage reached
- Adds to `total_decision_time_seconds`
- Updates `last_activity_at` timestamp

### Validation Functions

#### validate_and_fix_instance_metrics(p_instance_id uuid)

**Purpose:** Ensures all metrics are correct by comparing with actual data
**Returns:** JSONB with old/new values and what was updated
**Usage:** Called before marking simulation as completed

Example:
```typescript
const { data } = await supabase.rpc('validate_and_fix_instance_metrics', {
  p_instance_id: activeSession.instanceId
});
console.log(data); // Shows what was fixed
```

#### reconcile_decision_count(p_instance_id uuid)

**Purpose:** Ensures decision_count matches actual learner_responses count
**Returns:** Table with old count, new count, and whether it was updated

#### recalculate_stages_completed(p_instance_id uuid)

**Purpose:** Recalculates stages from actual learner path
**Returns:** Table with stages visited, max stage, and update status

### Progress Query Function

#### get_simulation_progress(p_learner_id uuid, p_simulation_id uuid)

**Purpose:** Get complete progress information for a learner's session
**Returns:**
- Current status
- Progress metrics
- Time spent
- Can resume flag
- Progress percentage

Example:
```typescript
const { data } = await supabase.rpc('get_simulation_progress', {
  p_learner_id: currentUser.id,
  p_simulation_id: simulationId
});

if (data && data.can_resume) {
  // Show "Resume Simulation" option
}
```

## Frontend Implementation

### QuestionPage.tsx - Decision Recording Flow

```typescript
const handleOptionSelect = async (optionId: string) => {
  // Step 1: Update local state for UI responsiveness
  updateSessionSelectedOption(optionId);
  addSessionDecision(currentScenario.id, optionId);

  // Step 2: CRITICAL - Save to database IMMEDIATELY
  await supabase.from('learner_responses').insert({
    instance_id: activeSession.instanceId,
    scenario_id: currentScenario.id,
    option_id: optionId,
    response_order: activeSession.decisionHistory.length + 1,
    time_to_decision_seconds: decisionTimeSeconds,
    responded_at: new Date().toISOString()
  });
  // Trigger automatically updates simulation_instances

  // Step 3: Update current position for resume
  await supabase.rpc('update_simulation_progress', {
    p_instance_id: activeSession.instanceId,
    p_current_scenario_id: currentScenario.id,
    p_current_stage: currentStage
  });

  // Step 4: Update competency scores
  await CompetencyService.updateLearnerCompetency(...);

  // Step 5: Record metric assessments
  await MetricScoreService.recordMetricAssessments(...);
  await BravinMetricsIntegration.recordBravinMetricAssessments(...);

  // Step 6: Save session state for recovery
  await SessionPersistenceService.saveSessionState(activeSession);

  // Navigate to feedback
  navigate(`/simulation/${simulationId}/scenario/${index}/feedback`);
};
```

### SimulationClosingPage.tsx - Completion Flow

```typescript
const handleContinue = async () => {
  // Validate metrics before completing
  await supabase.rpc('validate_and_fix_instance_metrics', {
    p_instance_id: activeSession.instanceId
  });

  // Mark as completed with final score
  await supabase.from('simulation_instances').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    final_score: percentageScore
  }).eq('id', activeSession.instanceId)
    .eq('status', 'in_progress'); // Only if still in progress

  navigate(`/simulation/results/${simulationId}`);
};
```

### ScenarioFlowEngine.tsx - Alternative Completion

```typescript
const handleComplete = async () => {
  // Validate all metrics
  await supabase.rpc('validate_and_fix_instance_metrics', {
    p_instance_id: instanceId
  });

  // Mark as completed (metrics already correct from real-time updates)
  await supabase.from('simulation_instances').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    competency_scores: competencyScores
  }).eq('id', instanceId)
    .eq('status', 'in_progress');

  onComplete();
};
```

## Data Flow Diagram

```
┌─────────────────┐
│  Learner makes  │
│    decision     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  1. INSERT into learner_responses       │
│     - scenario_id                       │
│     - option_id                         │
│     - time_to_decision_seconds          │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  2. TRIGGER: Auto-update                │
│     simulation_instances:               │
│     - decision_count++                  │
│     - stages_completed = MAX(stages)    │
│     - total_decision_time += time       │
│     - last_activity_at = now()          │
└────────┬────────────────────────────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌──────────────────────┐        ┌───────────────────────┐
│  3a. Update progress │        │  3b. Record metrics   │
│      for resume      │        │      assessments      │
│  - current_scenario  │        │  - metric scores      │
│  - current_stage     │        │  - bravin scores      │
└──────────────────────┘        └───────────────────────┘
         │                                 │
         └────────────┬────────────────────┘
                      │
                      ▼
            ┌───────────────────┐
            │  4. Save session  │
            │     state for     │
            │     recovery      │
            └───────────────────┘
```

## Resume Functionality

### Checking for Existing Session

```typescript
// On simulation start page
const { data: progress } = await supabase.rpc('get_simulation_progress', {
  p_learner_id: currentUser.id,
  p_simulation_id: simulationId
});

if (progress && progress.can_resume) {
  // Show "Resume" button
  // Display progress: ${progress.stages_completed}/${progress.max_stage} stages
}
```

### Restoring Session State

```typescript
const restoredState = await SessionPersistenceService.restoreSessionState(instanceId);

if (restoredState) {
  // Restore Zustand store
  initializeSession(restoredState.simulationId, instanceId);
  updateSessionScenarioIndex(restoredState.currentScenarioIndex);
  updateSessionCompetencyScores(restoredState.competencyScores);
  // ... restore other state

  // Navigate to last scenario
  navigate(`/simulation/${simulationId}/scenario/${currentIndex}`);
}
```

## Error Handling and Recovery

### Network Failure During Save

```typescript
try {
  await supabase.from('learner_responses').insert(response);
} catch (error) {
  console.error('CRITICAL: Failed to save response', error);

  // Option 1: Store in localStorage for retry
  const offline = JSON.parse(localStorage.getItem('offlineResponses') || '[]');
  offline.push({ ...response, timestamp: Date.now() });
  localStorage.setItem('offlineResponses', JSON.stringify(offline));

  // Option 2: Show user notification
  alert('Warning: Your response may not have been saved. Please check your internet connection.');
}
```

### Data Inconsistency Detection

```typescript
// Run periodically or before critical operations
const validationResult = await supabase.rpc('validate_and_fix_instance_metrics', {
  p_instance_id: instanceId
});

if (validationResult.decision_count.was_updated ||
    validationResult.stages_completed.was_updated) {
  console.warn('Data inconsistency detected and fixed:', validationResult);
  // Optionally notify admin
}
```

### Abandoned Session Cleanup

```typescript
// Run via cron job or scheduled task
const { data } = await supabase.rpc('cleanup_abandoned_sessions');

console.log(`Marked ${data.length} sessions as abandoned`);
// All data is preserved for potential recovery
```

## Best Practices

### 1. Always Use Transactions for Related Updates

```typescript
// BAD: Multiple separate updates
await supabase.from('learner_responses').insert(response);
await supabase.from('simulation_instances').update(metrics);
await supabase.from('learner_competencies').update(scores);

// GOOD: Single operation with trigger handling related updates
await supabase.from('learner_responses').insert(response);
// Trigger automatically updates simulation_instances
```

### 2. Validate Before Completion

```typescript
// Always validate before marking complete
await supabase.rpc('validate_and_fix_instance_metrics', {
  p_instance_id: instanceId
});

await supabase.from('simulation_instances').update({
  status: 'completed',
  completed_at: new Date().toISOString()
}).eq('id', instanceId);
```

### 3. Handle Idempotency

```typescript
// Use conditional updates to prevent race conditions
const { data } = await supabase
  .from('simulation_instances')
  .update({ status: 'completed' })
  .eq('id', instanceId)
  .eq('status', 'in_progress') // Only update if still in progress
  .select();

if (!data || data.length === 0) {
  console.log('Simulation already completed');
}
```

### 4. Comprehensive Logging

```typescript
console.log('[Component] ✓ Action successful');  // Success
console.log('[Component] Warning: issue');       // Non-critical
console.error('[Component] CRITICAL: error');    // Critical error
```

## Monitoring and Debugging

### Check Simulation Instance State

```sql
SELECT
  id,
  learner_id,
  simulation_id,
  status,
  decision_count,
  stages_completed,
  max_stage,
  (SELECT COUNT(*) FROM learner_responses WHERE instance_id = si.id) as actual_responses,
  last_activity_at,
  created_at
FROM simulation_instances si
WHERE learner_id = 'user-uuid'
ORDER BY created_at DESC;
```

### Verify Trigger is Working

```sql
-- Check if trigger exists
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'trigger_update_metrics_on_response';

-- Check if function exists
SELECT proname, pronargs
FROM pg_proc
WHERE proname = 'update_simulation_instance_on_response';
```

### Audit Learner Path

```sql
SELECT
  lr.responded_at,
  s.title as scenario_title,
  s.hierarchy_level as stage,
  so.option_text,
  lr.time_to_decision_seconds
FROM learner_responses lr
JOIN scenarios s ON s.id = lr.scenario_id
JOIN scenario_options so ON so.id = lr.option_id
WHERE lr.instance_id = 'instance-uuid'
ORDER BY lr.response_order;
```

## Troubleshooting

### Problem: decision_count not updating

**Check:**
1. Is trigger enabled? `SELECT tgenabled FROM pg_trigger WHERE tgname = 'trigger_update_metrics_on_response';`
2. Are responses being inserted? `SELECT COUNT(*) FROM learner_responses WHERE instance_id = 'uuid';`
3. Check function logs for errors

**Fix:**
```sql
SELECT * FROM reconcile_decision_count('instance-uuid');
```

### Problem: stages_completed is zero

**Check:**
1. Do scenarios have `hierarchy_level` set?
2. Are scenario_ids in learner_responses valid?

**Fix:**
```sql
SELECT * FROM recalculate_stages_completed('instance-uuid');
```

### Problem: Metrics missing after completion

**Check:**
1. Were metric assessments recorded? `SELECT COUNT(*) FROM learner_metric_assessments WHERE simulation_instance_id = 'uuid';`
2. Were Bravin assessments recorded? `SELECT COUNT(*) FROM bravin_decision_assessments WHERE simulation_instance_id = 'uuid';`

**Fix:**
Re-run assessments if data exists:
```typescript
await MetricScoreService.recordMetricAssessments(learnerId, instanceId, scenarioId, optionId);
```

## Migration Notes

### Applying the Migration

```bash
# Migration is automatically applied by Supabase
# File: supabase/migrations/20251105040000_add_realtime_metrics_tracking.sql
```

### Validating Existing Data

After migration, validate all in-progress simulations:

```sql
SELECT * FROM validate_all_active_instances();
```

This will check and fix any inconsistencies in existing simulation instances.

## Performance Considerations

- **Indexes:** All critical query paths are indexed
- **Triggers:** Lightweight and efficient, minimal overhead
- **Batch Operations:** Avoid; prefer individual inserts with trigger handling
- **Caching:** Use `simulationCache` for simulation data, not for metrics
- **Real-time Updates:** Database provides instant consistency

## Summary

This system ensures:
- ✅ No data loss - everything saved immediately
- ✅ Resume capability - learners can stop and continue anytime
- ✅ Accurate metrics - automatic validation and correction
- ✅ Performance - efficient indexing and query patterns
- ✅ Reliability - comprehensive error handling and recovery
- ✅ Maintainability - clear separation of concerns and logging

All metrics and scores are tracked in real-time and saved to the database as the learner progresses through the simulation. The database is the single source of truth, and frontend state is secondary.
