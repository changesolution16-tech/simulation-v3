# Simulation Flow Implementation Guide

## Overview

This document describes the complete simulation flow system built for the soft skills training platform. The system enables learners to progress through interactive, branching scenarios with video content, decision-making, and personalized feedback.

## Architecture

The simulation flow consists of three main phases:

### Phase 1: Core Flow (Complete)
- Scenario options management system
- Introduction pages (simulation and scenario level)
- Question/decision pages
- Feedback pages with results

### Phase 2: Integrations (Complete)
- Video player component (YouTube and direct video support)
- BRAVIN metrics scoring
- Competency tracking
- Scenario navigation and branching logic

### Phase 3: Polish (Complete)
- Configuration validation
- Error handling
- Build optimization

---

## System Components

### 1. Scenario Options Management

**Location:** `/src/components/admin/ScenarioOptionsManager.tsx`

**Purpose:** Provides a comprehensive interface for creating and managing response options for each scenario.

**Features:**
- Create, edit, and delete options
- Define feedback text for different difficulty levels
- Add feedback videos (YouTube or direct links)
- Configure branching logic (which scenario plays next)
- Visual option ordering with letter labels (A, B, C, etc.)

**API Endpoints Used:**
- `GET /api/scenarios/[id]/options` - Fetch all options for a scenario
- `POST /api/scenarios/[id]/options` - Create a new option
- `PATCH /api/options/[id]` - Update an existing option
- `DELETE /api/options/[id]` - Delete an option

**Usage:**
```tsx
<ScenarioOptionsManager
  scenarioId={scenarioId}
  simulationId={simulationId}
/>
```

### 2. Scenario Edit Page

**Location:** `/src/app/(dashboard)/admin/scenarios/[id]/edit/page.tsx`

**Purpose:** Centralized page for editing scenario details and managing options.

**Features:**
- Two-tab interface: Details and Response Options
- Edit scenario name, question, hierarchy level
- Configure video URLs and timers
- Integrated options manager

**Access:** Navigate from Admin > Simulations > Scenarios tab > Click "Edit" on any scenario

### 3. Simulation Introduction Page

**Location:** `/src/app/(dashboard)/simulations/[id]/intro/page.tsx`

**Component:** `/src/components/simulation/SimulationIntroduction.tsx`

**Purpose:** Welcome learners to the simulation and provide context.

**Features:**
- Display simulation title and description
- Show introduction video (YouTube or direct)
- Participation agreement checkbox
- Video skip functionality
- Auto-advance when video completes

**Flow:**
```
User clicks "Start Simulation"
  ↓
Create simulation instance via API
  ↓
Load simulation intro page
  ↓
Watch video + agree to participate
  ↓
Navigate to first scenario
```

### 4. Scenario Introduction Page

**Location:** `/src/app/(dashboard)/simulations/[id]/scenario/[scenarioId]/introduction/page.tsx`

**Purpose:** Introduce each individual scenario with context and video.

**Features:**
- Progress indicator showing current step (1 of 3)
- Scenario title and description
- Introduction video player
- Hierarchy level display
- Estimated time display

**Flow:**
```
Load scenario data
  ↓
Display scenario context
  ↓
Play introduction video (if configured)
  ↓
Continue to question page
```

### 5. Question/Decision Page

**Location:** `/src/app/(dashboard)/simulations/[id]/scenario/[scenarioId]/question/page.tsx`

**Purpose:** Present the scenario question and response options to learners.

**Features:**
- Display scenario description and question
- Show all response options with letter labels (A, B, C, etc.)
- Track decision time from page load
- Progress indicator showing current step (2 of 3)
- Hierarchy level and simulation info

**Key Functions:**
- `loadData()` - Fetches simulation and scenario with options
- `handleOptionSelect(optionId)` - Saves response and navigates to feedback

**API Flow:**
```javascript
// Save learner response
POST /api/instances/[instanceId]/responses
{
  scenario_id: string,
  selected_option_id: string,
  response_time_seconds: number
}

// Response includes:
{
  id: string,
  next_scenario_id: string,
  competency_impacts: object,
  skill_impacts: object
}
```

### 6. Feedback Page

**Location:** `/src/app/(dashboard)/simulations/[id]/scenario/[scenarioId]/feedback/page.tsx`

**Purpose:** Provide feedback on the learner's decision and guidance.

**Features:**
- Display feedback text based on difficulty level
- Show feedback video if configured
- Display decision time metrics
- Progress indicator showing current step (3 of 3)
- Automatic navigation to next scenario or completion

**Flow:**
```
Load feedback data
  ↓
Display feedback text/video
  ↓
Show decision time (if timer enabled)
  ↓
Wait for video completion or skip
  ↓
Check for next scenario
  ↓
If next scenario exists → Navigate to next introduction
  ↓
If no next scenario → Mark complete & show results
```

### 7. Video Player Component

**Location:** `/src/components/simulation/VideoPlayer.tsx`

**Purpose:** Universal video player supporting multiple sources.

**Features:**
- YouTube embed support (auto-converts URLs)
- Direct video file support
- Auto-play capability
- Skip button (optional)
- Video completion tracking
- Responsive aspect-ratio container

**Supported Formats:**
- YouTube URLs (`youtube.com/watch?v=...` or `youtu.be/...`)
- Direct video files (MP4, WebM, etc.)

**Usage:**
```tsx
<VideoPlayer
  videoUrl="https://www.youtube.com/watch?v=..."
  videoType="introduction"
  onComplete={() => setVideoWatched(true)}
  onSkip={() => setVideoWatched(true)}
  autoPlay={true}
  allowSkip={true}
/>
```

---

## Complete Learner Journey

### Step 1: Start Simulation
1. Learner selects simulation from dashboard
2. Clicks "Play" or "Start Simulation"
3. System creates `simulation_instance` record
4. Instance ID stored in session storage

### Step 2: Simulation Introduction
1. Shows simulation title, description
2. Plays introduction video (if configured)
3. Requires participation agreement checkbox
4. Clicks "Let's Begin"

### Step 3: Scenario Loop
For each scenario in the simulation:

#### 3.1 Scenario Introduction
- Shows scenario context
- Plays introduction video (if configured)
- Clicks "Continue"

#### 3.2 Question/Decision
- Shows scenario description
- Displays question text
- Shows 2-6 response options
- Tracks time from page load
- Learner selects an option
- System saves response to database

#### 3.3 Feedback
- Shows feedback for selected option
- Plays feedback video (if configured)
- Shows decision time metrics
- Checks for next scenario:
  - If exists → Return to 3.1 for next scenario
  - If none → Continue to Step 4

### Step 4: Completion
1. Mark instance as `completed`
2. Calculate final scores
3. Navigate to results page

---

## Database Schema

### Key Tables

**simulations**
- `id` - UUID primary key
- `name` - Internal name
- `display_name` - User-facing name
- `description` - Simulation overview
- `introduction_video_url` - Opening video
- `status` - published/draft/archived
- `difficulty` - beginner/intermediate/advanced

**scenarios**
- `id` - UUID primary key
- `simulation_id` - Foreign key
- `title` - Scenario name
- `question_text` - The decision question
- `hierarchy_level` - Position in org chart (1-5)
- `prompt_video_url` - Introduction video
- `timer_enabled` - Boolean
- `timer_limit_seconds` - Integer

**scenario_options**
- `id` - UUID primary key
- `scenario_id` - Foreign key
- `option_text` - The response choice
- `option_order` - Display order
- `next_scenario_id` - Branching logic
- `feedback_beginner` - Feedback text
- `feedback_intermediate` - Feedback text
- `feedback_advanced` - Feedback text
- `feedback_video_url_beginner` - Feedback video
- `competency_impacts` - JSON object
- `skill_impacts` - JSON object

**simulation_instances**
- `id` - UUID primary key
- `simulation_id` - Foreign key
- `user_id` - Learner ID
- `difficulty` - Selected difficulty
- `status` - in_progress/completed/abandoned
- `started_at` - Timestamp
- `completed_at` - Timestamp

**learner_responses**
- `id` - UUID primary key
- `instance_id` - Foreign key
- `scenario_id` - Foreign key
- `selected_option_id` - Foreign key
- `response_time_seconds` - Integer
- `responded_at` - Timestamp

**learner_competency_scores**
- `id` - UUID primary key
- `user_id` - Foreign key
- `competency_id` - Foreign key
- `simulation_id` - Foreign key
- `instance_id` - Foreign key
- `response_id` - Foreign key
- `score_change` - Decimal (can be negative)
- `recorded_at` - Timestamp

---

## API Reference

### Simulations

**GET /api/simulations/[id]**
- Returns simulation with all scenarios and options
- Includes nested relationships

**POST /api/simulations/[id]/instances**
- Creates new instance (starts simulation)
- Body: `{ difficulty, assignment_id }`
- Returns: Instance object with ID

**GET /api/simulations/[id]/instances**
- Lists all instances for a simulation
- Filtered by user (non-admins see only their own)

### Scenarios

**GET /api/scenarios/[id]**
- Returns scenario with all options
- Includes competency mappings

**PATCH /api/scenarios/[id]**
- Updates scenario details
- Body: `{ title, question_text, hierarchy_level, ... }`

**GET /api/scenarios/[id]/options**
- Returns all options for a scenario
- Ordered by `option_order`

**POST /api/scenarios/[id]/options**
- Creates new option
- Body: `{ option_text, feedback_beginner, next_scenario_id, ... }`

### Options

**PATCH /api/options/[id]**
- Updates existing option
- Body: Any option field

**DELETE /api/options/[id]**
- Deletes option
- Admin/instructor only

### Instances

**POST /api/instances/[id]/responses**
- Saves learner response
- Body: `{ scenario_id, selected_option_id, response_time_seconds }`
- Automatically records competency impacts
- Returns: Response with next_scenario_id

**GET /api/instances/[id]/responses**
- Lists all responses for an instance
- Includes scenario and option details

---

## Admin Workflow

### Creating a Simulation

1. **Navigate to Admin > Simulations**
2. **Click "Create New Simulation"**
3. **Fill in basic details:**
   - Name (internal reference)
   - Display Name (shown to learners)
   - Description
   - Introduction Video URL (optional)
   - Difficulty level

4. **Add Scenarios:**
   - Click "Scenarios" tab
   - Click "Add Scenario"
   - Enter scenario details:
     - Title
     - Question text
     - Hierarchy level (1-5)
     - Introduction video (optional)
     - Timer settings (optional)

5. **Configure Options:**
   - Click "Edit" on any scenario
   - Go to "Response Options" tab
   - Click "Add First Option"
   - For each option, configure:
     - Option text (the choice)
     - Next scenario (for branching)
     - Feedback text (beginner/intermediate/advanced)
     - Feedback videos (optional)
   - Add 2-6 options per scenario

6. **Set Branching Logic:**
   - For each option, select which scenario plays next
   - Leave blank to end simulation
   - Create multiple paths based on decisions

7. **Publish:**
   - Review all scenarios and options
   - Change status to "Published"
   - Simulation is now available to learners

### Best Practices

**Scenario Design:**
- Keep scenarios focused on one decision point
- Write clear, specific questions
- Provide 3-5 response options
- Use realistic workplace language

**Feedback:**
- Be constructive and educational
- Explain why choices are effective or not
- Provide actionable guidance
- Vary feedback by difficulty level

**Videos:**
- Keep introduction videos under 3 minutes
- Make feedback videos under 2 minutes
- Use YouTube for easier hosting
- Test all video URLs before publishing

**Branching:**
- Plan your flow diagram before building
- Ensure all paths lead to completion
- Avoid circular references
- Test all branches thoroughly

---

## Troubleshooting

### Videos Not Playing

**YouTube videos:**
- Ensure URL is in format: `https://www.youtube.com/watch?v=VIDEO_ID`
- Check video is not private or restricted
- System auto-converts to embed format

**Direct videos:**
- Verify file is accessible via URL
- Check file format (MP4 recommended)
- Ensure CORS headers allow access

### Options Not Loading

**Check:**
1. Scenario has options in database
2. Options have `scenario_id` set correctly
3. API endpoint returns 200 status
4. Browser console for errors

**Fix:**
- Navigate to scenario edit page
- Add or recreate options
- Verify in database: `SELECT * FROM scenario_options WHERE scenario_id = '...'`

### Instance Not Creating

**Check:**
1. User is authenticated
2. Simulation is published (for learners)
3. Database connection is working

**Fix:**
- Check browser network tab for 401/403 errors
- Verify user session is valid
- Check API logs for database errors

### Navigation Issues

**Check:**
1. `next_scenario_id` is set correctly
2. Next scenario exists in database
3. Instance ID is in session storage

**Fix:**
- Edit option and set correct next scenario
- Clear browser cache and session storage
- Restart simulation

---

## Technical Notes

### Performance Considerations

- Videos load asynchronously (non-blocking)
- Scenario data is fetched on-demand
- Instance ID cached in session storage
- Database queries use indexes on foreign keys

### Browser Compatibility

- Tested on Chrome, Firefox, Safari, Edge
- Requires JavaScript enabled
- Supports modern ES6+ features
- Responsive design for mobile devices

### Security

- All API endpoints require authentication
- RLS policies enforce data access rules
- Admin/instructor role required for editing
- Learners can only access their own instances

### Data Privacy

- Responses stored with user consent
- Decision times tracked for analytics
- No personal data in video URLs
- Competency scores tied to user accounts

---

## Future Enhancements

### Planned Features

- **Multi-language support** - Translate scenarios and feedback
- **Advanced analytics** - Detailed path analysis and heatmaps
- **Scenario templates** - Quick-start common scenarios
- **Bulk import/export** - JSON/CSV scenario management
- **Media library** - Centralized video asset management
- **Peer comparison** - Show how others responded
- **Scenario previews** - Test flow before publishing
- **Adaptive difficulty** - Adjust based on performance

### Integration Opportunities

- LMS integration (SCORM, LTI)
- Slack/Teams notifications
- Calendar scheduling for assignments
- Email reminders and summaries
- Gamification badges and leaderboards

---

## Support

For questions or issues:

1. Check this documentation
2. Review API logs in browser console
3. Test with a simple scenario first
4. Verify database connections
5. Check user permissions and roles

## Version History

- **v1.0.0** (Current) - Initial complete implementation
  - Core simulation flow
  - Video player integration
  - Options management system
  - BRAVIN metrics tracking
  - Competency scoring
  - Complete admin interface
