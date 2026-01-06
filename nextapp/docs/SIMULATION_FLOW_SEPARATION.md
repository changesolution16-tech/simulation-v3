# Simulation Landing Page and Introduction Page Separation

## Overview
The simulation flow has been successfully separated into distinct pages with clear purposes:

1. **Landing Page** - Information and preview (no session required)
2. **Introduction Page** - Commitment and preparation (requires active session)
3. **Scenario Pages** - Actual simulation gameplay

## Complete User Flow

### For Learners:
1. **Browse Simulations** (Category Browser in Learner Dashboard)
   - View simulation cards organized by category
   - Click on a simulation card to preview

2. **Landing Page** (`/simulation/:simulationId/landing`)
   - View simulation details without starting
   - See: title, description, image, learning objectives, estimated duration
   - Optional: Watch intro video
   - Button: "Start Simulation"
   - **No session is created yet**

3. **Start Simulation** (SimulationPlayer - `/simulation/play/:simulationId`)
   - Creates simulation instance in database
   - Initializes session in store
   - Redirects to Introduction Page

4. **Introduction Page** (`/simulation/:simulationId/intro`)
   - Requires active session
   - Shows: introduction title, journey overview video, participation agreement
   - User must check agreement checkbox
   - Button: "Begin Simulation"
   - Navigates to first scenario

5. **Scenario Flow** - Actual simulation gameplay begins

### For Admins:
1. **Admin Preview Modal**
   - Shows simulation configuration details
   - Lists all scenarios
   - Shows landing page and closing page info
   - Button: "Preview Simulation" → navigates to Landing Page

## Database Fields

### Landing Page Fields (simulations table):
- `landing_page_enabled` - boolean to enable/disable landing page
- `landing_title` - main title displayed on landing page
- `landing_description` - description text
- `landing_objectives` - JSON array of learning objectives
- `landing_role_description` - description of learner's role
- `landing_intro_video_url` - optional intro video URL
- `landing_image_url` - hero image URL
- `landing_image_alt` - alt text for image

### Introduction Page Fields (simulations table):
- `introduction_page_enabled` - boolean to enable/disable introduction page
- `introduction_title` - title shown on introduction page
- `introduction_description` - description of what to expect
- `introduction_video_url` - journey overview video URL
- Participation agreement - hardcoded text (can be made configurable later)

## Component Responsibilities

### SimulationLandingPage
- **Purpose**: Preview and information page
- **Session Required**: No
- **Shows**: Landing page fields only
- **Action**: "Start Simulation" button → navigates to `/simulation/play/:simulationId`

### SimulationPlayer
- **Purpose**: Session initialization handler
- **Session Required**: Yes (checks for currentUser)
- **Actions**: 
  1. Creates simulation_instances record
  2. Initializes session in store
  3. Redirects to introduction or first scenario

### SimulationIntroduction
- **Purpose**: Commitment and preparation page
- **Session Required**: Yes (checks for activeSession)
- **Shows**: Introduction page fields only
- **Action**: "Begin Simulation" button → navigates to first scenario

## Routing Structure

```
/simulation/:simulationId/landing          → SimulationLandingPage (no protection)
/simulation/play/:simulationId             → SimulationPlayer (protected)
/simulation/:simulationId/intro            → SimulationIntroduction (protected)
/simulation/:simulationId/scenario/:index  → Scenario pages (protected)
```

## Key Changes Made

1. **Created SimulationLandingPage component** - Dedicated landing page component
2. **Updated SimulationPlayer** - Removed landing page UI, now only handles session creation
3. **Updated SimulationIntroduction** - Now only uses introduction-specific fields
4. **Updated CategoryBrowser** - Navigates to landing page instead of starting simulation directly
5. **Updated SimulationPreviewModal** - Preview button navigates to landing page
6. **Updated App.tsx routing** - Added landing page route

## Testing Checklist

- [ ] Category Browser displays simulations correctly
- [ ] Clicking simulation card opens Landing Page
- [ ] Landing Page shows correct information (title, description, objectives, image)
- [ ] "Start Simulation" button on Landing Page works
- [ ] Session is created when starting simulation
- [ ] Introduction Page displays after starting
- [ ] Introduction Page shows correct fields (intro video, description, agreement)
- [ ] "Begin Simulation" button navigates to first scenario
- [ ] Admin preview modal opens Landing Page
- [ ] Back navigation works at each step

## Visual Flow Diagram

```
LEARNER FLOW:
┌─────────────────────────────────────────────────────────────────┐
│ 1. Category Browser (Learner Dashboard)                        │
│    - Browse simulations by category                             │
│    - Click simulation card                                      │
└────────────────────┬────────────────────────────────────────────┘
                     │ Click simulation card
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Landing Page (/simulation/:id/landing)                      │
│    ✓ NO SESSION REQUIRED                                        │
│    - Title, description, image                                  │
│    - Learning objectives                                        │
│    - Role description                                           │
│    - Optional intro video                                       │
│    [Start Simulation Button]                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │ Click "Start Simulation"
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. SimulationPlayer (/simulation/play/:id)                     │
│    ✓ SESSION CREATED HERE                                       │
│    - Creates simulation_instances record                        │
│    - Initializes session in store                              │
│    - Auto-redirects (no UI shown)                              │
└────────────────────┬────────────────────────────────────────────┘
                     │ Auto-redirect
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Introduction Page (/simulation/:id/intro)                   │
│    ✓ REQUIRES ACTIVE SESSION                                    │
│    - Introduction title                                         │
│    - Journey overview video                                     │
│    - What to expect description                                 │
│    - Participation agreement checkbox                           │
│    [Begin Simulation Button]                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │ Click "Begin Simulation"
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. First Scenario (/simulation/:id/scenario/0/introduction)    │
│    - Actual simulation gameplay begins                          │
└─────────────────────────────────────────────────────────────────┘


ADMIN FLOW:
┌─────────────────────────────────────────────────────────────────┐
│ Admin Panel → Simulation List → Click "Preview"                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ Preview Modal (Admin Only)                                      │
│    - Shows simulation configuration                             │
│    - Lists scenarios                                            │
│    - Shows landing/closing page config                         │
│    [Preview Simulation Button]                                  │
└────────────────────┬────────────────────────────────────────────┘
                     │ Click "Preview Simulation"
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ Landing Page (same as learner sees)                            │
│    - Admin can preview what learners will see                  │
└─────────────────────────────────────────────────────────────────┘
```

## Field Mapping

| Page | Database Field | Purpose |
|------|---------------|---------|
| **Landing Page** | `landing_title` | Main title |
| | `landing_description` | Simulation description |
| | `landing_objectives` | Learning objectives list |
| | `landing_role_description` | Learner's role |
| | `landing_intro_video_url` | Preview video |
| | `landing_image_url` | Hero image |
| **Introduction Page** | `introduction_title` | Page title |
| | `introduction_description` | What to expect |
| | `introduction_video_url` | Journey overview |
| | Agreement text | Hardcoded (for now) |

