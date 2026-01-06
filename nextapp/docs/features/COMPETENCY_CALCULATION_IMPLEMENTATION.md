# Automated Competency Calculation System - Implementation Complete

## Overview

This implementation creates a comprehensive automated competency calculation system that translates learner metric performance into competency scores using your exact weight matrix specifications.

## What Was Implemented

### 1. Database Schema (Migration: `20251101030000_create_competency_weight_matrix_system.sql`)

Created a hierarchical weight configuration system with three levels:

- **Global Defaults**: Base weight matrix applied across all simulations
- **Simulation Overrides**: Custom weights for specific simulations
- **Scenario Overrides**: Fine-tuned weights for individual scenarios

**Key Tables Created:**
- `competency_metric_weights_global` - Global default weights
- `simulation_competency_weights` - Simulation-level overrides
- `scenario_competency_weights` - Scenario-level overrides
- `learner_competency_assessments` - Individual assessment records with full calculation details
- `learner_competency_history` - Cumulative tracking across all simulations

**Database Functions:**
- `normalize_metric_score()` - Converts raw scores to 0-1 scale using your exact formulas
- `calculate_competency_score()` - Applies weight matrix and determines proficiency level
- `get_effective_weights()` - Resolves weight inheritance (scenario > simulation > global)
- `update_competency_history()` - Aggregates scores across multiple simulations

### 2. Target Competencies & Weight Matrix (Migration: `20251101031000_seed_target_competencies_and_weights.sql`)

**Five Target Competencies Seeded:**

1. **TBR-03: Trust Building & Repair**
   - BRAVIN: 0.3, Trust: 0.5, EI: 0.2, Ethical: 0.0

2. **AC-06: Adaptive Communication**
   - BRAVIN: 0.2, Trust: 0.3, EI: 0.5, Ethical: 0.0

3. **EI-02: Emotional Intelligence**
   - BRAVIN: 0.2, Trust: 0.3, EI: 0.5, Ethical: 0.0

4. **EL-05: Ethical Leadership**
   - BRAVIN: 0.3, Trust: 0.1, EI: 0.1, Ethical: 0.5

5. **VBD-01: Values-Based Decision-Making**
   - BRAVIN: 0.4, Trust: 0.1, EI: 0.1, Ethical: 0.4

### 3. Normalization Formulas

Implemented exact normalization logic for the four core metrics:

```typescript
BRAVIN Alignment (0-10 scale):
  normalized = raw_score / 10

Trust Impact (-2 to +2 scale):
  normalized = (raw_score + 2) / 4

Emotional Intelligence Index (0-5 scale):
  normalized = raw_score / 5

Ethical Decision Quality (0-5 scale):
  normalized = raw_score / 5
```

### 4. Proficiency Level Classification

```
0.00 - 0.29 → Awareness
0.30 - 0.59 → Developing
0.60 - 0.79 → Proficient
0.80 - 1.00 → Advanced
```

### 5. TypeScript Service Layer (`src/lib/competencyCalculation.ts`)

Created `CompetencyCalculationService` with methods for:

- **Normalization**: `normalizeMetricScore()`
- **Calculation**: `calculateCompetencyScore()`
- **All Competencies**: `calculateAllCompetencies()`
- **Recording**: `recordAssessment()` - Stores calculations and updates history
- **History Retrieval**: `getLearnerCompetencyHistory()`
- **Weight Management**: Get/set weights at global, simulation, and scenario levels

### 6. UI Components

#### Weight Matrix Editor (`src/components/admin/CompetencyWeightMatrixEditor.tsx`)

Visual weight matrix editor featuring:
- Editable weight table with all 5 competencies × 4 metrics
- Weight inheritance indicators showing scenario/simulation/global sources
- Live validation showing row totals
- Test calculation tool using sample data
- Reset to defaults functionality
- Proficiency level reference guide

#### Integration Points

**Scenario Editor:**
- Added "Weight Matrix" tab showing scenario-specific weights
- Displays inherited weights from simulation/global levels
- Allows scenario-level overrides

**Simulation Builder:**
- Enhanced "Metrics & Competencies" step
- Shows competency weight matrix for simulation-level defaults
- Displays which scenarios have custom overrides

### 7. Real-Time Calculation Integration (`src/components/simulation/ScenarioFlowEngine.tsx`)

When a learner submits a decision:

1. **Fetch Metric Scores** from `scenario_option_metrics` table
2. **Normalize Scores** using the appropriate formulas
3. **Calculate All Five Competency Scores** using the effective weight matrix
4. **Store Assessment Record** in `learner_competency_assessments`
5. **Update Cumulative History** in `learner_competency_history`

The calculation happens automatically and transparently after every scenario response.

### 8. Cumulative Tracking

Competency scores accumulate across simulations:

- **Running Average**: Weighted toward recent performance
- **Trend Analysis**: Improving, stable, or declining
- **Statistics**: Total assessments, average, highest, lowest scores
- **Growth Tracking**: Score changes and velocity

## Example Calculation

Using your provided test data:

**Input Scores:**
- BRAVIN Alignment: 8/10
- Trust Impact: +1/2
- EI Index: 4/5
- Ethical Quality: 4/5

**Normalized:**
- BRAVIN: 0.8
- Trust: 0.75
- EI: 0.8
- Ethical: 0.8

**TBR-03 Calculation:**
```
Score = (0.8 × 0.3) + (0.75 × 0.5) + (0.8 × 0.2) + (0.8 × 0.0)
      = 0.24 + 0.375 + 0.16 + 0.0
      = 0.775 → Proficient
```

## Testing

Run the validation script to verify calculations:

```bash
node test-competency-calculations.mjs
```

This script:
1. Fetches the seeded competencies and weight matrix
2. Performs calculations using your example scores
3. Compares results against expected values
4. Reports which calculations match

## Key Features

### Flexibility
- Weights can be customized at global, simulation, or scenario levels
- Weight inheritance with clear precedence rules
- Easy reset to defaults at any level

### Transparency
- All calculations stored with full context
- Weight source tracked (global/simulation/scenario)
- Calculation history maintained

### Accuracy
- Database-level calculation functions ensure consistency
- Normalization formulas match your exact specifications
- Proficiency thresholds precisely implemented

### Learner Experience
- Automatic calculation after every response
- No manual intervention required
- Competency growth tracked across all simulations
- Final results show only competency levels (not calculation details)

## Admin Workflow

### Configuring Weights

**Global Level (Affects All Simulations):**
1. Admin dashboard
2. Competency settings
3. Edit global weight matrix

**Simulation Level (Affects All Scenarios):**
1. Edit simulation
2. Go to "Metrics & Competencies" tab
3. Configure weight matrix
4. Weights inherit to all scenarios unless overridden

**Scenario Level (Specific Scenario Only):**
1. Edit scenario
2. Go to "Weight Matrix" tab
3. Override specific weights
4. See inherited values from simulation/global

### Testing Weights

The weight matrix editor includes a test calculator:
1. Shows sample scores (BRAVIN=8, Trust=+1, EI=4, Ethical=4)
2. Click "Calculate Test Results"
3. See resulting competency scores and proficiency levels
4. Adjust weights and recalculate to see impact

## Learner Workflow

1. **Start Simulation**: System creates instance record
2. **Make Decision**: Selects an option in scenario
3. **Automatic Calculation**: System:
   - Fetches metric scores for selected option
   - Normalizes scores
   - Calculates all 5 competency scores using effective weights
   - Records assessment with full details
   - Updates cumulative competency history
4. **Continue**: Process repeats for each scenario
5. **View Results**: Final competency levels displayed (without calculation details)

## Database Queries for Analysis

### View Learner's Competency History
```sql
SELECT
  c.code,
  c.name,
  h.cumulative_score,
  h.current_proficiency_level,
  h.total_assessments,
  h.trend
FROM learner_competency_history h
JOIN competencies c ON c.id = h.competency_id
WHERE h.learner_id = 'learner-uuid'
ORDER BY h.cumulative_score DESC;
```

### View All Assessments for a Simulation
```sql
SELECT
  c.code,
  c.name,
  a.competency_score,
  a.proficiency_level,
  a.bravin_alignment_score,
  a.trust_impact_score,
  a.ei_index_score,
  a.ethical_quality_score,
  a.weight_source
FROM learner_competency_assessments a
JOIN competencies c ON c.id = a.competency_id
WHERE a.learner_id = 'learner-uuid'
  AND a.simulation_instance_id = 'instance-uuid'
ORDER BY a.assessed_at;
```

### Compare Weights Across Levels
```sql
-- Global weights
SELECT
  c.code,
  w.metric_type,
  w.weight,
  'global' as source
FROM competency_metric_weights_global w
JOIN competencies c ON c.id = w.competency_id
WHERE c.code = 'TBR-03';

-- Simulation overrides
SELECT
  c.code,
  w.metric_type,
  w.weight,
  'simulation' as source
FROM simulation_competency_weights w
JOIN competencies c ON c.id = w.competency_id
WHERE w.simulation_id = 'sim-uuid'
  AND c.code = 'TBR-03';

-- Scenario overrides
SELECT
  c.code,
  w.metric_type,
  w.weight,
  'scenario' as source
FROM scenario_competency_weights w
JOIN competencies c ON c.id = w.competency_id
WHERE w.scenario_id = 'scenario-uuid'
  AND c.code = 'TBR-03';
```

## Next Steps

### Immediate
1. Apply migrations to your database
2. Test the weight matrix editor in admin dashboard
3. Configure a test scenario with metric scores
4. Run a simulation and verify calculations

### Future Enhancements
- Visual competency growth charts on learner dashboard
- Competency comparison reports across cohorts
- Export competency data for external systems
- Custom competency frameworks beyond the five targets
- Adaptive weight adjustment based on learning objectives

## Security

All tables have Row Level Security (RLS) enabled:
- Admins can manage weights at all levels
- Learners can view their own assessments and history
- Instructors can view learner competencies for their cohorts
- Weight sources are transparent but configuration is restricted

## Performance

- Calculations use database functions for consistency
- Indexes on learner_id and competency_id for fast queries
- Weight inheritance resolved efficiently with CTEs
- Historical data aggregated incrementally

## Support

The system is fully self-contained and requires no external dependencies beyond Supabase. All calculation logic is in database functions, ensuring consistency regardless of client implementation.

---

**Implementation Status**: ✅ Complete

**Test Status**: Awaiting database migration and validation

**Build Status**: ✅ Passing
