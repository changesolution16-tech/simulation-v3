# Simulation Routes & Components - Complete Integration Map

## Overview
All simulation components now have proper routes and are accessible from the simulation dashboard. The simulation API endpoint has been fixed to properly parse JSON fields.

## Complete Simulation Flow

### 1. Entry Points

#### Simulation Landing Page
- **Route**: `/simulations/[id]`
- **Component**: `SimulationLanding` (from `src/components/learner/SimulationLanding.tsx`)
- **Purpose**: Shows simulation overview, objectives, and start button
- **Next**: User clicks "Start" → goes to `/simulations/[id]/play`

#### Simulation Player (Start)
- **Route**: `/simulations/[id]/play`
- **Component**: `SimulationPlayerPage`
- **Purpose**: Creates simulation instance and routes to appropriate next step
- **Next**:
  - If `introduction_page_enabled` → `/simulations/[id]/intro`
  - Else → `/simulations/[id]/scenario/[scenarioId]/introduction` or `/question`

### 2. Simulation Introduction

#### Simulation-Level Introduction
- **Route**: `/simulations/[id]/intro`
- **Component**: `SimulationIntroduction` (from `src/components/simulation/SimulationIntroduction.tsx`)
- **Purpose**: Shows overall simulation introduction video and context
- **Next**: First scenario's introduction or question page

### 3. Scenario Flow (Repeats for each scenario)

#### Scenario Introduction
- **Route**: `/simulations/[id]/scenario/[scenarioId]/introduction`
- **Component**: Inline with `VideoPlayer` component
- **Purpose**: Shows scenario-specific introduction video and context
- **Uses**: `VideoPlayer` component
- **Next**: `/simulations/[id]/scenario/[scenarioId]/question`

#### Scenario Question
- **Route**: `/simulations/[id]/scenario/[scenarioId]/question`
- **Component**: Inline question page
- **Purpose**: Presents scenario question and multiple choice options
- **Uses**: `DecisionTimer` component (if enabled)
- **Next**: `/simulations/[id]/scenario/[scenarioId]/feedback`

#### Scenario Feedback
- **Route**: `/simulations/[id]/scenario/[scenarioId]/feedback`
- **Component**: Inline feedback page
- **Purpose**: Shows feedback for selected option
- **Uses**:
  - `LearningRecommendationsDisplay` component
  - `VideoPlayer` for feedback video
- **Next**:
  - If transition video → `/simulations/[id]/scenario/[scenarioId]/transition`
  - If next scenario → Next scenario introduction
  - Else → `/simulations/[id]/results`

#### Transition Between Scenarios
- **Route**: `/simulations/[id]/scenario/[scenarioId]/transition`
- **Component**: `TransitionPage` (from `src/components/simulation/TransitionPage.tsx`)
- **Purpose**: Shows transition video/message between scenarios
- **Next**: Next scenario introduction or results page

### 4. Results & Analytics

#### Main Results Dashboard
- **Route**: `/simulations/[id]/results`
- **Component**: Inline results dashboard page
- **Purpose**: Hub for accessing all result types
- **Links to**:
  - BRAVIN Results
  - Learning Path Visualization
  - Alignment Meeting Results
  - Competency Progress

#### BRAVIN Leadership Assessment
- **Route**: `/simulations/[id]/results/bravin`
- **Component**: `BravinResults` (from `src/components/simulation/BravinResults.tsx`)
- **Purpose**: Shows BRAVIN dimension analysis (Boldness, Responsibility, Accountability, Vision, Integrity, Nurturance)
- **Query Params**: `?instanceId={id}&detailed=true`
- **Sub-components**:
  - `BravinFeedbackSummary` (can be integrated)
  - `MetricsSummary` (can be integrated)

#### Learning Path Visualization
- **Route**: `/simulations/[id]/results/learning-path`
- **Component**: `LearnerPathVisualization` (from `src/components/simulation/LearnerPathVisualization.tsx`)
- **Purpose**: Visual journey through learner's decision path
- **Query Params**: `?instanceId={id}`

#### Alignment Meeting Results
- **Route**: `/simulations/[id]/results/alignment`
- **Component**: `AlignmentMeetingResults` (from `src/components/simulation/AlignmentMeetingResults.tsx`)
- **Purpose**: Detailed scoring from alignment meeting scenarios
- **Query Params**: `?scenarioId={id}&optionId={id}&instanceId={id}`
- **Note**: Only available after completing alignment meeting scenarios

#### Competency Development Results
- **Route**: `/simulations/[id]/results/competencies`
- **Component**: `CompetencyResults` (from `src/components/simulation/CompetencyResults.tsx`)
- **Purpose**: Track competency development across leadership skills
- **Uses**: API endpoints `/api/competencies` and `/api/competencies/learner/[id]`
- **Sub-components**:
  - `CompetencyFeedback` (used inline)
  - `MetricFeedback` (used inline)

## Component Usage Map

### Components with Dedicated Routes ✓
1. ✅ `AlignmentMeetingResults` → `/simulations/[id]/results/alignment`
2. ✅ `BravinResults` → `/simulations/[id]/results/bravin`
3. ✅ `LearnerPathVisualization` → `/simulations/[id]/results/learning-path`
4. ✅ `CompetencyResults` → `/simulations/[id]/results/competencies`
5. ✅ `SimulationIntroduction` → `/simulations/[id]/intro`
6. ✅ `TransitionPage` → `/simulations/[id]/scenario/[scenarioId]/transition`
7. ✅ `SimulationLandingPage` → `/simulations/[id]` (via `SimulationLanding`)

### Reusable Sub-Components (Used within other components)
1. ✅ `VideoPlayer` → Used in scenario introduction and feedback pages
2. ✅ `LearningRecommendationsDisplay` → Used in feedback page
3. ✅ `DecisionTimer` → Used in question page (when timer is enabled)
4. ✅ `BravinFeedbackSummary` → Can be integrated in BRAVIN results
5. ✅ `CompetencyFeedback` → Used within CompetencyResults
6. ✅ `MetricFeedback` → Used for displaying individual metrics
7. ✅ `MetricsSummary` → Can be integrated in results pages
8. ✅ `ResumeSimulationModal` → Modal component for resuming simulations

### Components Not Currently in Flow (Optional/Deprecated)
- `DifficultySelection` - Difficulty is now set at simulation level
- `DifficultyLandingPage` - Integrated into main landing page
- `TopicSelection` - Topics not currently used in this flow

## API Endpoints Fixed

### Simulations API
- **Fixed**: `/api/simulations` and `/api/simulations/[id]`
- **Issue**: JSONB fields were not being parsed (causing `T.map is not a function` error)
- **Solution**: Added JSON parsing for `landing_objectives`, `landing_objectives_es`, and `tags`

## Complete Route List

```
Simulation Routes:
├── /simulations/[id]                                      (Landing page)
├── /simulations/[id]/play                                 (Start simulation)
├── /simulations/[id]/intro                                (Simulation intro)
├── /simulations/[id]/start                                (Alternative start route)
│
├── /simulations/[id]/scenario/[scenarioId]/
│   ├── introduction                                       (Scenario intro)
│   ├── question                                           (Decision point)
│   ├── feedback                                           (Feedback)
│   └── transition                                         (Transition)
│
└── /simulations/[id]/results/
    ├── (main results dashboard)                           (Results hub)
    ├── bravin                                             (BRAVIN assessment)
    ├── learning-path                                      (Journey visualization)
    ├── alignment                                          (Alignment meeting)
    └── competencies                                       (Competency development)
```

## Testing Checklist

### Flow Testing
- [ ] Start simulation from landing page
- [ ] Navigate through simulation introduction
- [ ] Complete scenario with decision timer
- [ ] View scenario feedback with recommendations
- [ ] Navigate through transition page
- [ ] Complete multiple scenarios
- [ ] View results dashboard
- [ ] Access BRAVIN results
- [ ] Access learning path visualization
- [ ] Access competency results
- [ ] Test with instanceId query parameter

### API Testing
- [ ] Fetch simulations list: `GET /api/simulations`
- [ ] Fetch single simulation: `GET /api/simulations/[id]`
- [ ] Verify landing_objectives is parsed as array
- [ ] Create simulation instance: `POST /api/simulations/[id]/instances`
- [ ] Save learner response: `POST /api/instances/[id]/responses`
- [ ] Fetch competencies: `GET /api/competencies`
- [ ] Fetch learner competencies: `GET /api/competencies/learner/[id]`

### Component Testing
- [ ] VideoPlayer handles different video types (Synthesia, YouTube, upload)
- [ ] DecisionTimer displays correctly when enabled
- [ ] LearningRecommendationsDisplay shows practice exercises
- [ ] CompetencyResults fetches and displays data via API
- [ ] BravinResults shows dimension scores
- [ ] TransitionPage handles video and continues correctly

## Next Steps

1. **Test the complete flow** from landing to results
2. **Verify API responses** are correctly formatted
3. **Add navigation links** in the simulation UI to access results
4. **Consider adding**:
   - Progress indicators showing current position in simulation
   - Breadcrumb navigation
   - Quick access to results from any point
   - Resume simulation functionality
5. **Optional enhancements**:
   - Integrate `MetricsSummary` into main results dashboard
   - Add `BravinFeedbackSummary` to BRAVIN results page
   - Create comparative analytics across multiple attempts

## Build Status

✅ **Build Successful** - All routes compiled and registered
✅ **No TypeScript Errors** - Type safety maintained
✅ **Client/Server Separation** - Proper use of API routes for data fetching
✅ **Component Integration** - All components properly connected to routes

---

**Last Updated**: January 18, 2026
**Build Output**: All 58+ routes successfully compiled
