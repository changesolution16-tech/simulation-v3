# Simulation Components Analysis & Migration Plan

## Executive Summary

Analysis of archived Vite simulation components reveals several advanced features and orchestration patterns not yet implemented in the Next.js version. This document identifies feature gaps, proposes implementations, and provides migration guidance.

**Date**: January 18, 2026
**Analysis Scope**: 25 archived components vs 19 current components

---

## Component Inventory

### Missing Components (Critical)

#### 1. ScenarioFlowEngine.tsx (874 lines)
**Purpose**: Central orchestration engine for scenario flow management

**Key Features**:
- Multi-phase flow control (INTRODUCTION → PROMPT → DECISION → FEEDBACK → TRANSITION)
- Decision history tracking
- Competency score aggregation in real-time
- Hierarchy level tracking for progressive scenarios
- Automatic feedback text validation (detects UUID errors)
- Comprehensive debug logging
- Video watched state management per phase
- Handles missing scenarios gracefully with admin guidance

**Next.js Status**: ❌ Not implemented (flow handled by separate route pages)
**Priority**: Medium (current route-based approach works, but less cohesive)

#### 2. Results.tsx (654 lines)
**Purpose**: Comprehensive results dashboard with multi-tab interface

**Key Features**:
- Tabbed interface (BRAVIN, Competencies, Metrics, Skills)
- Multi-attempt history tracking
- Best attempt highlighting
- Attempt comparison functionality
- Session keepalive management
- Instance data validation and fixing
- Aggregate scoring across attempts
- Time-based performance metrics

**Next.js Status**: ⚠️ Partially implemented (basic hub exists, lacks tabs and history)
**Priority**: **HIGH** - Critical for user experience

#### 3. SimulationClosingPage.tsx (557 lines)
**Purpose**: Dedicated closing/completion page with performance summary

**Key Features**:
- Performance tier calculation (excellent/good/developing)
- Percentage score display
- BRAVIN feedback summary integration
- Instance data validation via database functions
- Metric assessment aggregation
- Competency changes summary
- Video-based closing message support
- Detailed assessment toggle

**Next.js Status**: ❌ Not implemented (basic results page exists)
**Priority**: **HIGH** - Provides crucial completion experience

#### 4. SimulationScenario.tsx (595 lines)
**Purpose**: Single scenario orchestrator with phase management

**Key Features**:
- Phase-based state machine (INTRODUCTION → PROMPT → DECISION → FEEDBACK → TRANSITION)
- Video tracking integration
- Video skip/watch state per phase
- Required vs optional video enforcement
- Progress saving per phase
- Integration with video tracking library
- BRAVIN metrics integration per scenario

**Next.js Status**: ❌ Not implemented (handled by route pages)
**Priority**: Low (route-based approach sufficient)

---

## Feature Gaps in Existing Components

### 1. MetricsSummary Component

#### Current (133 lines)
- Basic metric display
- Static score presentation
- Simple category grouping
- Overall score display

#### Archived (335 lines) - Missing Features
- **Trend Analysis**: Tracks improvement/decline/stable patterns across attempts
- **Pass Rate Calculation**: Shows percentage of metrics passed
- **High/Low Score Tracking**: Displays best and worst performances
- **Multiple Assessment Aggregation**: Combines data from multiple attempts
- **API Integration**: Uses MetricScoreService for data fetching
- **Visual Trend Indicators**: TrendingUp/TrendingDown icons
- **Percentile Rankings**: Shows performance relative to thresholds

**Enhancement Required**: ✅ Yes - Add trend analysis and pass rate features

---

### 2. BravinResults Component

#### Current (286 lines)
- Basic dimension display
- Static scoring
- Simple visualizations
- Fixed layout

#### Archived (422 lines) - Missing Features
- **Detailed Breakdown Toggle**: showDetailedBreakdown prop for depth control
- **Trend Indicators**: Shows improvement/decline per dimension
- **Performance Level Badges**: Visual indicators for proficiency
- **Empty State Guidance**: Comprehensive messaging when no data available
- **Admin Configuration Hints**: Guides administrators on setup
- **Historical Comparison**: Compares current vs previous attempts
- **Dimension Score Explanation**: Detailed breakdown of score calculation

**Enhancement Required**: ✅ Yes - Add trend indicators and detailed breakdown

---

### 3. CompetencyFeedback Component

#### Current (127 lines)
- Basic competency display
- Simple impact indication
- Static presentation

#### Archived (203 lines) - Missing Features
- **Previous vs New Score Display**: Shows before/after comparison
- **Level Change Indicators**: Displays proficiency level progression
- **Impact Severity Coloring**: Graduated color scheme based on impact magnitude
- **Impact Labels**: Textual descriptors (Excellent, Strong, Good, etc.)
- **Proficiency Level Names**: Maps levels to meaningful names
- **Description Field Support**: Shows competency change explanations

**Enhancement Required**: ✅ Yes - Add score comparison and level indicators

---

### 4. MetricFeedback Component

#### Current (120 lines)
- Basic metric feedback display
- Simple scoring

#### Archived (231 lines) - Missing Features
- **Score Breakdown**: Detailed explanation of how score was calculated
- **Threshold Indicators**: Visual indicators for pass/fail
- **Historical Performance**: Comparison with previous attempts
- **Feedback Text Formatting**: Rich text support with markdown
- **Category-based Coloring**: Different colors per metric category
- **Performance Recommendations**: Suggestions based on score

**Enhancement Required**: ✅ Yes - Add threshold indicators and score breakdown

---

## New Components to Implement

### 1. Enhanced Results Dashboard (Priority: HIGH)

Create `/simulations/[id]/results/comprehensive/page.tsx`

**Features to implement**:
```typescript
interface EnhancedResultsFeatures {
  // Tabbed Interface
  tabs: ['overview', 'bravin', 'competencies', 'metrics', 'history'];

  // Multi-Attempt Tracking
  attemptHistory: {
    allAttempts: AttemptSummary[];
    bestAttempt: HighlightedAttempt;
    comparisonMode: boolean;
    selectedAttempts: string[];
  };

  // Performance Summary
  performance: {
    overallScore: number;
    percentageScore: number;
    performanceTier: 'excellent' | 'good' | 'developing';
    totalTime: number;
    decisionsCount: number;
  };

  // Visual Analytics
  charts: {
    progressOverTime: LineChart;
    dimensionRadar: RadarChart;
    competencyBars: BarChart;
  };
}
```

---

### 2. Simulation Closing/Completion Page (Priority: HIGH)

Create `/simulations/[id]/complete/page.tsx`

**Purpose**: Provide a celebratory completion experience with comprehensive feedback

**Features**:
- Performance tier badge display (Gold/Silver/Bronze)
- Animated score reveal
- BRAVIN feedback summary card
- Top 3 competencies developed
- Personalized improvement suggestions
- Optional closing video message
- "Continue Learning" recommendations
- Certificate of completion (if applicable)
- Social sharing options
- Retake simulation button

---

## Implementation Roadmap

### Phase 1: Enhanced Results Dashboard (1-2 hours)
1. ✅ Create tabbed interface for results page
2. ✅ Implement attempt history tracking
3. ✅ Add attempt comparison functionality
4. ✅ Integrate with existing result components
5. ✅ Add performance summary card

### Phase 2: Component Enhancements (2-3 hours)
1. ✅ Enhance MetricsSummary with trend analysis
2. ✅ Add detailed breakdown to BravinResults
3. ✅ Implement score comparison in CompetencyFeedback
4. ✅ Add threshold indicators to MetricFeedback

### Phase 3: Closing Experience (1-2 hours)
1. ✅ Create SimulationCompletePage component
2. ✅ Implement performance tier calculation
3. ✅ Add animated score reveal
4. ✅ Integrate closing video support
5. ✅ Add learning recommendations

### Phase 4: Testing & Documentation (1 hour)
1. ✅ Create comprehensive test scenarios
2. ✅ Document all new features
3. ✅ Update user guides
4. ✅ Build verification

---

## API Endpoints Required

### Existing Endpoints (Verify functionality)
- ✅ `GET /api/simulations/[id]` - Fetch simulation details
- ✅ `GET /api/instances/[id]` - Fetch instance data
- ✅ `GET /api/instances/[id]/responses` - Fetch learner responses
- ✅ `GET /api/competencies/learner/[learnerId]` - Fetch competencies

### New Endpoints Needed
- ⚠️ `GET /api/instances/[id]/history` - Fetch all attempts for learner
- ⚠️ `GET /api/instances/[id]/comparison` - Compare multiple attempts
- ⚠️ `GET /api/metrics/[learnerId]/trends` - Fetch metric trends
- ⚠️ `POST /api/instances/[id]/validate` - Validate and fix metrics

---

## Database Considerations

### Required Views/Functions
```sql
-- Calculate performance tier
CREATE OR REPLACE FUNCTION calculate_performance_tier(
  p_instance_id UUID
) RETURNS TEXT AS $$
  -- Returns 'excellent', 'good', or 'developing'
$$ LANGUAGE plpgsql;

-- Get attempt history
CREATE OR REPLACE FUNCTION get_attempt_history(
  p_learner_id UUID,
  p_simulation_id UUID
) RETURNS TABLE (...) AS $$
  -- Returns all attempts with scores
$$ LANGUAGE plpgsql;

-- Validate instance metrics
CREATE OR REPLACE FUNCTION validate_and_fix_instance_metrics(
  p_instance_id UUID
) RETURNS JSONB AS $$
  -- Validates and fixes metric inconsistencies
$$ LANGUAGE plpgsql;
```

---

## Testing Strategy

### Unit Tests
```typescript
describe('EnhancedResults', () => {
  test('displays all tabs correctly');
  test('loads attempt history');
  test('calculates performance tier');
  test('compares multiple attempts');
  test('handles empty state');
});

describe('MetricsSummary', () => {
  test('calculates trends correctly');
  test('displays pass rates');
  test('shows high/low scores');
});

describe('BravinResults', () => {
  test('displays detailed breakdown');
  test('shows trend indicators');
  test('handles missing data');
});
```

### Integration Tests
```typescript
describe('Simulation Flow', () => {
  test('complete simulation end-to-end');
  test('navigate through all result tabs');
  test('compare multiple attempts');
  test('view completion page');
});
```

### Manual Test Scenarios
See SIMULATION_COMPONENTS_TEST_SCENARIOS.md

---

## Migration Notes

### Breaking Changes
- None - All enhancements are additive

### Backward Compatibility
- ✅ Existing routes remain functional
- ✅ Current components work alongside new features
- ✅ Database schema unchanged

### Performance Considerations
- Implement lazy loading for result tabs
- Cache attempt history data
- Optimize metric calculations
- Use React.memo for heavy components

---

## Recommendations

### High Priority (Implement immediately)
1. **Enhanced Results Dashboard** - Significantly improves user experience
2. **Completion Page** - Provides satisfying closure to simulation
3. **Trend Analysis in MetricsSummary** - Enables learning progress tracking

### Medium Priority (Implement next sprint)
1. **Detailed BravinResults breakdown** - Enhances assessment value
2. **Score Comparison in CompetencyFeedback** - Shows growth clearly
3. **Attempt History Tracking** - Enables progress monitoring

### Low Priority (Nice to have)
1. **ScenarioFlowEngine** - Current route-based approach works well
2. **SimulationScenario** - Not needed with route-based architecture
3. **Video Tracking Integration** - Can be added incrementally

---

## Conclusion

The archived Vite components reveal sophisticated features that significantly enhance the learner experience. The most impactful additions are:

1. **Tabbed Results Dashboard** - Better organization and navigation
2. **Completion/Closing Page** - Satisfying simulation conclusion
3. **Trend Analysis** - Shows learner growth over time
4. **Attempt History** - Enables progress tracking
5. **Enhanced Feedback** - More actionable insights

Implementing these features will elevate the simulation platform from functional to exceptional.

---

**Next Steps**: See implementation tasks in todo list
