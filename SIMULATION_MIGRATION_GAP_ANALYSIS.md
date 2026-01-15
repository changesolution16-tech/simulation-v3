# Simulation Migration Gap Analysis

## Overview
This document identifies features from the Vite app simulation flow that have not been fully migrated to the Next.js app.

---

## Missing Pages/Routes

### 1. ❌ Transition Page
**Status**: Missing
**Vite Path**: `/simulation/:id/scenario/:index/transition`
**Next.js Path**: Should be `/simulations/[id]/scenario/[scenarioId]/transition`
**Purpose**: Shows transition videos between scenarios before moving to the next scenario
**Component Available**: ✅ Yes - `TransitionPage.tsx` exists in `src/components/simulation/`
**Action Required**: Create page route at `/src/app/(dashboard)/simulations/[id]/scenario/[scenarioId]/transition/page.tsx`

### 2. ❌ Results/Completion Page
**Status**: Missing
**Vite Path**: `/simulation/results/:simulationId`
**Next.js Path**: Should be `/simulations/[id]/results` or `/simulations/results/[id]`
**Purpose**: Final results page showing competency scores, BRAVIN assessment, and overall performance
**Components Available**:
- ✅ `BravinResults.tsx`
- ✅ `CompetencyResults.tsx`
- ✅ `MetricsSummary.tsx`
- ✅ `LearnerPathVisualization.tsx`
**Action Required**: Create results page combining these components

### 3. ❌ Closing Page (Optional)
**Status**: Missing
**Vite Path**: `/simulation/:id/closing`
**Next.js Path**: Should be `/simulations/[id]/closing`
**Purpose**: Optional closing message/video before showing results (configurable via `closing_page_enabled` and `closing_page_show_before_results`)
**Action Required**: Create closing page with conditional video display

---

## Missing Features in Existing Pages

### 4. 🔶 Introduction Page - Missing Video Integration
**Page**: `/simulations/[id]/scenario/[scenarioId]/introduction/page.tsx`
**Missing Features**:
- ❌ Proper video player integration (uses basic `<video>` tag instead of `VideoPlayer` component)
- ❌ Session keepalive management
- ❌ Category name display
- ❌ Character/actor info display
- ❌ Proper translation helpers for multilingual support
- ❌ Progress saving before continuing

**Vite Implementation**:
```typescript
// Uses SynthesiaPlayer component with callbacks
<SynthesiaPlayer
  videoUrl={introductionVideoUrl}
  videoType="introduction"
  onComplete={handleVideoComplete}
  onSkip={handleVideoSkip}
  autoPlay={true}
  allowSkip={true}
/>
```

**Current Next.js**: Basic video tag without proper event handling

### 5. 🔶 Feedback Page - Missing Components Integration
**Page**: `/simulations/[id]/scenario/[scenarioId]/feedback/page.tsx`
**Missing Features**:
- ❌ `AlignmentMeetingResults` component not integrated (special scoring for specific scenarios)
- ❌ Proper video player with skip functionality
- ❌ Translation helpers for feedback text
- ❌ Simulation completion service call when reaching final scenario
- ❌ UUID validation for feedback text (prevents displaying database IDs)
- ❌ Proper routing to transition page when transition video exists
- ❌ Decision time display location check (`timerDisplayLocation` field)

**Special Case - Alignment Meeting**:
```typescript
// Vite shows special results for "The Alignment Meeting" scenario
{currentScenario.title === 'The Alignment Meeting' && (
  <AlignmentMeetingResults
    scenarioId={currentScenario.id}
    optionId={selectedOption.id}
    learnerId={currentUser?.id}
    simulationInstanceId={activeSession?.instanceId}
  />
)}
```

### 6. 🔶 Question Page - Missing Features
**Page**: `/simulations/[id]/scenario/[scenarioId]/question/page.tsx`
**Missing Features**:
- ❌ Session keepalive management during question viewing
- ❌ Decision timer component integration (if timer enabled)
- ❌ Proper data structure handling (scenario data vs scenarios.scenarios)
- ❌ Better error handling for missing instance ID

### 7. 🔶 Play Page - Missing Assignment Linking
**Page**: `/simulations/[id]/play/page.tsx`
**Missing Features**:
- ❌ Assignment linking logic (links simulation instances to assignments)
- ❌ Database RPC function call for `link_assignment_to_instance`
- ❌ Fallback logic to find unlinked assignments
- ❌ Better error messages with specific failure reasons

**Vite Implementation**:
```typescript
// Links assignment to instance using RPC function
await supabase.rpc('link_assignment_to_instance', {
  p_assignment_learner_id: assignmentLearnerId,
  p_instance_id: instanceId
});

// Falls back to direct update if RPC fails
await supabase
  .from('assignment_learners')
  .update({ current_instance_id: instanceId })
  .eq('id', assignmentLearnerId);
```

---

## Missing Utility Functions/Services

### 8. ❌ Simulation Completion Service
**Status**: Not migrated
**Vite Location**: `lib/simulationCompletion.ts`
**Purpose**:
- Marks simulation instances as completed
- Calculates final competency scores
- Updates learner progress records
- Triggers assignment completion updates

**Key Functions**:
- `completeSimulation(instanceId)` - Main completion handler
- Score calculation across all responses
- Assignment status updates

### 9. ❌ Session Keepalive Manager
**Status**: Not migrated
**Vite Location**: `lib/sessionKeepalive.ts`
**Purpose**:
- Prevents session timeout during long simulations
- Sends periodic "ping" requests to keep session alive
- Starts when entering simulation, stops on completion

### 10. ❌ Translation Helpers
**Status**: Partially migrated
**Vite Location**: `lib/translationHelpers.ts`
**Missing Functions**:
- `getScenarioOptionFeedback()` - Gets translated feedback for options
- `getScenarioTitle()` - Gets translated scenario titles
- `getScenarioDescription()` - Gets translated descriptions
- `getCategoryName()` - Gets translated category names
- UUID validation to prevent showing database IDs

---

## Database Functions Not Created

### 11. ❌ Database RPC Functions
**Missing Functions**:
1. `link_assignment_to_instance(p_assignment_learner_id, p_instance_id)`
   - Links assignment to simulation instance
   - Updates assignment progress

2. Score calculation functions (if any existed in Vite)

---

## Component Integration Issues

### 12. 🔶 AlignmentMeetingResults Component
**Status**: Component exists but not used
**Location**: `src/components/simulation/AlignmentMeetingResults.tsx`
**Needs Integration In**: Feedback page for specific scenarios
**Purpose**: Shows special metrics/scoring for "Alignment Meeting" scenario

### 13. 🔶 DecisionTimer Component
**Status**: Component exists but not integrated
**Location**: `src/components/simulation/DecisionTimer.tsx`
**Needs Integration In**: Question page (when timer enabled)
**Purpose**: Shows countdown timer during decision making

### 14. 🔶 VideoPlayer Enhancement
**Status**: Basic component exists but missing features
**Location**: `src/components/simulation/VideoPlayer.tsx`
**Missing Features**:
- Vimeo embed support
- Synthesia player support
- Better completion detection for embedded videos
- Skip button positioning and styling from Vite version

---

## Data Structure Inconsistencies

### 15. 🔶 Scenario Data Structure
**Issue**: Inconsistent access patterns
**Vite**: Uses `simulation.scenarios[index].scenarios` for nested data
**Next.js**: Sometimes `scenario.scenarios`, sometimes just `scenario`

**Example Conflict**:
```typescript
// Vite
const currentScenario = simulation.scenarios?.[index]?.scenarios;

// Next.js (inconsistent)
const scenarioData = scenario.scenarios || scenario;
```

### 16. 🔶 Feedback Structure
**Issue**: Multiple feedback formats
**Formats**:
1. `option.feedback[difficulty]` - Object with keys for each difficulty
2. `option.feedbackVideos[difficulty]` - Video URLs by difficulty
3. `option.feedback_text` - Flat text field
4. `option.feedback_video_url` - Single video URL

**Vite Solution**: Uses translation helpers to normalize access

---

## Configuration Fields Not Used

### 17. ❌ Timer Configuration
**Fields Not Checked**:
- `show_timer_in_feedback` - Whether to show timer on feedback page
- `timerDisplayLocation` - Where to show timer ('question_page', 'feedback_page', 'all')
- `timer_duration_seconds` - Countdown timer duration

### 18. ❌ Closing Page Configuration
**Fields Not Checked**:
- `closing_page_enabled` - Whether closing page is enabled
- `closing_page_show_before_results` - Show before or after results
- `closing_page_video_url` - Video to show on closing page

### 19. ❌ Introduction Configuration
**Fields Not Checked**:
- `introduction_page_enabled` - Already used ✅
- `character_name` - Name of AI character/actor
- `character_description` - Description of character

---

## Missing Navigation Logic

### 20. 🔶 Next Scenario Detection
**Issue**: Simplified next scenario logic
**Vite Logic**:
```typescript
// Checks for:
1. Exit point scenarios (is_exit_point flag)
2. Next scenario ID from selected option
3. Transition video presence
4. Simulation completion status
5. Closing page configuration
```

**Next.js**: Basic next scenario check, missing exit point and closing page logic

### 21. ❌ Resume Simulation Flow
**Status**: Component exists but flow not complete
**Component**: `ResumeSimulationModal.tsx`
**Missing**:
- Detection of in-progress simulations
- Modal trigger on simulation landing page
- Proper resume point calculation
- Session restoration logic

---

## Summary of Critical Missing Features

### High Priority (Blocks Core Functionality)
1. ✅ **FIXED** - Intro page route (404 error)
2. ❌ **Results page** - Users can't see final scores
3. ❌ **Transition page** - Breaks flow between scenarios
4. ❌ **Simulation completion service** - Scores not calculated
5. ❌ **Assignment linking** - Assignments not properly tracked

### Medium Priority (Degrades Experience)
6. ❌ **Video player improvements** - Poor video UX
7. ❌ **AlignmentMeetingResults integration** - Missing special scoring
8. ❌ **Translation helpers** - Breaks multilingual support
9. ❌ **Session keepalive** - Users may timeout during long sims
10. ❌ **Timer integration** - Timer feature not working

### Low Priority (Nice to Have)
11. ❌ **Closing page** - Optional end screen
12. ❌ **Character info display** - Additional context
13. ❌ **Resume simulation modal** - Convenience feature
14. ❌ **Category name display** - Better organization

---

## Recommended Implementation Order

### Phase 1: Critical Pages (Unblock Core Flow)
1. Create Transition page
2. Create Results page with all components
3. Implement Simulation Completion Service
4. Add assignment linking logic to Play page

### Phase 2: Feature Integration (Improve UX)
5. Integrate AlignmentMeetingResults in Feedback page
6. Add translation helpers across all pages
7. Enhance VideoPlayer component
8. Add DecisionTimer to Question page
9. Implement session keepalive

### Phase 3: Configuration & Polish
10. Add closing page support
11. Integrate timer configuration checks
12. Add resume simulation modal
13. Display character/category info
14. Standardize data structure access

---

## Testing Checklist

### After Phase 1
- [ ] Can complete a simulation end-to-end
- [ ] Transition videos display correctly
- [ ] Results page shows scores
- [ ] Assignments link to instances
- [ ] Simulation marked as completed

### After Phase 2
- [ ] Special scenarios (Alignment Meeting) show correct results
- [ ] Videos play correctly (YouTube, Vimeo, direct)
- [ ] Multilingual simulations work
- [ ] Timer displays when enabled
- [ ] Session doesn't timeout during simulation

### After Phase 3
- [ ] Closing page displays when configured
- [ ] Timer configuration respected
- [ ] Resume simulation works
- [ ] All metadata displays correctly
- [ ] Consistent data access patterns

---

**Last Updated**: 2025-01-15
**Status**: Gap analysis complete, ready for phased implementation
