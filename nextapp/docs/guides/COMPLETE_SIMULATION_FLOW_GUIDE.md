# Complete Simulation Flow Guide

## Overview

This document describes the complete simulation flow architecture for the Moodle Soft Skills Simulation platform. The system has been restructured to provide a clear, linear learning journey from landing page through multiple scenarios to final results.

## Architecture Components

### Database Structure

The simulation system uses the following key tables:

1. **simulations** - Core simulation metadata
   - Landing page configuration (image, title, description, objectives)
   - Introduction page configuration (video, role description, participation agreement)
   - Entry scenario reference
   - Status and publishing controls

2. **simulation_scenarios** - Junction table linking scenarios to simulations
   - is_entry_point - Marks the starting scenario
   - is_exit_point - Marks terminal scenarios
   - sequence_order - Defines flow order
   - position_x, position_y - Visual layout coordinates

3. **scenarios** - Individual scenario content
   - introduction_video_url - Scenario introduction video
   - prompt_video_url - Optional scenario prompt video
   - transition_video_url - Transition to next scenario
   - Timer configuration fields

4. **scenario_options** - Response choices
   - next_scenario_id - Links to the next scenario in flow
   - feedback_video_url_[difficulty] - Per-difficulty feedback videos
   - transition_video_url - Option-specific transition
   - competency_impacts and skill_impacts - Learning outcomes

### Complete Learner Journey

```
┌─────────────────────┐
│  Landing Page       │  - Image, title, description
│  /simulation/play/  │  - Learning objectives
│  :simulationId      │  - Introduction video
└──────────┬──────────┘  - Start simulation button
           │
           v
┌─────────────────────┐
│ Simulation Intro    │  - Journey overview video
│ /simulation/        │  - Role description
│ :simulationId/intro │  - Participation agreement
└──────────┬──────────┘  - Begin simulation button
           │
           v
┌─────────────────────┐
│ Scenario 1 Intro    │  - Scenario title & description
│ /:simulationId/     │  - Introduction video
│ scenario/0/         │  - Continue button
│ introduction        │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ Question Page       │  - Multiple choice options (4)
│ /:simulationId/     │  - Decision timer (optional)
│ scenario/0/         │  - Auto-advance on selection
│ question            │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ Feedback Page       │  - Difficulty-specific feedback
│ /:simulationId/     │  - Feedback video or text
│ scenario/0/         │  - Competency impacts shown
│ feedback            │  - Metric assessments
└──────────┬──────────┘  - Continue button
           │
           v
┌─────────────────────┐
│ Transition Page     │  - Transition video
│ /:simulationId/     │  - "Next scenario" or "Results"
│ scenario/0/         │
│ transition          │
└──────────┬──────────┘
           │
           v
    [Repeat for each
     scenario based on
     next_scenario_id]
           │
           v
┌─────────────────────┐
│ Results Page        │  - Overall performance
│ /simulation/        │  - Competency summary
│ results/            │  - Path visualization
│ :simulationId       │  - Recommendations
└─────────────────────┘
```

## Key Concepts

### 1. Simulation Landing Page

**Purpose:** First impression and orientation
**Location:** `/simulation/play/:simulationId`
**Component:** `SimulationPlayer.tsx`

**Features:**
- Display simulation image banner
- Show title and description
- List learning objectives with checkmarks
- Play introduction video (optional)
- Require participation agreement checkbox
- "Start Simulation" button

**Database Fields:**
- `landing_image_url` - Hero image
- `landing_title` - Main heading
- `landing_description` - Overview text
- `landing_objectives` - JSON array of objectives
- `landing_intro_video_url` - Optional video
- `landing_fiction_contract` - Agreement text

### 2. Simulation Introduction Page

**Purpose:** Set context and get learner commitment
**Location:** `/simulation/:simulationId/intro`
**Component:** `SimulationIntroduction.tsx`

**Features:**
- Display journey overview
- Show learner's role description
- Play introduction video explaining the experience
- Require participation agreement
- "Begin Simulation" button

**Database Fields:**
- `introduction_page_enabled` - Toggle this page
- `introduction_title` - Page heading
- `introduction_description` - Context setting
- `introduction_video_url` - Journey video
- `landing_role_description` - Role explanation

**Navigation:**
- Determines entry scenario from `simulation_scenarios` where `is_entry_point = true`
- Navigates to first scenario introduction

### 3. Scenario Introduction

**Purpose:** Introduce each scenario challenge
**Location:** `/simulation/:simulationId/scenario/:index/introduction`
**Component:** `IntroductionPage.tsx`

**Features:**
- Display scenario title and description
- Play introduction video
- Show progress (Scenario X of Y)
- "Continue" button

**Database Fields (scenarios table):**
- `title` - Scenario name
- `description` - Scenario context
- `introduction_video_url` - Scenario-specific video

### 4. Question Page

**Purpose:** Present decision point
**Location:** `/simulation/:simulationId/scenario/:index/question`
**Component:** `QuestionPage.tsx`

**Features:**
- Display 4 multiple choice options
- Optional decision timer
- Letter labels (A, B, C, D)
- Click to select and auto-advance
- Record decision time

**Database Fields:**
- Options from `scenario_options` table
- `option_text` - The choice text
- `option_order` - Display sequence

**Data Recording:**
- Creates entry in `learner_responses` table
- Records: instance_id, scenario_id, option_id, time_to_decision_seconds

### 5. Feedback Page

**Purpose:** Provide learning feedback
**Location:** `/simulation/:simulationId/scenario/:index/feedback`
**Component:** `FeedbackPage.tsx`

**Features:**
- Show feedback video OR text based on difficulty
- Display competency impacts (+ or - to skills)
- Show Bravin metric assessments
- Optional decision time feedback
- "Continue" button

**Database Fields:**
- `feedback_video_url_beginner` - Easy level video
- `feedback_video_url_intermediate` - Medium level video
- `feedback_video_url_advanced` - Hard level video
- `feedback_beginner`, `feedback_intermediate`, `feedback_advanced` - Text fallbacks
- `competency_impacts` - JSON of skill changes

### 6. Transition Page

**Purpose:** Bridge between scenarios
**Location:** `/simulation/:simulationId/scenario/:index/transition`
**Component:** `TransitionPage.tsx`

**Features:**
- Play transition video (option-level or scenario-level)
- "Continue to Next Scenario" or "View Results" button

**Database Fields:**
- `scenario_options.transition_video_url` - Option-specific transition
- `scenarios.transition_video_url` - Default scenario transition

**Navigation Logic:**
```typescript
// Get next scenario from selected option
const nextScenarioId = selectedOption.nextScenarioId;

// Check if this is the end
if (currentSimScenario.is_exit_point || !nextScenarioId) {
  navigate('/simulation/results/:simulationId');
} else {
  // Find index of next scenario
  const nextIndex = simulation.scenarios.findIndex(
    s => s.scenario_id === nextScenarioId
  );
  navigate(`/simulation/:simulationId/scenario/${nextIndex}/introduction`);
}
```

### 7. Results Page

**Purpose:** Final assessment and reflection
**Location:** `/simulation/results/:simulationId`
**Component:** `Results.tsx`

**Features:**
- Overall performance summary
- Competency scores visualization
- Path taken through simulation
- Learning recommendations
- "Return to Dashboard" button

## Session State Management

The `useSimulationStore` manages the active session:

```typescript
interface SimulationSession {
  simulationId: string;           // Which simulation
  instanceId: string | null;       // Database instance record
  currentScenarioIndex: number;    // Current position in flow
  selectedOptionId: string | null; // Last selected option
  decisionHistory: Array<{         // All decisions made
    scenarioId: string;
    optionId: string;
    timestamp: number;
  }>;
  competencyScores: Record<string, number>; // Accumulated scores
  startedAt: number;               // Session start time
}
```

**Key Methods:**
- `initializeSession(simulationId, instanceId)` - Start new session
- `updateSessionScenarioIndex(index)` - Move to next scenario
- `updateSessionSelectedOption(optionId)` - Record choice
- `addSessionDecision(scenarioId, optionId)` - Add to history
- `updateSessionCompetencyScores(scores)` - Update skills
- `clearSession()` - End session

## Video Integration

Videos are supported from multiple sources:

1. **Direct URL** - YouTube, Vimeo, etc.
2. **Synthesia** - AI-generated videos
3. **File Upload** - Stored in Supabase storage
4. **Video Library** - Centralized video management
5. **Embed Code** - Custom iframe embeds

**Video Fields Pattern:**
- `{type}_video_url` - The video URL or ID
- `{type}_video_source` - Source type (url, embed, upload, library)
- `{type}_video_library_id` - Reference to video_library table
- `{type}_video_file_id` - Reference to storage file
- `{type}_video_embed_code` - Custom embed HTML

**SynthesiaPlayer Component:**
Handles all video types consistently with:
- `videoUrl` - The URL to play
- `videoType` - Context (introduction, feedback, transition)
- `onComplete` - Callback when finished
- `onSkip` - Callback when skipped
- `allowSkip` - Enable skip button
- `testingMode` - Allow easier testing

## Scenario Connections

Scenarios connect via the `next_scenario_id` field in `scenario_options`:

```sql
-- Option A leads to Scenario 2
UPDATE scenario_options
SET next_scenario_id = 'scenario-2-uuid'
WHERE id = 'option-a-uuid';

-- Option B leads to Scenario 3
UPDATE scenario_options
SET next_scenario_id = 'scenario-3-uuid'
WHERE id = 'option-b-uuid';
```

**Flow Validation:**
Use the helper function to validate flow:

```sql
SELECT * FROM validate_simulation_flow('simulation-uuid');
-- Returns: is_valid, error_message, warning_message
```

**Common Issues:**
1. No entry point defined
2. Multiple entry points
3. Orphaned scenarios (not reachable)
4. Dead-end scenarios (no exit or next scenario)

## Admin Workflow

### Creating a Complete Simulation

1. **Create Simulation** (SimulationBuilder)
   - Set name, display name, category, difficulty
   - Configure landing page (image, title, description, objectives)
   - Configure introduction page (video, role description)
   - Save as draft

2. **Build Scenario Flow** (ScenarioFlowBuilder)
   - Add scenarios to simulation (via simulation_scenarios table)
   - Mark one scenario as entry point (is_entry_point = true)
   - Mark terminal scenarios as exit points (is_exit_point = true)
   - Connect scenarios via option next_scenario_id values
   - Validate flow completeness

3. **Configure Videos**
   - Upload or link videos for each scenario introduction
   - Add feedback videos for each option at each difficulty
   - Add transition videos as needed
   - Test video playback

4. **Set Competencies and Metrics**
   - Assign competency impacts to options
   - Configure Bravin metric scores
   - Map metrics to competencies

5. **Publish**
   - Validate all scenarios have content
   - Check all videos work
   - Test full flow
   - Set status to 'published'

## Helper Functions

### Get Next Scenario in Flow

```sql
SELECT * FROM get_next_scenario_in_simulation(
  'simulation-uuid',
  'current-scenario-uuid',
  'selected-option-uuid'
);
-- Returns: next_scenario_id, next_scenario_index, is_end_of_simulation
```

### Validate Simulation Flow

```sql
SELECT * FROM validate_simulation_flow('simulation-uuid');
-- Returns validation results with errors and warnings
```

### Get Scenario Video URL

```sql
SELECT get_scenario_video_url('scenario-uuid', 'introduction');
-- Resolves video URL from direct URL or library reference
```

## Testing the Flow

### Manual Testing Steps

1. **Landing Page Test**
   - Verify image loads
   - Check objectives display
   - Test video plays
   - Confirm start button requires agreement

2. **Introduction Page Test**
   - Verify role description shows
   - Test journey video plays
   - Confirm participation agreement required

3. **Scenario Flow Test**
   - Complete first scenario introduction
   - Select option on question page
   - Verify feedback shows correctly
   - Check transition plays
   - Confirm navigation to next scenario works

4. **Navigation Test**
   - Verify progress indicator updates
   - Test exit simulation returns to dashboard
   - Confirm back navigation blocked appropriately

5. **Results Test**
   - Complete full simulation
   - Verify results page shows all data
   - Check competency scores are accurate
   - Test return to dashboard

### Automated Testing

```javascript
// Test scenario connection
const nextScenario = await getNextScenario(
  simulationId,
  currentScenarioId,
  selectedOptionId
);
expect(nextScenario).toBeDefined();

// Test video resolution
const videoUrl = await getScenarioVideoUrl(
  scenarioId,
  'introduction'
);
expect(videoUrl).toMatch(/^https?:\/\//);
```

## Troubleshooting

### Scenarios Not Connecting

**Symptom:** Clicking continue doesn't advance to next scenario

**Causes:**
1. `next_scenario_id` is null or invalid
2. Next scenario not in `simulation_scenarios` for this simulation
3. Scenario index calculation failing

**Fix:**
```sql
-- Check option connections
SELECT id, option_text, next_scenario_id
FROM scenario_options
WHERE scenario_id = 'current-scenario-uuid';

-- Verify next scenario exists in simulation
SELECT scenario_id, is_entry_point, sequence_order
FROM simulation_scenarios
WHERE simulation_id = 'simulation-uuid'
ORDER BY sequence_order;
```

### Videos Not Playing

**Symptom:** Video component shows loading or error

**Causes:**
1. Video URL is invalid or empty
2. Video source type mismatch
3. Library reference broken
4. CORS issues with video host

**Fix:**
```sql
-- Check video URLs
SELECT
  introduction_video_url,
  introduction_video_source,
  introduction_video_library_id
FROM scenarios
WHERE id = 'scenario-uuid';

-- If using library, check reference
SELECT * FROM video_library
WHERE id = 'library-id';
```

### Session State Issues

**Symptom:** Navigation jumps or session lost

**Causes:**
1. localStorage cleared
2. Session not initialized properly
3. Multiple tabs/windows interfering

**Fix:**
- Check browser console for session initialization logs
- Verify `activeSession` in Redux DevTools
- Clear localStorage and restart: `localStorage.clear()`

## Best Practices

1. **Always Define Entry Point** - Mark exactly one scenario as `is_entry_point`
2. **Mark Exit Scenarios** - Set `is_exit_point = true` for terminal scenarios
3. **Test Full Flow** - Walk through complete simulation before publishing
4. **Use Consistent Naming** - Follow column naming conventions for videos
5. **Validate Before Publish** - Run `validate_simulation_flow()` function
6. **Provide Fallbacks** - Include text feedback even when using videos
7. **Track Progress** - Use the progress indicator on all pages
8. **Handle Errors** - Check for null/undefined before navigation
9. **Log Generously** - Use console.log for debugging flow issues
10. **Document Custom Flows** - Note any non-standard branching patterns

## Future Enhancements

- [ ] Conditional branching based on competency scores
- [ ] Time-limited scenarios with automatic progression
- [ ] Adaptive difficulty based on performance
- [ ] Multi-path simulations with role selection
- [ ] Team-based collaborative scenarios
- [ ] Real-time instructor intervention
- [ ] AI-generated personalized feedback
- [ ] VR/AR scenario integration
- [ ] Mobile app support
- [ ] Offline mode with sync

## Support

For issues or questions:
1. Check this documentation
2. Review browser console logs
3. Validate database schema
4. Test with simple scenario first
5. Contact development team

---

**Last Updated:** October 29, 2025
**Version:** 2.0.0
**Maintainer:** Development Team
