# Simulation Features Migration Checklist

## Quick Status Overview

### Pages/Routes
- [x] Landing page
- [x] Intro page (simulation level) - **FIXED TODAY**
- [x] Introduction page (scenario level)
- [x] Question page
- [x] Feedback page
- [ ] **Transition page** ❌ MISSING
- [ ] **Results page** ❌ MISSING
- [ ] **Closing page** ❌ MISSING

### Core Components (20/24 from REMAINING_COMPONENTS.md)
- [x] SimulationLandingPage
- [x] DifficultySelection
- [x] DifficultyLandingPage
- [x] SimulationIntroduction
- [x] TopicSelection
- [x] DecisionTimer (exists but not integrated)
- [x] TransitionPage (exists but no route)
- [x] ResumeSimulationModal (exists but not integrated)
- [x] AlignmentMeetingResults (exists but not integrated)
- [x] BravinFeedbackSummary
- [x] BravinResults (exists but no results page)
- [x] CompetencyFeedback
- [x] CompetencyResults (exists but no results page)
- [x] MetricFeedback
- [x] MetricsSummary
- [x] LearnerPathVisualization
- [x] VideoPlayer (exists but needs enhancement)

### Services/Utilities
- [ ] **Simulation Completion Service** ❌ MISSING
- [ ] **Session Keepalive Manager** ❌ MISSING
- [ ] **Translation Helpers** ❌ PARTIALLY MISSING
- [ ] **Assignment Linking Logic** ❌ MISSING

### Database Functions
- [ ] **link_assignment_to_instance RPC** ❌ MISSING

---

## Critical Missing Features (Breaks Core Flow)

### 1. Transition Page
**Impact**: HIGH - Breaks scenario flow when transition videos exist
**Files Needed**:
- Create: `/src/app/(dashboard)/simulations/[id]/scenario/[scenarioId]/transition/page.tsx`
**Component**: Already exists at `/src/components/simulation/TransitionPage.tsx`

### 2. Results Page
**Impact**: HIGH - Users cannot see final scores
**Files Needed**:
- Create: `/src/app/(dashboard)/simulations/[id]/results/page.tsx`
**Components to integrate**:
- `BravinResults.tsx`
- `CompetencyResults.tsx`
- `MetricsSummary.tsx`
- `LearnerPathVisualization.tsx`

### 3. Simulation Completion Service
**Impact**: HIGH - Scores not calculated, instances not marked complete
**Files Needed**:
- Create: `/src/lib/simulationCompletion.ts`
**Functions needed**:
- `completeSimulation(instanceId)` - Mark complete, calculate scores
- Score aggregation logic
- Assignment completion updates

### 4. Assignment Linking
**Impact**: HIGH - Assignment tracking broken
**Location**: `/src/app/(dashboard)/simulations/[id]/play/page.tsx`
**Add**: Assignment linking logic with RPC fallback

---

## Important Enhancements (Degrades UX)

### 5. AlignmentMeetingResults Integration
**Impact**: MEDIUM - Special scenario scoring not shown
**Location**: `/src/app/(dashboard)/simulations/[id]/scenario/[scenarioId]/feedback/page.tsx`
**Add**: Conditional rendering for "Alignment Meeting" scenarios
```tsx
{scenario.title === 'The Alignment Meeting' && (
  <AlignmentMeetingResults
    scenarioId={scenario.id}
    optionId={selectedOption.id}
    learnerId={session.user.id}
    simulationInstanceId={instanceId}
  />
)}
```

### 6. VideoPlayer Enhancement
**Impact**: MEDIUM - Videos don't play correctly for all sources
**Location**: `/src/components/simulation/VideoPlayer.tsx`
**Add**:
- Vimeo embed support
- Better completion detection for embeds
- Proper onComplete/onSkip callbacks integration

### 7. Translation Helpers
**Impact**: MEDIUM - Breaks multilingual support
**Files Needed**:
- Create: `/src/lib/translationHelpers.ts`
**Functions**:
- `getScenarioOptionFeedback(option, difficulty, language)`
- `getScenarioTitle(scenario, language)`
- `getScenarioDescription(scenario, language)`
- UUID validation

### 8. Session Keepalive
**Impact**: MEDIUM - Users timeout during long simulations
**Files Needed**:
- Create: `/src/lib/sessionKeepalive.ts`
**Add to**: All simulation pages (start in intro, stop in results)

### 9. DecisionTimer Integration
**Impact**: MEDIUM - Timer feature not working
**Location**: `/src/app/(dashboard)/simulations/[id]/scenario/[scenarioId]/question/page.tsx`
**Add**: Conditional rendering when `scenario.show_timer === true`

---

## Configuration Fields to Check

### Current Implementation
- [x] `introduction_page_enabled` - Used in play page ✅
- [x] `difficulty` - Used throughout ✅
- [x] Scenario `introduction_video_url` - Used ✅
- [x] Option `feedback` - Used ✅

### Missing Checks
- [ ] `closing_page_enabled`
- [ ] `closing_page_show_before_results`
- [ ] `closing_page_video_url`
- [ ] `show_timer_in_feedback`
- [ ] `timerDisplayLocation` ('question_page' | 'feedback_page' | 'all')
- [ ] `timer_duration_seconds`
- [ ] `is_exit_point` (scenario flag)
- [ ] `character_name`
- [ ] `character_description`
- [ ] `category_id` and category names

---

## Data Structure Issues

### Scenario Access Inconsistency
**Problem**: Mixed patterns for accessing scenario data
```typescript
// Pattern 1 (from Vite, more robust)
const scenarioData = simScenario.scenarios;

// Pattern 2 (current Next.js, inconsistent)
const scenarioData = scenario.scenarios || scenario;
```
**Fix**: Standardize to one pattern across all pages

### Feedback Access
**Multiple formats**:
- `option.feedback[difficulty]` - Object format
- `option.feedback_text` - Flat format
- `option.feedbackVideos[difficulty]` - Video URLs
- `option.feedback_video_url` - Single video
**Fix**: Use translation helper to normalize

---

## Quick Implementation Guide

### Phase 1: Fix Critical Flow (2-3 hours)
```bash
# 1. Create transition page
touch src/app/(dashboard)/simulations/[id]/scenario/[scenarioId]/transition/page.tsx

# 2. Create results page
touch src/app/(dashboard)/simulations/[id]/results/page.tsx

# 3. Create completion service
touch src/lib/simulationCompletion.ts

# 4. Update feedback page routing
# Add transition page redirect when transition video exists

# 5. Update play page
# Add assignment linking logic
```

### Phase 2: Enhance Features (3-4 hours)
```bash
# 6. Create translation helpers
touch src/lib/translationHelpers.ts

# 7. Integrate AlignmentMeetingResults
# Update feedback page

# 8. Enhance VideoPlayer
# Add Vimeo/embed support

# 9. Create session keepalive
touch src/lib/sessionKeepalive.ts

# 10. Integrate DecisionTimer
# Update question page
```

### Phase 3: Configuration & Polish (2-3 hours)
```bash
# 11. Create closing page
touch src/app/(dashboard)/simulations/[id]/closing/page.tsx

# 12. Add configuration checks
# Update all pages to respect timer/closing config

# 13. Add character/category display
# Update introduction pages

# 14. Standardize data access
# Refactor scenario data access patterns
```

---

## API Endpoints Status

### Existing (Working)
- [x] GET `/api/simulations/:id`
- [x] GET `/api/scenarios/:id`
- [x] POST `/api/simulations/:id/instances`
- [x] POST `/api/instances/:id/responses`
- [x] GET `/api/instances/:id/responses`
- [x] PATCH `/api/instances/:id`

### Need Enhancement
- [ ] POST `/api/instances/:id/complete` - Add completion logic
- [ ] POST `/api/instances/:id/link-assignment` - Add assignment linking

### Database Functions Needed
- [ ] `link_assignment_to_instance(p_assignment_learner_id, p_instance_id)`
- [ ] `calculate_simulation_scores(p_instance_id)` (if needed)

---

## Testing Scenarios

### End-to-End Flow Tests
1. [ ] Start simulation → See intro → Answer question → See feedback → Transition → Next scenario → Complete → See results
2. [ ] Start from assignment → Complete → Assignment marked complete
3. [ ] Resume in-progress simulation
4. [ ] Complete "Alignment Meeting" scenario → See special results
5. [ ] Simulation with timer → Timer appears and functions
6. [ ] Simulation with closing page → Closing page appears
7. [ ] Multilingual simulation → All text translates correctly

### Edge Cases
8. [ ] No transition video → Skip directly to next scenario
9. [ ] No next scenario → Mark complete and show results
10. [ ] Exit point scenario → Force completion
11. [ ] Session timeout during simulation → Keepalive prevents
12. [ ] Video autoplay blocked → Manual play button works
13. [ ] Embedded video (YouTube/Vimeo) → Completion detected

---

## Progress Tracking

**Current Status**: 83% (from REMAINING_COMPONENTS.md)
**After Phase 1**: ~90% (critical flow complete)
**After Phase 2**: ~95% (full feature parity)
**After Phase 3**: ~100% (polished production-ready)

---

**Last Updated**: 2025-01-15
**Next Action**: Implement Phase 1 - Critical Flow (transition page, results page, completion service)
