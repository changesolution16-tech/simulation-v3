# Simulation Scenarios Table Schema Guide

## Overview

The `simulation_scenarios` table is a **junction table** that stores scenarios specifically created within simulations. It's different from the `scenarios` table in several important ways.

## Two Scenario Storage Patterns

### Pattern 1: `scenarios` Table (Legacy/Reusable)
- General-purpose scenarios that can be reused across multiple simulations
- Linked to simulations via `simulation_id` foreign key
- More complex schema with multilingual support
- Used by the scenario edit API at `/api/scenarios/[id]`

### Pattern 2: `simulation_scenarios` Table (Current Active Use)
- Scenarios created specifically within a simulation context
- Embedded directly in the simulation's workflow
- Simpler schema focused on the simulation flow
- Used by the simulation management UI at `/admin/simulations/[id]/edit`

## Current Active Implementation

Based on code analysis, **Pattern 2 (`simulation_scenarios`)** is the actively used approach:

```typescript
// ScenarioManager.tsx creates scenarios via this route:
POST /api/simulations/${simulationId}/scenarios

// Which inserts directly into simulation_scenarios table
```

## simulation_scenarios Table Structure

### Core Identification
```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
simulation_id         uuid NOT NULL REFERENCES simulations(id)
scenario_id           uuid REFERENCES scenarios(id)  -- Optional legacy link
created_at            timestamp with time zone DEFAULT now()
updated_at            timestamp with time zone DEFAULT now()  -- ADDED
user_id               uuid
```

### Content Fields
```sql
scenario_name         text  -- Display name
question_text         text  -- The decision question
hierarchy_level       integer  -- 1-5 organizational level
order_index           integer  -- Ordering within simulation
```

### Flow Control
```sql
is_entry_point        boolean DEFAULT false
is_exit_point         boolean DEFAULT false
sequence_order        integer DEFAULT 0
position_x            integer DEFAULT 0  -- For visual editor
position_y            integer DEFAULT 0  -- For visual editor
notes                 text
```

### Video Configuration

#### Main/Prompt Video
```sql
video_url             text
video_source          text
video_library_id      uuid
```

#### Introduction Video (shown before question)
```sql
introduction_video_url           text
introduction_video_source        text
introduction_video_library_id    uuid
```

#### Transition Video (shown between scenarios)
```sql
transition_video_url             text      -- ADDED
transition_video_source          text      -- ADDED
transition_video_library_id      uuid      -- ADDED
```

### Timer Settings
```sql
has_timer             boolean
timer_seconds         integer
```

## Missing Columns to Add

Run `fix-simulation-scenarios-schema.sql` to add:

1. **`transition_video_url`** (text)
   - URL for transition video between scenarios
   - Used in POST /api/simulations/[id]/scenarios

2. **`transition_video_source`** (text, default: 'url')
   - Source type for transition video
   - Used in POST /api/simulations/[id]/scenarios

3. **`transition_video_library_id`** (uuid)
   - Reference to video library for transition
   - Used in POST /api/simulations/[id]/scenarios

4. **`updated_at`** (timestamp with time zone)
   - Timestamp of last modification
   - Referenced in SELECT queries

## API Usage Patterns

### Create Scenario in Simulation
```typescript
POST /api/simulations/${simulationId}/scenarios

Body: {
  scenario_name: string,
  question_text: string,
  hierarchy_level: number (1-5),
  video_url?: string,
  video_source?: string,
  order_index?: number,
  has_timer: boolean,
  timer_seconds?: number,
  video_library_id?: uuid,
  introduction_video_url?: string,
  introduction_video_source?: string,
  introduction_video_library_id?: uuid,
  transition_video_url?: string,           // NEEDS COLUMN
  transition_video_source?: string,        // NEEDS COLUMN
  transition_video_library_id?: uuid      // NEEDS COLUMN
}
```

### Fetch Scenarios for Simulation
```typescript
GET /api/simulations/${simulationId}/scenarios

Returns: [{
  id: uuid,
  scenario_name: string,
  question_text: string,
  hierarchy_level: number,
  video_url: string,
  video_source: string,
  order_index: number,
  has_timer: boolean,
  timer_seconds: number,
  created_at: timestamp,
  updated_at: timestamp,              // NEEDS COLUMN
  option_count: number
}]
```

### Fetch Single Scenario
```typescript
GET /api/scenarios/${scenarioId}

// Note: This queries the `scenarios` table, NOT simulation_scenarios
// Returns scenario with options
```

## Component Usage

### ScenarioManager Component
**Location:** `/src/components/admin/ScenarioManager.tsx`

**Purpose:** Main UI for creating/managing scenarios within a simulation

**Operations:**
1. **List Scenarios** - Fetches from `simulation_scenarios` via simulation_id
2. **Create Scenario** - Inserts into `simulation_scenarios`
3. **Delete Scenario** - Removes from `simulation_scenarios`
4. **Edit Scenario** - Redirects to `/admin/scenarios/[id]/edit`

**Key Features:**
- Displays scenarios in order (order_index)
- Shows hierarchy level badges (1-5)
- Indicates if timer is enabled
- Shows if video is attached
- Allows reordering (via order_index)

### Edit Scenario Page
**Location:** `/src/app/(dashboard)/admin/scenarios/[id]/edit/page.tsx`

**Purpose:** Edit individual scenario details

**Reads:** Both `scenarios` and `simulation_scenarios` tables
**Updates:** Updates the `scenarios` table fields

**Editable Fields:**
- scenario_name / title
- question_text
- hierarchy_level
- video_url / prompt_video_url
- has_timer / timer_enabled
- timer_seconds / timer_limit_seconds

## Learner Flow Pages

### 1. Scenario Introduction Page
**Route:** `/simulations/[id]/scenario/[scenarioId]/introduction`

**Queries `simulation_scenarios` for:**
- scenario_name (title)
- question_text (context)
- introduction_video_url (main video)
- hierarchy_level (badge)
- timer_seconds (estimated time)

### 2. Question/Decision Page
**Route:** `/simulations/[id]/scenario/[scenarioId]/question`

**Queries `simulation_scenarios` for:**
- scenario_name
- question_text (main question)
- hierarchy_level
- has_timer
- timer_seconds
- Fetches options from `scenario_options`

### 3. Feedback Page
**Route:** `/simulations/[id]/scenario/[scenarioId]/feedback`

**Uses:**
- transition_video_url (if navigating to next scenario)
- scenario data for context
- Response data from learner_responses

## Data Flow

```
Admin Creates Simulation
    ↓
Admin Adds Scenarios via ScenarioManager
    ↓
POST /api/simulations/[id]/scenarios
    ↓
INSERT INTO simulation_scenarios (...)
    ↓
Admin Configures Options via ScenarioOptionsManager
    ↓
INSERT INTO scenario_options (scenario_id = simulation_scenarios.id)
    ↓
Learner Starts Simulation
    ↓
GET /api/simulations/[id]/scenarios
    ↓
SELECT FROM simulation_scenarios WHERE simulation_id = ?
    ↓
Learner Sees Introduction (introduction_video_url)
    ↓
Learner Answers Question
    ↓
POST /api/instances/[id]/responses
    ↓
Transition Video Plays (transition_video_url)
    ↓
Next Scenario or Completion
```

## Relationship Between Tables

### simulation_scenarios ↔ scenario_options
```sql
-- Options belong to scenarios
scenario_options.scenario_id → simulation_scenarios.id

-- Each scenario can have multiple options
SELECT *
FROM scenario_options
WHERE scenario_id = ${simulationScenarioId}
ORDER BY option_order
```

### simulation_scenarios ↔ learner_responses
```sql
-- Responses reference scenarios
learner_responses.scenario_id → simulation_scenarios.id

-- Track which scenario was answered
INSERT INTO learner_responses (
  instance_id,
  scenario_id,  -- simulation_scenarios.id
  selected_option_id,
  response_time_seconds
)
```

### simulation_scenarios ↔ simulations
```sql
-- Scenarios belong to simulations
simulation_scenarios.simulation_id → simulations.id

-- Get all scenarios in a simulation
SELECT * FROM simulation_scenarios
WHERE simulation_id = ${simulationId}
ORDER BY order_index ASC
```

## Video URL Priority

When displaying videos, the code checks multiple sources in order:

### Prompt/Question Video
1. `video_url` (direct URL)
2. `video_library_id` (fetch from library)
3. Fall back to no video

### Introduction Video
1. `introduction_video_url` (direct URL)
2. `introduction_video_library_id` (fetch from library)
3. Fall back to no video

### Transition Video
1. `transition_video_url` (direct URL) ← **NEEDS COLUMN**
2. `transition_video_library_id` (fetch from library) ← **NEEDS COLUMN**
3. Fall back to no video

## Recommended Actions

### 1. Add Missing Columns
```bash
psql $DATABASE_URL -f fix-simulation-scenarios-schema.sql
```

### 2. Verify Schema
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'simulation_scenarios'
ORDER BY ordinal_position;
```

### 3. Test Scenario Creation
1. Navigate to `/admin/simulations/[id]/edit`
2. Create a new scenario with all fields filled
3. Verify INSERT succeeds without errors
4. Check that transition video fields are saved

### 4. Test Learner Flow
1. Start a simulation as a learner
2. Verify introduction video displays
3. Answer question and move to next scenario
4. Verify transition video plays (if configured)

## Migration Strategy

If you have existing data in both `scenarios` and `simulation_scenarios`:

### Option A: Consolidate to simulation_scenarios (Recommended)
```sql
-- Copy missing data from scenarios to simulation_scenarios
UPDATE simulation_scenarios ss
SET
  scenario_name = COALESCE(ss.scenario_name, s.title),
  question_text = COALESCE(ss.question_text, s.question_text),
  hierarchy_level = COALESCE(ss.hierarchy_level, s.hierarchy_level),
  introduction_video_url = COALESCE(ss.introduction_video_url, s.introduction_video_url),
  transition_video_url = COALESCE(ss.transition_video_url, s.transition_video_url)
FROM scenarios s
WHERE ss.scenario_id = s.id
  AND ss.scenario_id IS NOT NULL;
```

### Option B: Keep Both Tables
- Use `scenarios` for reusable scenario templates
- Use `simulation_scenarios` for simulation-specific instances
- Ensure `simulation_scenarios.scenario_id` references parent template

## Performance Optimization

### Recommended Indexes
```sql
-- Already in fix script:
CREATE INDEX idx_simulation_scenarios_simulation_id ON simulation_scenarios(simulation_id);
CREATE INDEX idx_simulation_scenarios_order_index ON simulation_scenarios(order_index);
CREATE INDEX idx_simulation_scenarios_hierarchy_level ON simulation_scenarios(hierarchy_level);
```

### Query Optimization Tips
1. Always filter by `simulation_id` first
2. Use `order_index` for ordering (not created_at)
3. Batch fetch scenarios and options in single query when possible
4. Cache scenario data on client side during simulation play

## Troubleshooting

### Error: column "transition_video_url" does not exist
**Solution:** Run `fix-simulation-scenarios-schema.sql`

### Error: column "updated_at" does not exist
**Solution:** Run `fix-simulation-scenarios-schema.sql`

### Scenarios not appearing in simulation
**Check:**
```sql
SELECT * FROM simulation_scenarios
WHERE simulation_id = 'your-simulation-id'
ORDER BY order_index;
```

### Video not playing
**Check video URL fields:**
```sql
SELECT
  id,
  scenario_name,
  video_url,
  introduction_video_url,
  transition_video_url
FROM simulation_scenarios
WHERE id = 'your-scenario-id';
```

### Timer not working
**Check timer fields:**
```sql
SELECT
  id,
  scenario_name,
  has_timer,
  timer_seconds
FROM simulation_scenarios
WHERE id = 'your-scenario-id';
```

## Future Enhancements

### Planned Features
- Branching logic editor (using position_x, position_y)
- Scenario templates (copy from `scenarios` table)
- Bulk import/export
- Scenario versioning
- A/B testing variants

### Schema Evolution
Consider adding:
- `description` text - Context/setup text
- `description_en` / `description_es` - Multilingual descriptions
- `question_text_en` / `question_text_es` - Multilingual questions
- `estimated_duration_seconds` - For progress tracking
- `prerequisite_scenario_ids` jsonb - Learning path dependencies
- `metadata` jsonb - Flexible additional data

## Summary

**Current State:**
- `simulation_scenarios` table is actively used for scenario management
- Missing 3 video-related columns and updated_at
- Code tries to insert into missing columns → will fail

**Action Required:**
1. Run `fix-simulation-scenarios-schema.sql` to add missing columns
2. Test scenario creation in admin UI
3. Verify learner flow with videos
4. Consider consolidating `scenarios` and `simulation_scenarios` usage

**Key Distinction:**
- `scenarios` = Reusable templates (optional)
- `simulation_scenarios` = Actual scenarios in simulations (required)
