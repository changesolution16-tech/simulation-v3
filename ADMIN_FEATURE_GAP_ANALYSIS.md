# Admin Feature Gap Analysis
## Complete Comparison: Vite App vs. Next.js App

**Analysis Date:** 2026-01-18
**Purpose:** Identify all missing admin features from the Vite app that need to be implemented in the Next.js application

---

## Executive Summary

The archived Vite app has a significantly more comprehensive admin interface compared to the current Next.js implementation. Key gaps include:

- **Missing 7-step simulation builder** (current has no builder at all)
- **Missing category manager** (current has no category system)
- **Missing video manager** (current has no video management interface)
- **Missing metrics manager** (current has basic competencies but no metrics management)
- **Missing bulk user upload** (current can only add users individually)
- **Missing sophisticated admin dashboard** with dropdown navigation
- **Missing auto-mapping** for competencies
- **Missing weight matrix editor** for competencies
- **Missing comprehensive scenario creation/editing** with multi-step wizards

---

## 1. Admin Dashboard Navigation (AdminDashboard.tsx)

### Vite App Features:
- **Dropdown menu system** grouped by sections:
  - User Management: users, cohorts, assignments
  - Simulations: categories, scenarios, flowbuilder, videos
  - Assessment: competencies, metrics
  - System: analytics, branding, settings
- Tab-based navigation with smooth animations using Framer Motion
- Active tab highlighting
- Click outside to close dropdowns

### Next.js Current State:
- Basic admin page with simple stats and links
- No dropdown navigation
- No grouped sections
- Missing tabs: categories, flowbuilder, videos, metrics, analytics, branding

### Implementation Priority: **HIGH**
This is the foundation - users need to be able to navigate to all admin features.

---

## 2. Simulation Builder (SimulationBuilder.tsx - 1763 lines)

### Vite App Features:

#### **7-Step Wizard:**
1. **Basic Info**: name, display_name, description, category, difficulty, duration
2. **Landing Page**:
   - Enable/disable toggle
   - Landing title, description
   - VideoInputSelectorWithLibrary for intro video
   - Learning objectives (add/remove dynamically)
   - Role description
   - ImageUpload component for landing image
   - Image alt text for accessibility
   - Fiction contract text customization

3. **Introduction Page**:
   - Enable/disable toggle
   - Title customization
   - Journey overview video with VideoInputSelectorWithLibrary
   - What to expect description
   - Participation agreement display

4. **Flow Builder**:
   - Available scenarios browser with search
   - Filter by topic and difficulty
   - Add/remove scenarios to simulation
   - Set entry point
   - Reorder scenarios (up/down arrows)
   - Sequence order management
   - Entry point indicator

5. **Metrics & Competencies**:
   - CompetencyWeightMatrixEditor integration
   - MetricCompetencyMappingManager integration
   - Only available after simulation is saved

6. **Closing Page**:
   - Enable/disable toggle
   - Closing title
   - Show before/after results toggle
   - **Performance-based video tiers:**
     - Excellent performance video (≥85% threshold)
     - Good performance video (70-84% threshold)
     - Developing performance video (<70% threshold)
   - Customizable threshold percentages
   - VideoInputSelectorWithLibrary for each tier
   - Analysis type selection (score/skill/journey/comprehensive)
   - Enable/disable personalized recommendations

7. **Review**:
   - Summary of all configuration
   - Scenario count display
   - Validation before save

#### **Additional Features:**
- Progress indicator showing completed steps (green checkmarks)
- Step navigation (click any step to jump)
- Previous/Next buttons with validation
- Create/Update modes (single component for both)
- Loading states throughout
- Comprehensive error handling
- Auto-slug generation from display name
- Video platform detection (YouTube/Synthesia/Vimeo)
- FormData structure with 40+ fields

### Next.js Current State:
- **NO simulation builder exists**
- Only basic simulation list page
- No simulation creation interface
- No simulation editing interface
- No landing/introduction/closing page configuration
- No performance-based videos
- No flow builder
- No integration with competency/metric systems

### Implementation Priority: **CRITICAL**
This is the core simulation authoring tool - absolutely essential.

---

## 3. Category Manager (CategoryManager.tsx - 679 lines)

### Vite App Features:

#### **Category Management:**
- Create/edit/delete categories
- **Analytics dashboard** with 4 stat cards:
  - Total categories (with active count)
  - Total simulations across all categories
  - Total category views
  - Unique learners engaged
- Show/hide analytics toggle
- **Sort options**: order, name, simulations, views
- **Category properties:**
  - Name, description
  - Icon selection (15 options from Lucide Icons)
  - Color picker (12 color options)
  - Display order
  - Active/inactive status
- **Category cards** showing:
  - Icon with custom color background
  - Name and description
  - Simulation count
  - Active/inactive badge
  - Analytics (when enabled): views, learners, started, completion rate
  - Click to drill down to simulations
  - Edit/delete actions

#### **Integration:**
- Clicks on category card → SimulationListView
- SimulationListView integrates SimulationBuilder
- SimulationBuilder has create/edit modes
- SimulationPreviewModal for previewing simulations

### Next.js Current State:
- **NO category system exists**
- No way to organize simulations
- No category-based navigation
- No category analytics
- Simulations page shows flat list without organization

### Implementation Priority: **HIGH**
Categories are essential for organizing simulations, especially as the library grows.

---

## 4. Video Manager (VideoManager.tsx - 758 lines)

### Vite App Features:

#### **4-Tab Interface:**

1. **Manage Videos Tab:**
   - Add video form with:
     - Scenario selector
     - Video type selector (introduction/prompt/transition/feedback/conclusion)
     - Difficulty level for feedback videos (beginner/intermediate/advanced)
     - VideoInputSelector for flexible video input
   - Videos list table showing:
     - Scenario name and difficulty
     - Video type badge with color coding
     - Upload date
     - Actions: Preview, Edit, Delete
   - Edit mode highlights at top
   - Success/error notifications
   - Video URL validation tool

2. **Video Library Tab:**
   - Shows VideoLibrary component
   - Centralized video asset management

3. **YouTube Test Tab:**
   - YouTubeTestTool component
   - Test YouTube embed functionality

4. **Debug Videos Tab:**
   - VideoInputSelector for testing any video
   - VideoDebugger component
   - Comprehensive video troubleshooting

#### **Video Operations:**
- Load all videos from scenarios and scenario_options
- Support for multiple video types per scenario
- Difficulty-based feedback videos (applied to ALL options in scenario)
- Preview modal with SynthesiaPlayer
- Video validation (check URL accessibility)
- Edit existing videos (pre-populate form)
- Delete videos (clear URLs in database)

### Next.js Current State:
- **NO video management interface exists**
- No way to add/edit/delete videos through UI
- No video library
- No video debugging tools
- No video preview functionality
- Current video management requires direct database access

### Implementation Priority: **HIGH**
Videos are core content - instructors need a way to manage them.

---

## 5. Metrics Manager (MetricsManager.tsx - 433 lines)

### Vite App Features:

#### **Metric Management:**
- **14 Metric Types:**
  - Standard: decision_quality, timing, critical_thinking, emotional_intelligence, communication, problem_solving, adaptability, collaboration
  - BRAVIN-specific: bravin_alignment, trust_impact, ethical_decision_quality, emotional_intelligence_index, cultural_stewardship
  - Custom metric option

- **5 Measurement Methods:**
  - Automatic (system calculated)
  - Rubric-based assessment
  - Instructor observation
  - Learner self-assessment
  - Peer assessment

- **Configuration per Metric:**
  - Name and description
  - Metric type selection
  - Measurement method
  - Score range (min/max)
  - Passing threshold
  - Global vs scoped (topic/scenario specific)

- **Stats Dashboard:**
  - Total metrics
  - Global metrics count
  - Automatic metrics count
  - Rubric-based metrics count

- **Metric Display:**
  - Color-coded type badges (different colors for BRAVIN metrics)
  - Method display
  - Score range display
  - Passing threshold highlight
  - Edit/delete actions

### Next.js Current State:
- Has competencies page but **NO metrics management**
- No way to define assessment metrics
- No metric-competency mapping interface
- No measurement method configuration
- No BRAVIN-specific metrics

### Implementation Priority: **HIGH**
Metrics are essential for assessment - needed to evaluate learner performance.

---

## 6. User Management Enhancements (UserManager.tsx - 727 lines)

### Vite App Features:

#### **Enhanced User Management:**
- **Stats Cards Dashboard:**
  - Total users with colored icon
  - Students count (blue)
  - Teachers count (purple)
  - Admins count (red)

- **Search and Filter:**
  - Search by name or email
  - Filter by role (all/student/instructor/admin)

- **User Creation:**
  - Add Student button (blue)
  - Add Teacher button (purple)
  - **Bulk Upload button (green)** ← KEY MISSING FEATURE
  - Separate modals for student vs teacher creation
  - Fields: email, password, full name, username (auto-generated option), institution, department, position

- **User Table:**
  - User avatar with initials
  - Full name
  - Email and username
  - Role badge (color-coded)
  - Status (Active/Inactive)
  - Last login date
  - Created date
  - Edit/Delete actions
  - Deactivated users shown with gray styling and badge

- **Edit User Modal:**
  - Update full name, role, institution, department, position
  - **Active/Inactive toggle** with explanatory text
  - Cannot change email (immutable)

- **Bulk Upload Feature (BulkStudentUpload component):**
  - CSV file upload for multiple students
  - Template download
  - Progress indication
  - Error reporting per row
  - Success confirmation

### Next.js Current State:
- Has basic users page
- Can create individual users
- **MISSING bulk upload functionality**
- MISSING stats dashboard
- MISSING advanced filters
- MISSING user activation/deactivation UI
- MISSING institution/department/position fields

### Implementation Priority: **MEDIUM-HIGH**
Bulk upload is essential for onboarding multiple students efficiently.

---

## 7. Scenario Creation/Editing (ScenarioCreationModal.tsx - 954 lines, ScenarioEditModal.tsx - 1413 lines)

### Vite App Features:

#### **ScenarioCreationModal (3-Tab Wizard):**

**Tab 1: Introduction**
- Scenario title and description
- Topic selection
- Difficulty (beginner/intermediate/advanced)
- Video prompt field
- Video requirement toggle
- End scenario toggle
- VideoInputSelectorWithLibrary for introduction video

**Tab 2: Questions & Options**
- Question text
- OptionAccordion for 2-4 response options:
  - Each option has:
    - Option text
    - Difficulty-based feedback text (beginner/intermediate/advanced)
    - Difficulty-based feedback videos (3 separate videos)
    - Transition video
    - Skill impact sliders
    - Metric scores selector
- Add/remove options (min 2, max 4)
- Validation for all fields
- **UUID detection in feedback** (prevents copy-paste errors)

**Tab 3: Decision Timer**
- Enable/disable timer
- Timer visibility toggle
- Timer display location (hidden/top/bottom/overlay)
- Timer type (count_up/count_down)
- Timer limit (seconds)
- Show timer in feedback toggle
- Timer warning threshold

#### **Features:**
- AutoMappingPreview for competency suggestions
- ScenarioMetricSelector for metric selection
- Comprehensive validation
- Create mode only (separate edit modal)
- 40+ database fields for scenario options

#### **ScenarioEditModal (6-Tab Interface):**

**Tab 1: Introduction** - Same as creation
**Tab 2: Competencies**
- ScenarioCompetencySelector
- Select targeted competencies
- Review auto-generated mappings

**Tab 3: Metrics**
- ScenarioMetricSelector
- Select which metrics apply
- Metric configuration

**Tab 4: Weight Matrix**
- CompetencyWeightMatrixEditor
- Set weights for competencies
- Show inheritance info (global → simulation → scenario)
- Read-only vs editable mode

**Tab 5: Questions & Options**
- Same as creation but with:
  - **Connection status tracking**
  - Connection integrity verification
  - Warning when deleting options with connections
  - Connection display (shows target scenario)

**Tab 6: Timer** - Same as creation

#### **Advanced Features:**
- Atomic updates with rollback on error
- Connection integrity management
- HierarchyLevelSelector with auto-calculation
- Auto-mapping review
- Connection warnings
- Option connection visualization
- Validation for each tab
- Tab status indicators (valid/invalid/required)

### Next.js Current State:
- Has basic ScenarioManager with simple modal
- **Modal has only basic fields:**
  - Scenario name
  - Question text
  - Hierarchy level
  - Video URL (simple input)
  - Timer checkbox with seconds
- **MISSING:**
  - Multi-step wizard
  - OptionAccordion for response options
  - Difficulty-based feedback (3 tiers)
  - Video library integration
  - Auto-mapping
  - Competency selector
  - Metrics selector
  - Weight matrix editor
  - Connection management
  - Skill impact configuration
  - Comprehensive validation
  - UUID detection
  - All 6 tabs from edit modal

### Implementation Priority: **CRITICAL**
This is where content authors spend most of their time - needs full feature parity.

---

## 8. Competency Management Enhancements (CompetencyManager.tsx - 485 lines)

### Vite App Features:

#### **Hierarchical Competency Management:**
- **Tree View** with expand/collapse:
  - Parent-child relationships
  - Visual indentation
  - Expand/collapse buttons
  - Recursive rendering

- **Competency Properties:**
  - Name and description
  - Competency level (1-5)
  - Category
  - Tags
  - **Parent competency selector**
  - **Proficiency levels** (dynamic array):
    - Add/remove proficiency levels
    - Each level has: level number, name, description
    - Update proficiency level fields
  - Industry standard mapping toggle

- **Stats Dashboard:**
  - Total competencies
  - Root competencies (no parent)
  - Active competencies
  - Competencies with industry standards

- **Tree Operations:**
  - Expand/collapse individual competencies
  - Show children count
  - Navigate hierarchy levels

### Next.js Current State:
- Has basic competencies page with grid view
- Can create/edit/delete competencies
- Has filtering by level and category
- **MISSING:**
  - Hierarchical tree view
  - Parent-child relationships
  - Proficiency levels management
  - Expand/collapse functionality
  - Industry standard mapping
  - Stats dashboard

### Implementation Priority: **MEDIUM**
Hierarchical competencies are advanced features - can be added after core features.

---

## 9. Shared Components Needed

### From Archived Vite App:

1. **VideoInputSelectorWithLibrary**
   - Abstraction over video input
   - Supports URL, file upload, embed code, library selection
   - Platform detection (YouTube/Synthesia/Vimeo)
   - File upload to storage
   - Used throughout simulation builder

2. **OptionAccordion**
   - Accordion UI for scenario options
   - Manages 2-4 options
   - Comprehensive fields per option
   - Difficulty-based feedback
   - Video management per option
   - Skill impact and metrics

3. **TabNavigation**
   - Reusable tab navigation component
   - Tab validation indicators
   - Required tab markers
   - Smooth animations

4. **CompetencyWeightMatrixEditor**
   - Matrix editor for competency weights
   - Inheritance display (global → simulation → scenario)
   - Validation and constraints
   - Save functionality

5. **ScenarioMetricSelector**
   - Multi-select for metrics
   - Grouped by type
   - Search/filter capability

6. **AutoMappingPreview**
   - Shows AI-suggested competency mappings
   - Confidence scores
   - Accept/reject suggestions

7. **HierarchyLevelSelector**
   - Select hierarchy level with auto-calculation
   - Visual indicator of current level

8. **ScenarioCompetencySelector**
   - Select which competencies apply to scenario
   - Filtered by simulation

9. **ImageUpload**
   - Image upload component
   - Preview
   - File size validation
   - S3 upload integration

10. **BulkStudentUpload**
    - CSV file upload and parsing
    - Row-by-row validation
    - Error reporting
    - Progress indication

### Next.js Current State:
- Has basic VideoInputSelector
- Has basic HierarchyLevelSelector
- **MISSING 8 out of 10 components above**

### Implementation Priority: **HIGH**
These components are dependencies for the main features.

---

## 10. Missing Pages/Routes

### Vite App Has:
- `/admin` with tabbed interface
  - All tabs accessible from one page via dropdown navigation

### Next.js Has:
- `/admin` - basic overview
- `/admin/simulations` - simulation list
- `/admin/simulations/create` - empty page (no builder)
- `/admin/simulations/[id]/edit` - empty page (no builder)
- `/admin/scenarios/[id]/edit` - empty page (no advanced editor)
- `/admin/competencies` - basic competencies page
- `/admin/users` - basic users page
- `/admin/analytics` - empty
- `/admin/settings` - basic settings page

### Missing Routes:
- Category manager interface (should be part of simulations?)
- Video manager interface
- Metrics manager interface
- Flow builder interface
- Branding settings interface
- Analytics dashboard interface

### Implementation Priority: **HIGH**
Routes needed for navigation to work.

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Priority: CRITICAL - Build the navigation and basic infrastructure**

1. ✅ **AdminDashboard Dropdown Navigation** (HIGH)
   - Create dropdown menu system
   - Group tabs by sections
   - Add smooth animations
   - Implement active state management

2. **Create Missing Shared Components** (HIGH)
   - VideoInputSelectorWithLibrary
   - TabNavigation
   - ImageUpload
   - Basic OptionAccordion (simplified first version)

3. **Add Missing Routes** (HIGH)
   - Category manager route
   - Video manager route
   - Metrics manager route

### Phase 2: Core Content Management (Week 3-4)
**Priority: CRITICAL - Enable content creation**

4. **Category Manager** (HIGH)
   - Full implementation with analytics
   - Category CRUD operations
   - Integration with simulations

5. **SimulationBuilder - Basic Steps** (CRITICAL)
   - Implement 7-step wizard framework
   - Step 1: Basic Info
   - Step 2: Landing Page (without video library first)
   - Step 7: Review
   - Save/update functionality

6. **Video Manager - Basic Version** (HIGH)
   - Manage Videos tab
   - Add/edit/delete videos
   - Simple video table

### Phase 3: Advanced Content Features (Week 5-6)
**Priority: HIGH - Complete simulation authoring**

7. **SimulationBuilder - Advanced Steps** (CRITICAL)
   - Step 3: Introduction Page
   - Step 4: Flow Builder
   - Step 6: Closing Page with performance tiers
   - Full integration with video library

8. **Enhanced Scenario Creation** (CRITICAL)
   - 3-tab scenario creation wizard
   - OptionAccordion with full features
   - Difficulty-based feedback
   - Video integration per option

9. **Metrics Manager** (HIGH)
   - Full implementation
   - All 14 metric types
   - CRUD operations
   - Stats dashboard

### Phase 4: Assessment & Advanced Features (Week 7-8)
**Priority: MEDIUM-HIGH - Complete assessment system**

10. **Enhanced Scenario Editing** (HIGH)
    - 6-tab edit interface
    - Connection management
    - Competency weight matrix integration
    - Metrics selector integration

11. **CompetencyWeightMatrixEditor** (MEDIUM-HIGH)
    - Matrix editor component
    - Global/simulation/scenario inheritance
    - Validation

12. **Auto-Mapping System** (MEDIUM)
    - AutoMappingPreview component
    - AI suggestions for competency mapping
    - Accept/reject workflow

### Phase 5: User Management & Polish (Week 9-10)
**Priority: MEDIUM - Improve user experience**

13. **Bulk Student Upload** (MEDIUM-HIGH)
    - BulkStudentUpload component
    - CSV parsing
    - Error handling
    - Progress indication

14. **Video Manager - Advanced** (MEDIUM)
    - Video Library tab
    - YouTube Test tab
    - Debug Videos tab
    - Video preview modal

15. **Hierarchical Competencies** (MEDIUM)
    - Tree view implementation
    - Proficiency levels
    - Parent-child relationships

### Phase 6: Final Polish (Week 11-12)
**Priority: LOW-MEDIUM - Nice-to-haves**

16. **Analytics Dashboard** (MEDIUM)
    - PathAnalyticsDashboard implementation
    - Data visualization
    - Reporting

17. **Branding Settings** (LOW)
    - Logo upload
    - Color customization
    - Institution settings

18. **Additional Enhancements** (LOW)
    - Animations throughout
    - Loading states
    - Error boundaries
    - Accessibility improvements

---

## Summary Statistics

### Components to Build:
- **New Pages**: 7 major pages/interfaces
- **New Shared Components**: 10+ reusable components
- **Enhanced Existing**: 3 existing pages
- **Total Lines of Code Estimate**: ~8,000-10,000 lines

### Feature Counts:
- **Critical Priority**: 5 major features (SimulationBuilder, Scenario wizards, Video integration)
- **High Priority**: 8 major features (Categories, Metrics, Video Manager, etc.)
- **Medium Priority**: 5 features (Bulk upload, Hierarchical competencies, Analytics)
- **Low Priority**: 2 features (Branding, Additional polish)

### Current Completion Percentage:
- **Admin Interface**: ~25% complete
  - Has: Basic users, basic competencies, basic simulations list
  - Missing: 75% of features including all advanced authoring tools

---

## Recommendations

1. **Start with Phase 1-2** to establish foundation and enable basic content creation
2. **Focus on SimulationBuilder** as top priority - it's the most complex and critical
3. **Build shared components first** before implementing features that depend on them
4. **Test incrementally** - don't wait until everything is built
5. **Use existing Vite code as reference** but adapt to Next.js patterns (Server/Client components)
6. **Consider database schema** - may need migrations for new features
7. **Plan for data migration** if moving existing simulations to new structure

## Next Steps

1. Review this analysis with stakeholders
2. Confirm priorities
3. Begin Phase 1 implementation
4. Set up project tracking for feature completion
