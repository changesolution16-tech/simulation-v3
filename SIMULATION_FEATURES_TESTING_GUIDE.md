# Simulation Features - Complete Testing Guide

This document provides a comprehensive guide to all simulation features that have been migrated from the Vite app to the Next.js app, and how to test each feature.

## Table of Contents

1. [Overview of Features](#overview-of-features)
2. [Session State Management](#session-state-management)
3. [Starting Simulations](#starting-simulations)
4. [Scenario Introduction](#scenario-introduction)
5. [Scenario Questions](#scenario-questions)
6. [Feedback System](#feedback-system)
7. [Video Player](#video-player)
8. [Learning Recommendations](#learning-recommendations)
9. [Completion & Scoring](#completion--scoring)
10. [Testing Checklist](#testing-checklist)

---

## Overview of Features

### ✅ Fully Implemented Features

All critical features from the Vite app have been successfully migrated:

1. **Session State Management** - Zustand store for tracking simulation progress
2. **Simulation Startup** - Creating instances and linking assignments
3. **Scenario Introduction Pages** - Video and text introductions for scenarios
4. **Question/Decision Pages** - Timed and untimed decision making
5. **Feedback Pages** - Difficulty-based feedback with videos
6. **Learning Recommendations** - Practice exercises and next steps
7. **Video Player** - YouTube and standard video support with skip/complete
8. **Competency Tracking** - Impact recording and score calculation
9. **Completion Service** - Automatic completion detection and final scoring
10. **Timer System** - Countdown and elapsed timers with decision tracking
11. **Progress Indicators** - Visual progress through simulation stages
12. **Branching Logic** - Next scenario navigation based on choices

---

## Session State Management

### Feature Description
The simulation uses a Zustand store to maintain session state across different pages and scenarios.

### Location
- **Store**: `src/stores/simulationStore.ts`
- **Usage**: Imported in simulation pages

### State Structure
```typescript
{
  activeSession: {
    simulationId: string;
    instanceId: string;
    currentScenarioIndex: number;
    currentScenarioId?: string;
    selectedOptionId?: string;
    difficulty?: string;
    assignmentId?: string;
  };
  selectedTopic: string | null;
  selectedDifficulty: string | null;
}
```

### How to Test

1. **Start a simulation** and verify session is created:
   ```javascript
   // Open browser console
   // Navigate to /simulations/[id]/start
   // Check session storage or Zustand dev tools
   ```

2. **Navigate between pages** and verify state persists:
   - Start simulation
   - Check scenario introduction page
   - Navigate to question page
   - Verify `activeSession` maintains all values

3. **Check session updates**:
   - Make a decision
   - Verify `selectedOptionId` is set
   - Navigate to feedback
   - Verify state still contains all data

---

## Starting Simulations

### Feature Description
Entry point for beginning a new simulation. Creates a database instance, links assignments, and navigates to the first scenario.

### Location
- **Page**: `src/app/(dashboard)/simulations/[id]/start/page.tsx`
- **API**: `POST /api/simulations/[id]/instances`

### Database Operations
- Creates record in `simulation_instances` table
- Links to `training_assignments` if `assignmentId` provided
- Sets status to `in_progress`

### How to Test

1. **Basic simulation start**:
   ```
   Navigate to: /simulations/{simulation-id}/start

   Expected:
   - Loading spinner appears
   - Instance created in database
   - Redirects to intro or first scenario
   ```

2. **Start with assignment**:
   ```
   Navigate to: /simulations/{simulation-id}/start?assignmentId={id}&difficulty=intermediate

   Expected:
   - Instance created with assignment link
   - Difficulty set correctly
   ```

3. **Error handling**:
   ```
   Test with invalid simulation ID: /simulations/invalid-id/start

   Expected:
   - Error message displayed
   - "Return to Dashboard" button shown
   ```

4. **Database verification**:
   ```sql
   SELECT * FROM simulation_instances
   WHERE simulation_id = 'your-sim-id'
   ORDER BY started_at DESC
   LIMIT 1;
   ```

---

## Scenario Introduction

### Feature Description
Shows scenario title, description, optional introduction video, and context before presenting the decision point.

### Location
- **Page**: `src/app/(dashboard)/simulations/[id]/scenario/[scenarioId]/introduction/page.tsx`
- **Component**: Uses `VideoPlayer` component

### Features
- Displays scenario title and description
- Shows category and estimated duration
- Plays introduction video (if configured)
- Skip video option
- Progress indicator (Step 1 of 3)
- Localization support (language context)

### How to Test

1. **Page loads correctly**:
   ```
   Navigate to: /simulations/{sim-id}/scenario/{scenario-id}/introduction

   Expected:
   - Scenario title displays
   - Description shows
   - Category and duration visible
   - Progress indicator shows step 1 active
   ```

2. **With introduction video**:
   ```
   Requirements: Scenario has introduction_video_url set

   Expected:
   - Video player renders
   - Autoplay starts (if browser allows)
   - Skip button available
   - Continue button disabled until video watched
   ```

3. **Without introduction video**:
   ```
   Requirements: Scenario has no introduction_video_url

   Expected:
   - No video player
   - Continue button immediately available
   - Can proceed to question
   ```

4. **Continue button**:
   ```
   Click "Continue"

   Expected:
   - Navigates to: /simulations/{sim-id}/scenario/{scenario-id}/question
   - Session state maintained
   ```

5. **Translation** (if multiple languages enabled):
   ```
   Change language setting

   Expected:
   - Title, description translate
   - UI labels translate
   ```

---

## Scenario Questions

### Feature Description
Presents the decision point with multiple choice options. Can include video, timer, and tracks decision time.

### Location
- **Page**: `src/app/(dashboard)/simulations/[id]/scenario/[scenarioId]/question/page.tsx`
- **Component**: `DecisionTimer` for timed scenarios

### Features
- Displays scenario question
- Shows multiple choice options
- Optional decision timer (countdown or elapsed)
- Option video support
- Records decision time
- Progress indicator (Step 2 of 3)

### How to Test

1. **Question page loads**:
   ```
   Navigate to: /simulations/{sim-id}/scenario/{scenario-id}/question

   Expected:
   - Question text displays
   - All options visible
   - Progress shows step 2 active
   ```

2. **With countdown timer**:
   ```
   Requirements: Scenario has has_timer=true, timer_seconds set

   Expected:
   - Timer displays and counts down
   - Warning color when < 30% time remains
   - Can still select after timer expires
   ```

3. **With elapsed timer**:
   ```
   Requirements: Scenario tracks time but no limit

   Expected:
   - Timer counts up from 0:00
   - Shows decision duration
   - No expiry
   ```

4. **Select an option**:
   ```
   Click any option button

   Expected:
   - POST request to /api/instances/{instance-id}/responses
   - Response saved with time_to_decision_seconds
   - Redirects to feedback page
   ```

5. **Database verification**:
   ```sql
   SELECT * FROM learner_responses
   WHERE instance_id = 'your-instance-id'
   ORDER BY responded_at DESC;
   ```

---

## Feedback System

### Feature Description
Shows feedback based on selected option and difficulty level. Can include feedback video, competency impacts, and learning recommendations.

### Location
- **Page**: `src/app/(dashboard)/simulations/[id]/scenario/[scenarioId]/feedback/page.tsx`
- **Components**:
  - `VideoPlayer` - Feedback videos
  - `CompetencyFeedback` - Competency impact display
  - `LearningRecommendationsDisplay` - Practice exercises and next steps

### Features
- Difficulty-based feedback text (beginner/intermediate/advanced)
- Optional feedback video
- Decision time display
- Competency impact feedback
- Learning recommendations (practice exercises, next steps)
- Progress indicator (Step 3 of 3)
- Continue to next scenario or results

### How to Test

1. **Feedback page loads**:
   ```
   After making a decision

   Expected:
   - Selected option displayed
   - Feedback text appropriate for difficulty level
   - Decision time shown
   - Progress shows step 3 active
   ```

2. **Difficulty-based feedback**:
   ```
   Test with different difficulty levels:
   - Beginner: Shows feedback_beginner
   - Intermediate: Shows feedback_intermediate (or falls back to beginner)
   - Advanced: Shows feedback_advanced (or falls back to beginner)
   ```

3. **With feedback video**:
   ```
   Requirements: Option has feedback_video_url_{difficulty}

   Expected:
   - Video player renders
   - Autoplay starts
   - Continue button disabled until watched
   - Skip option available
   ```

4. **Learning recommendations**:
   ```
   Requirements: Option has practice_exercises and/or next_steps

   Expected:
   - Practice exercises section shows
   - Next steps section shows
   - Each item renders as bullet point
   ```

5. **Competency impacts** (if configured):
   ```
   Requirements: Option has competency_impacts

   Expected:
   - Competency feedback component renders
   - Shows which competencies affected
   - Displays impact direction (positive/negative)
   ```

6. **Continue button**:
   ```
   Scenarios:
   a) With next scenario:
      - Navigates to next scenario introduction
   b) No next scenario (simulation complete):
      - Calls /api/instances/{id}/complete
      - Navigates to results page
   ```

---

## Video Player

### Feature Description
Custom HTML5 video player with full controls. Uses only the video tag (no iframes) to avoid embedding restrictions.

### Location
- **Component**: `src/components/simulation/VideoPlayer.tsx`

### Important: Video Hosting Required
**Videos must be hosted with direct file URLs** (not YouTube/Vimeo embeds).

Supported formats:
- MP4 (H.264) - Recommended
- WebM
- OGG

Recommended hosting:
- AWS S3 with public access
- Cloudflare R2
- Your own CDN
- See `VIDEO_HOSTING_GUIDE.md` for details

### Built-in Controls
- Play/Pause button
- Volume control with mute
- Seekbar with time scrubbing
- Time display (current/total)
- Fullscreen toggle
- Skip button (when enabled)
- Error handling with fallback

### How to Test

1. **Direct video URL**:
   ```
   Video URL: https://your-cdn.com/videos/intro.mp4

   Expected:
   - Video loads and displays
   - HTML5 video element renders
   - Custom controls visible on hover
   - Play button overlay before playing
   - Progress bar updates as video plays
   ```

2. **Autoplay**:
   ```
   autoPlay={true}

   Expected:
   - Video attempts to play automatically
   - Falls back gracefully if browser blocks
   - Shows play button if autoplay prevented
   ```

3. **Skip functionality**:
   ```
   allowSkip={true}

   Expected:
   - Skip button visible in top-right
   - Clicking skip fires onSkip callback
   - Can proceed without watching
   ```

4. **Video controls**:
   ```
   Actions to test:
   - Click play/pause
   - Seek to different time
   - Adjust volume
   - Toggle mute
   - Enter fullscreen
   - Controls hide when playing (hover to show)
   ```

5. **Completion tracking**:
   ```
   Monitor onComplete callback

   Expected:
   - Fires when video ends naturally
   - Updates parent component state
   - Enables continue button
   ```

6. **Error handling**:
   ```
   Test with invalid URL

   Expected:
   - Error message displays
   - "Continue Anyway" button shows (if skip enabled)
   - Console logs error details
   ```

7. **Multiple formats**:
   ```
   Video player tries multiple sources automatically:
   - Tries MP4 first
   - Falls back to WebM
   - Falls back to OGG
   - Shows error if all fail
   ```

### Setting Up Videos

Before testing, ensure:
- Videos are hosted with public URLs
- URLs return video file directly (not HTML page)
- CORS headers are configured
- HTTPS is used (not HTTP)

Example database setup:
```sql
-- Set video URLs
UPDATE scenarios
SET introduction_video_url = 'https://your-cdn.com/videos/scenario-1-intro.mp4'
WHERE id = 'scenario-id';

UPDATE scenario_options
SET feedback_video_url_beginner = 'https://your-cdn.com/videos/option-feedback.mp4'
WHERE id = 'option-id';
```

See **VIDEO_HOSTING_GUIDE.md** for complete setup instructions.

---

## Learning Recommendations

### Feature Description
Displays practice exercises and next steps to help learners improve after each scenario.

### Location
- **Component**: `src/components/simulation/LearningRecommendationsDisplay.tsx`

### Features
- Practice exercises list
- Next steps recommendations
- Clean, organized display
- Collapsible sections

### How to Test

1. **With practice exercises**:
   ```
   Option data:
   practice_exercises: [
     "Review conflict resolution techniques",
     "Practice active listening exercises"
   ]

   Expected:
   - "Practice Exercises" section displays
   - Each exercise as bullet point
   - Styled appropriately
   ```

2. **With next steps**:
   ```
   Option data:
   next_steps: [
     "Observe senior team members",
     "Schedule follow-up meeting"
   ]

   Expected:
   - "Next Steps" section displays
   - Each step as bullet point
   - Clear visual hierarchy
   ```

3. **Empty state**:
   ```
   Option data:
   practice_exercises: []
   next_steps: []

   Expected:
   - Component doesn't render
   - No empty sections shown
   ```

---

## Completion & Scoring

### Feature Description
Automatically detects simulation completion, calculates final scores, and marks instance as complete.

### Location
- **API**: `POST /api/instances/[id]/complete`
- **Triggered from**: Feedback page when no next scenario

### Scoring Logic
1. Aggregates all competency impacts from responses
2. Calculates average impact score
3. Records completion time
4. Updates instance status to `completed`

### Database Updates
- Sets `status = 'completed'`
- Records `completed_at` timestamp
- Calculates `completion_time_seconds`
- Stores `overall_score`

### How to Test

1. **Complete a simulation**:
   ```
   Steps:
   1. Start simulation
   2. Go through all scenarios
   3. Select last option (no next_scenario_id)
   4. View feedback page
   5. Click Continue

   Expected:
   - POST to /api/instances/{id}/complete
   - Response includes scores
   - Navigates to results page
   ```

2. **Verify database update**:
   ```sql
   SELECT
     id,
     status,
     completed_at,
     completion_time_seconds,
     overall_score,
     started_at
   FROM simulation_instances
   WHERE id = 'your-instance-id';

   Expected:
   - status = 'completed'
   - completed_at is set
   - completion_time_seconds > 0
   - overall_score calculated
   ```

3. **Score calculation**:
   ```sql
   -- Check responses and impacts
   SELECT
     lr.id,
     so.competency_impacts
   FROM learner_responses lr
   JOIN scenario_options so ON so.id = lr.selected_option_id
   WHERE lr.instance_id = 'your-instance-id';

   -- Verify score matches calculation
   -- Average of all competency impact values
   ```

4. **Completion time**:
   ```
   Expected formula:
   completion_time_seconds = (completed_at - started_at) in seconds

   Verify:
   - Time is reasonable
   - Matches actual duration
   ```

---

## Testing Checklist

### Pre-Test Setup

- [ ] Database running and accessible
- [ ] Environment variables configured (.env file)
- [ ] At least one published simulation exists
- [ ] Simulation has 2+ scenarios configured
- [ ] Scenarios have options with feedback
- [ ] Test user account created (learner role)

### Complete Flow Test

1. **Start Simulation**
   - [ ] Navigate to `/simulations/{id}/start`
   - [ ] Loading spinner appears
   - [ ] Instance created in database
   - [ ] Redirects to intro or first scenario

2. **Scenario Introduction**
   - [ ] Title and description display
   - [ ] Video plays (if configured)
   - [ ] Can skip video
   - [ ] Continue button works

3. **Make Decision**
   - [ ] Question displays correctly
   - [ ] All options visible
   - [ ] Timer works (if enabled)
   - [ ] Can select option
   - [ ] Response saved to database

4. **View Feedback**
   - [ ] Selected option shown
   - [ ] Feedback text appropriate for difficulty
   - [ ] Decision time displayed
   - [ ] Learning recommendations show
   - [ ] Can continue

5. **Complete Simulation**
   - [ ] Last scenario completes
   - [ ] Completion API called
   - [ ] Instance marked complete
   - [ ] Scores calculated
   - [ ] Redirects to results

### API Endpoints Test

Test each endpoint using Postman, curl, or browser dev tools:

- [ ] `POST /api/simulations/{id}/instances` - Create instance
- [ ] `GET /api/simulations/{id}/instances` - Get user instances
- [ ] `POST /api/instances/{id}/responses` - Save response
- [ ] `GET /api/instances/{id}/responses` - Get responses
- [ ] `POST /api/instances/{id}/complete` - Complete simulation
- [ ] `PATCH /api/instances/{id}` - Update instance
- [ ] `GET /api/scenarios/{id}/options` - Get options
- [ ] `GET /api/simulations/{id}/scenarios` - Get scenarios

### Database Verification

After completing a simulation, verify:

```sql
-- Instance created and completed
SELECT * FROM simulation_instances WHERE id = 'instance-id';

-- All responses recorded
SELECT * FROM learner_responses WHERE instance_id = 'instance-id';

-- Competency scores tracked (if configured)
SELECT * FROM learner_competency_scores WHERE instance_id = 'instance-id';
```

Expected results:
- [ ] Instance status = 'completed'
- [ ] All responses present
- [ ] Timestamps correct
- [ ] Scores calculated

### Edge Cases

- [ ] Start simulation with invalid ID - shows error
- [ ] Navigate without active session - redirects to dashboard
- [ ] Skip all videos - can proceed normally
- [ ] Make decision after timer expires - still works
- [ ] Session persists across page refreshes
- [ ] Multiple attempts create separate instances
- [ ] Incomplete simulation shows as 'in_progress'

### Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

### Localization (if enabled)

- [ ] Switch language - UI updates
- [ ] Scenario content translates
- [ ] Feedback translates
- [ ] Error messages translate

---

## Common Issues & Solutions

### Issue: Session state lost on refresh
**Solution**: Session should persist via Zustand. If lost, may need to add persistence middleware or use sessionStorage.

### Issue: Video doesn't autoplay
**Solution**: Browser autoplay policies vary. Muted videos more likely to autoplay. Provide clear play button.

### Issue: Completion doesn't trigger
**Solution**: Verify `next_scenario_id` is null for last option. Check feedback page Continue handler.

### Issue: Scores show as 0
**Solution**: Ensure options have `competency_impacts` configured. Check completion API calculation logic.

### Issue: Timer not showing
**Solution**: Verify scenario has `has_timer=true` and `timer_seconds` set. Check DecisionTimer component import.

---

## Testing Tools

### Browser DevTools
- Network tab: Monitor API calls
- Console: Check for errors
- Application tab: View session storage
- React DevTools: Inspect component state

### Database Tools
- pgAdmin, DBeaver, or psql CLI
- Run SQL queries to verify data
- Check constraints and relationships

### API Testing
- Postman or Insomnia
- curl commands
- Browser fetch in console

### Example Test Queries

```sql
-- Get latest simulations
SELECT * FROM simulations ORDER BY created_at DESC LIMIT 5;

-- Get simulation with scenarios
SELECT s.*, ss.id as scenario_id, ss.scenario_name
FROM simulations s
LEFT JOIN simulation_scenarios ss ON ss.simulation_id = s.id
WHERE s.id = 'sim-id';

-- Get learner's progress
SELECT
  si.simulation_id,
  si.status,
  si.started_at,
  COUNT(lr.id) as responses_count
FROM simulation_instances si
LEFT JOIN learner_responses lr ON lr.instance_id = si.id
WHERE si.user_id = 'user-id'
GROUP BY si.id;

-- Get simulation path taken
SELECT
  lr.responded_at,
  s.scenario_name,
  so.option_text,
  lr.response_time_seconds
FROM learner_responses lr
JOIN simulation_scenarios s ON s.id = lr.scenario_id
JOIN scenario_options so ON so.id = lr.selected_option_id
WHERE lr.instance_id = 'instance-id'
ORDER BY lr.responded_at;
```

---

## Feature Parity Checklist

Comparing with Vite app features:

✅ **Fully Implemented:**
- Session state management
- Simulation startup & instance creation
- Scenario introductions with video
- Timed and untimed decisions
- Difficulty-based feedback
- Learning recommendations display
- Video player with YouTube support
- Competency impact tracking
- Completion detection and scoring
- Timer components (countdown/elapsed)
- Progress indicators
- Branching scenario logic
- Database integration
- API endpoints for all operations

✅ **Equivalent or Better:**
- LearningRecommendationsDisplay (new component)
- Enhanced video player with better YouTube support
- Cleaner API architecture
- Better error handling

---

## Next Steps for Enhancement

While feature parity is achieved, consider these enhancements:

1. **Results Page**: Create comprehensive results page showing all metrics
2. **Resume Simulation**: Allow resuming in-progress simulations
3. **Assignment Integration**: Full LMS/assignment linking
4. **Analytics Dashboard**: Admin view of learner progress
5. **Export Results**: PDF or CSV export of simulation results
6. **Transition Videos**: Support for transition videos between scenarios
7. **BRAVIN Metrics**: Full BRAVIN scoring integration
8. **Alignment Meeting**: Specialized alignment meeting scenarios

---

## Support & Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Verify database schema matches expectations
3. Ensure all environment variables set correctly
4. Test API endpoints independently
5. Review network tab for failed requests
6. Check server logs for backend errors

For questions about specific features, refer to the component source code and inline comments.
