# Multi-Attempt Tracking Implementation

## Overview

This implementation adds comprehensive support for tracking multiple simulation attempts per learner, automatically calculating scores, and displaying the highest scoring attempt on the results page.

## Problem Solved

Previously, the system had issues with:
- Learner results not being saved properly in the database
- No tracking of multiple attempts per simulation
- Scores showing as zero when viewing results
- No way to compare performance across different attempts

## Solution Components

### 1. Database Schema Enhancements

**New Columns Added to `simulation_instances` table:**
- `attempt_number` (integer) - Sequential attempt number (1, 2, 3, ...)
- `final_score` (numeric) - Overall performance score (0-100)
- `bravin_overall_score` (numeric) - BRAVIN assessment score (0-100)
- `metrics_average_score` (numeric) - Average competency metrics score (0-100)
- `is_best_attempt` (boolean) - Flag indicating the highest scoring attempt

### 2. Automatic Attempt Number Assignment

A database trigger automatically assigns the next attempt number when a new simulation instance is created:

```sql
CREATE TRIGGER trigger_set_attempt_number
  BEFORE INSERT ON simulation_instances
  FOR EACH ROW
  EXECUTE FUNCTION set_attempt_number_on_insert();
```

### 3. Score Calculation Functions

**`calculate_final_scores(instance_id)`**
- Calculates BRAVIN overall score from bravin_decision_assessments
- Calculates average metrics score from learner_metric_assessments
- Computes weighted final score (60% BRAVIN, 40% Metrics)
- Updates the simulation_instances record with all scores

**`complete_simulation_instance(instance_id)`**
- Marks simulation as completed
- Calls calculate_final_scores to compute all scores
- Updates the is_best_attempt flag for all attempts
- Returns completion status and scores

**`update_best_attempt_flag(learner_id, simulation_id)`**
- Identifies the highest scoring attempt for a learner-simulation pair
- Clears all is_best_attempt flags
- Sets the flag on the highest scoring attempt

### 4. Query Functions

**`get_best_simulation_attempt(learner_id, simulation_id)`**
- Returns the highest scoring completed attempt
- Includes all scores, metadata, and timestamps
- Used by the Results page to display best performance

**`get_all_simulation_attempts(learner_id, simulation_id)`**
- Returns all attempts (completed and in-progress)
- Ordered by attempt number (newest first)
- Used for attempt history display

### 5. Frontend Changes

**SimulationCompletionService (`src/lib/simulationCompletion.ts`)**
- New service for managing simulation completion
- Methods for:
  - Completing simulations
  - Fetching best attempts
  - Fetching all attempts
  - Comparing attempts
  - Recalculating scores

**FeedbackPage Updates**
- Detects when simulation is complete (exit point or no next scenario)
- Calls `SimulationCompletionService.completeSimulation()` automatically
- Ensures scores are calculated before navigating to results

**Results Page Enhancements**
- Fetches best attempt automatically using `get_best_simulation_attempt()`
- Displays attempt number and "Best Score" badge
- Shows final score, BRAVIN score, and metrics score prominently
- Includes attempt history panel with all previous attempts
- Allows viewing different attempts (UI prepared, full implementation ready)

### 6. Automatic Score Calculation

When a simulation is completed:
1. System calls `complete_simulation_instance(instance_id)`
2. Function calculates BRAVIN score from all decision assessments
3. Function calculates metrics score from all metric assessments
4. Weighted final score is computed and stored
5. Best attempt flag is updated across all attempts
6. Results page shows the calculated scores

## Data Flow

### Starting a Simulation
1. User clicks to start simulation
2. `SimulationPlayer` creates new `simulation_instances` record
3. Trigger automatically assigns `attempt_number` (1, 2, 3, ...)
4. Instance ID is stored in session state
5. User navigates to first scenario

### During Simulation
1. User makes decisions at each scenario
2. `QuestionPage` saves decision to `learner_responses` with instance_id
3. Database trigger updates `decision_count` automatically
4. Metrics and BRAVIN assessments are recorded
5. Progress is tracked in real-time

### Completing Simulation
1. `FeedbackPage` detects exit point or no next scenario
2. Calls `SimulationCompletionService.completeSimulation(instanceId)`
3. Database function calculates all scores:
   - BRAVIN: Average of alignment_score from bravin_decision_assessments
   - Metrics: Average of score_achieved from learner_metric_assessments
   - Final: Weighted combination (60% BRAVIN + 40% Metrics)
4. Status changed to 'completed'
5. Best attempt flag updated for all attempts
6. User navigates to results page

### Viewing Results
1. `Results` page loads
2. Fetches all attempts using `get_all_simulation_attempts()`
3. Fetches best attempt using `get_best_simulation_attempt()`
4. Displays best attempt by default with scores
5. Shows "Best Score" badge if is_best_attempt is true
6. Lists previous attempts in collapsible history panel
7. Passes selected instance_id to BRAVIN and Metrics components

## Key Features

### Multi-Attempt Support
- Learners can retake simulations multiple times
- Each attempt is tracked separately with unique attempt number
- System automatically identifies and displays best performance
- Complete history of all attempts is maintained

### Automatic Score Calculation
- No manual score entry required
- Scores calculated from actual assessment data
- Weighted scoring balances different assessment types
- Real-time updates ensure data accuracy

### Best Attempt Display
- Results page shows highest scoring attempt by default
- Clear visual indicator (badge) for best attempt
- Easy comparison between different attempts
- Attempt history accessible with one click

### Data Integrity
- All scores saved automatically on completion
- Database triggers ensure data consistency
- No zero scores for completed simulations
- Validation functions available for data recovery

## Testing

To test the implementation:

1. **Start a new simulation**
   - Verify instance_id is created immediately
   - Check that attempt_number is set to 1 (or next number)

2. **Complete the simulation**
   - Make decisions through all scenarios
   - Verify navigation to results page
   - Check that final_score is calculated (not zero)

3. **View results**
   - Confirm scores are displayed correctly
   - Verify attempt number is shown
   - Check for "Best Score" badge

4. **Take the simulation again**
   - Start the same simulation a second time
   - Verify attempt_number increments to 2
   - Complete with different choices
   - View results and compare scores

5. **Check attempt history**
   - Click "View All Attempts" button
   - Verify both attempts are listed
   - Confirm best attempt is marked correctly
   - Check that highest score is displayed by default

## Database Functions Reference

### Completion Functions
- `complete_simulation_instance(instance_id)` - Mark as completed and calculate scores
- `calculate_final_scores(instance_id)` - Calculate and store all scores
- `update_best_attempt_flag(learner_id, simulation_id)` - Update best attempt marker

### Query Functions
- `get_best_simulation_attempt(learner_id, simulation_id)` - Get highest scoring attempt
- `get_all_simulation_attempts(learner_id, simulation_id)` - Get all attempts
- `get_next_attempt_number(learner_id, simulation_id)` - Calculate next attempt number

### Utility Functions
- `recalculate_all_instance_scores()` - Recalculate scores for all instances (admin tool)

## Permissions

All functions are granted to `authenticated` role:
```sql
GRANT EXECUTE ON FUNCTION complete_simulation_instance TO authenticated;
GRANT EXECUTE ON FUNCTION get_best_simulation_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_simulation_attempts TO authenticated;
-- ... etc
```

## Migration File

Location: `supabase/migrations/20251105070000_add_multi_attempt_tracking.sql`

The migration includes:
- Schema changes (new columns)
- Trigger definitions
- Function definitions
- Permission grants
- Data backfill for existing records

## Future Enhancements

Potential improvements for future iterations:

1. **Attempt Comparison View**
   - Side-by-side comparison of two attempts
   - Diff view showing different choices
   - Performance trends across attempts

2. **Attempt Analytics**
   - Average score across all attempts
   - Improvement percentage
   - Time to complete each attempt
   - Most improved metrics

3. **Attempt Limits**
   - Configure max attempts per simulation
   - Cooldown period between attempts
   - Unlock conditions for retakes

4. **Export Attempt History**
   - Download PDF report of all attempts
   - CSV export for external analysis
   - Share results with instructors

## Troubleshooting

### Scores showing as zero
- Check that simulation was marked as completed
- Verify learner_responses were saved with correct instance_id
- Run `calculate_final_scores(instance_id)` manually to recalculate
- Check that assessments exist in bravin_decision_assessments or learner_metric_assessments

### Attempt number not incrementing
- Verify trigger `trigger_set_attempt_number` is active
- Check that learner_id and simulation_id match exactly
- Ensure previous attempt was completed (not abandoned)

### Best attempt flag not set
- Run `update_best_attempt_flag(learner_id, simulation_id)` manually
- Verify at least one attempt has status='completed'
- Check that final_score is calculated (not NULL or 0)

## Summary

This implementation ensures that:
- ✅ All learner results are saved to the database
- ✅ Multiple attempts are tracked with unique numbers
- ✅ Scores are calculated automatically on completion
- ✅ Best attempt is identified and displayed prominently
- ✅ Complete attempt history is available for review
- ✅ System handles data integrity and consistency
- ✅ Results page shows accurate, up-to-date scores
