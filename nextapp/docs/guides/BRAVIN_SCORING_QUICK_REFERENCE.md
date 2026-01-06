# BRAVIN Scoring Fix - Quick Reference

## What Was Fixed

### The Problem
- Learner assignment card showed 42% instead of correct BRAVIN simulation score
- "Start Your BRAVIN Journey" message appeared even after completing simulations
- Assignment scores not updating properly on completion
- Database function trying to access non-existent column

### The Solution
- Fixed database score calculation to properly compute BRAVIN scores from dimension impacts
- Automated assignment score synchronization when simulations complete
- Ensured assignment-instance connection throughout simulation lifecycle
- Made database-calculated scores the single source of truth

## Score Calculation Formula

### BRAVIN Score (0-100%)
```
Average of 6 dimension impacts per decision
→ Convert from -100/+100 scale to 0-100% scale
→ Formula: 50 + (average_impact / 2)
```

### Final Score
```
If BRAVIN and Metrics exist:
  60% BRAVIN + 40% Metrics
Else if only BRAVIN:
  100% BRAVIN
Else if only Metrics:
  100% Metrics
```

## How It Works Now

### When Starting Assignment
1. Click assignment → Navigate with assignmentId in URL
2. SimulationPlayer creates instance
3. Database function links assignment to instance
4. Simulation tracks to assignment automatically

### When Completing Simulation
1. Reach closing page
2. Database calculates all scores (BRAVIN + Metrics)
3. Updates simulation_instances table
4. Automatically updates assignment_learners
5. Best score = highest score across all attempts

## Key Changes

### Database Functions
- `calculate_final_scores()` - Fixed to use dimension impacts
- `sync_assignment_score()` - New function to update assignments
- `complete_simulation_instance()` - Enhanced to sync assignments
- `link_assignment_to_instance()` - New function to link on start

### Frontend Components
- `SimulationClosingPage` - Uses database completion function
- `SimulationPlayer` - Links assignments properly
- `LearnerDashboard` - Passes assignment ID, displays rounded scores

## Verification Steps

1. **Check Assignment Card**
   - Should show best_score only if > 0
   - Score should be rounded (no decimals)
   - Should update after completing simulation

2. **Check BRAVIN Journey**
   - "Start Your BRAVIN Journey" only if no assessments exist
   - Should show data after completing BRAVIN simulation

3. **Check Score Consistency**
   - Closing page score = Results page score = Assignment card score
   - All should show the database-calculated final_score

## Troubleshooting

### Score Still Shows 42%
1. Complete simulation again (triggers recalculation)
2. Check if BRAVIN mappings exist in database
3. Verify instance has assessment data

### "No Journey Yet" Still Appears
1. Ensure simulation has BRAVIN scenario mappings configured
2. Check `bravin_decision_assessments` table for data
3. Verify simulation completion ran database function

### Assignment Not Linking
1. Check browser console for linking errors
2. Verify assignmentId in URL when starting
3. Check assignment_learners.current_instance_id in database

## Database Tables Involved

| Table | What It Stores |
|-------|---------------|
| `simulation_instances` | Instance tracking, final_score, bravin_overall_score |
| `bravin_decision_assessments` | Per-decision dimension impacts |
| `learner_metric_assessments` | Metrics scores per decision |
| `assignment_learners` | Assignment status, best_score, current_instance_id |
| `bravin_scenario_option_mappings` | BRAVIN impact configuration |

## Expected Behavior

### First Attempt
- Complete simulation → Score calculated → Assignment shows score
- Journey widgets show initial data
- Results page displays comprehensive breakdown

### Subsequent Attempts
- Complete again → New score calculated
- Best score updates if new score is higher
- Attempt count increments
- Can view any attempt's results

## Data Fix Applied

Migration includes automatic recalculation for:
- Completed instances with final_score = 0
- Instances that have assessment data but no calculated scores
- Processes up to 100 instances per migration run

## Success Indicators

✅ Assignment card shows score after completion
✅ Score is consistent across all views
✅ BRAVIN journey shows data after completing BRAVIN simulation
✅ Multiple attempts track correctly
✅ Best score updates appropriately
✅ Database logs show successful completion

## Need Help?

1. Check console logs during simulation completion
2. Look for RAISE NOTICE messages in database logs
3. Verify assessment data exists in tables
4. Confirm BRAVIN mappings are configured
5. Review BRAVIN_SCORING_FIX_COMPLETE.md for details
