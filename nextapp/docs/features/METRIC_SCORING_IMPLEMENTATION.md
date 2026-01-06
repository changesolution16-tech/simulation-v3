# Metric-Based Competency Assessment System

## Overview

This implementation adds a comprehensive metric-based scoring system that allows scenario creators to assign specific assessment metric scores to each response option. The system automatically calculates competency development based on these metrics and provides detailed feedback to learners.

## Architecture

### Database Schema

#### New Tables

1. **scenario_option_metrics**
   - Links scenario options to assessment metrics with specific score values
   - Stores score descriptions and competency impact overrides
   - Supports metric weighting and primary metric designation
   - Unique constraint: (scenario_id, option_id, metric_id)

2. **learner_metric_assessments**
   - Records metric assessments for each learner decision
   - Stores score achieved, performance level, and threshold pass/fail
   - Links to simulation instances and tracks competencies impacted
   - Includes automatic performance level calculation

#### Helper Functions

1. **get_option_metrics(scenario_id, option_id)**
   - Returns all metrics configured for a specific option
   - Joins with assessment_metrics to get full metric details
   - Orders by primary metric flag and metric name

2. **record_metric_assessment(learner_id, simulation_instance_id, scenario_id, option_id)**
   - Automatically records all metric assessments when learner makes a decision
   - Calculates performance level based on score thresholds
   - Inserts assessment records into learner_metric_assessments table

### Service Layer

#### MetricScoreService (`src/lib/metricScores.ts`)

Key methods:
- `getOptionMetrics()` - Fetch metrics for specific option
- `setOptionMetric()` - Save/update metric score for option
- `removeOptionMetric()` - Remove metric from option
- `bulkSetOptionMetrics()` - Save multiple metrics at once
- `recordMetricAssessments()` - Trigger assessment recording
- `getLearnerMetricAssessments()` - Get learner's assessment history
- `getMetricSummary()` - Calculate aggregate statistics for a metric

### UI Components

#### 1. MetricScoreSelector (`src/components/admin/MetricScoreSelector.tsx`)

**Purpose**: Allows admins to select metrics and assign scores while editing scenario options.

**Features**:
- Browse and select from available assessment metrics
- Assign score values within metric's min/max range
- Add explanatory descriptions for each score
- Mark primary metrics
- Visual indicators for performance levels
- Real-time validation and feedback
- Bulk save capability

**Integration**: Embedded in ScenarioEditModal on each option tab.

#### 2. MetricFeedback (`src/components/simulation/MetricFeedback.tsx`)

**Purpose**: Displays immediate metric-based feedback after learner makes a decision.

**Features**:
- Shows all metrics assessed for the selected response
- Separates strengths demonstrated vs development opportunities
- Visual performance indicators (exemplary, exceeds, meets, below threshold)
- Animated progress bars showing score relative to maximum
- Performance level badges with color coding
- Detailed breakdown of scores and thresholds

**Integration**: Displayed on FeedbackPage after each scenario decision.

#### 3. MetricsSummary (`src/components/simulation/MetricsSummary.tsx`)

**Purpose**: Comprehensive metrics analysis on final results page.

**Features**:
- Aggregates all metric assessments across entire simulation
- Calculates average scores, high/low scores, and pass rates
- Identifies trends (improving, stable, declining)
- Highlights areas of excellence (≥85% average)
- Lists development priorities (<70% average)
- Visual charts and progress bars for each metric
- Statistics: total assessments, overall average, excellence areas

**Integration**: New tab on Results page ("Performance Metrics").

### Flow

#### 1. Creator Workflow

1. Admin opens ScenarioEditModal to edit a scenario
2. On each option tab, MetricScoreSelector component is displayed
3. Click "Add Metric" to select an assessment metric
4. Assign score value (validated against metric min/max)
5. Optionally add description explaining why this score applies
6. Mark as primary metric if it's most important for this response
7. Click "Save Metrics" to persist to database
8. Repeat for all options in the scenario

#### 2. Learner Workflow

**During Scenario:**
1. Learner views scenario and selects a response option
2. QuestionPage captures the selection
3. System calls `MetricScoreService.recordMetricAssessments()`
4. Database function `record_metric_assessment()` is triggered
5. All metrics for selected option are retrieved
6. Assessment records are created in `learner_metric_assessments`
7. Performance levels are calculated automatically

**On Feedback Page:**
1. FeedbackPage loads metric assessments for current decision
2. MetricFeedback component displays:
   - Strengths demonstrated (metrics above threshold)
   - Development opportunities (metrics below threshold)
   - Detailed scores and performance levels
   - Visual indicators and progress bars

**On Results Page:**
1. Results page displays new "Performance Metrics" tab
2. MetricsSummary component loads all assessments for simulation
3. Aggregates data by metric:
   - Average, highest, lowest scores
   - Pass rate (% of times threshold was met)
   - Trend analysis (comparing first half vs second half)
4. Displays:
   - Areas of Excellence (avg ≥85%)
   - All Metrics Performance (sorted by average)
   - Development Priorities (avg <70%)

#### 3. Competency Calculation

Metrics feed into competency development:
1. Each metric can optionally specify competency impacts
2. When assessment is recorded, competency_impacts field is populated
3. System uses metric scores to determine competency growth
4. Competency service updates learner_competencies table
5. Competencies tab on Results page shows cumulative development

## Key Features

### 1. Dynamic Metric Selection
- Creators choose which metrics apply to each response
- Not all responses need the same metrics
- Flexibility to assess different leadership dimensions

### 2. Score-Based Assessment
- Each metric has configurable min/max range
- Creators assign specific score for each response
- Automatic performance level calculation:
  - Below Threshold: < passing_threshold
  - Meets Threshold: ≥ threshold but < 85% of max
  - Exceeds Threshold: ≥ 85% but < 95% of max
  - Exemplary: ≥ 95% of max

### 3. Multi-Dimensional Feedback
- Immediate feedback after each decision
- Progressive disclosure (strengths first, then development areas)
- Cumulative analysis at end of simulation
- Links metrics to competency development

### 4. Visual Excellence
- Color-coded performance indicators
- Animated progress bars
- Performance level badges
- Trend indicators (improving/declining)
- Metric type categorization

### 5. Data Persistence
- All assessments stored in database
- Historical tracking across simulations
- Aggregate statistics and trends
- Instructor/admin access to learner data

## Configuration

### Available Metric Types
- decision_quality
- timing
- critical_thinking
- emotional_intelligence
- communication
- problem_solving
- adaptability
- collaboration
- custom

### Performance Levels
- **Exemplary**: Score ≥ 95% of maximum
- **Exceeds Threshold**: Score ≥ 85% of maximum
- **Meets Threshold**: Score ≥ passing threshold
- **Below Threshold**: Score < passing threshold

### RLS Policies
- Authenticated users can view all metric mappings
- Only admins can create/update/delete metric mappings
- Learners can only view their own assessments
- Instructors can view cohort assessments
- System can insert assessments for authenticated users

## Benefits

### For Creators
- Precise control over assessment dimensions
- Flexibility to measure different aspects per response
- No programming required - UI-based configuration
- Reusable metrics across scenarios

### For Learners
- Clear understanding of performance strengths
- Specific development areas identified
- Visual feedback that's easy to understand
- Motivation through performance level indicators
- Cumulative view of growth over time

### For Organizations
- Standardized assessment framework
- Consistent competency measurement
- Detailed analytics on learner performance
- Data-driven insights for program improvement
- Integration with existing competency framework

## Usage Example

### Scenario: Leadership Conflict Resolution

**Option A: "Address the conflict directly with empathy"**
- Emotional Intelligence: 85/100 (Exceeds Threshold)
- Communication: 90/100 (Exceeds Threshold)
- Decision Quality: 75/100 (Meets Threshold)

**Option B: "Delegate to HR and avoid confrontation"**
- Emotional Intelligence: 45/100 (Below Threshold)
- Communication: 50/100 (Below Threshold)
- Decision Quality: 60/100 (Below Threshold)

**Learner selects Option A:**
- Immediate feedback shows strengths in EI and Communication
- Decision Quality noted as meeting expectations
- Competencies updated based on metric performance
- Results page aggregates with previous assessments

## Future Enhancements

### Potential Additions
1. Custom metric definitions by organization
2. Metric weighting algorithms for competency calculation
3. Comparative analytics (peer benchmarking)
4. Machine learning to suggest optimal metric scores
5. Export functionality for detailed reports
6. Integration with external assessment frameworks
7. Real-time dashboards for instructors
8. Adaptive difficulty based on metric performance

## Technical Notes

### Performance Considerations
- Indexes on learner_id, metric_id, and simulation_instance_id
- Batch loading of metrics for multiple options
- Client-side caching of metric definitions
- Efficient aggregation queries for summary views

### Error Handling
- Validation of score ranges before saving
- Graceful degradation if metrics not configured
- Fallback to competency-only feedback
- Logging of assessment failures

### Testing Recommendations
1. Test metric selection UI with various metric types
2. Verify score validation (min/max enforcement)
3. Test assessment recording during simulation
4. Validate performance level calculations
5. Test aggregate statistics accuracy
6. Verify RLS policies work correctly
7. Test with missing/incomplete metric data

## Migration Path

For existing scenarios without metrics:
1. Metrics are optional - scenarios work without them
2. Add metrics incrementally as scenarios are reviewed
3. Historical data remains valid
4. New assessments use metrics when configured
5. Feedback gracefully handles mixed configurations

## Conclusion

This metric-based scoring system provides a robust, flexible framework for assessing learner performance across multiple dimensions. By allowing creators to define specific metrics and scores for each response, the system delivers precise, actionable feedback that directly maps to competency development. The visual presentation and comprehensive analytics make it easy for learners to understand their progress and for organizations to measure training effectiveness.
