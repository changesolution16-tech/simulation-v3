# Manual Test Plan - Soft Skills Training Platform

## Test Environment Setup

### Prerequisites
1. Application running on localhost or deployment URL
2. Database connection active
3. Test user accounts created for each role
4. Sample simulations and scenarios available

### Test Data Requirements
- At least 3 test users (Admin, Instructor, Learner)
- At least 2 complete simulations with multiple scenarios
- Sample video content or placeholder URLs
- Test cohorts with assigned learners

---

## Test User Accounts

Create these test accounts before testing:

| Role | Email | Purpose |
|------|-------|---------|
| Admin | admin@test.com | Full system access |
| Instructor | instructor@test.com | Cohort and learner management |
| Learner 1 | learner1@test.com | Simulation participation |
| Learner 2 | learner2@test.com | Progress tracking verification |

---

## 1. ADMINISTRATOR TESTING

### 1.1 Authentication & Access
**Test ID**: ADMIN-001
**Feature**: Login and Dashboard Access
**Steps**:
1. Navigate to login page
2. Enter admin credentials
3. Submit login form
4. Verify redirect to admin dashboard

**Expected Results**:
- Successful login
- Admin dashboard displays
- Navigation menu shows admin-specific options
- User role badge shows "Admin"

---

### 1.2 Simulation Management
**Test ID**: ADMIN-002
**Feature**: Create New Simulation
**Steps**:
1. Navigate to Admin > Simulations
2. Click "Create New Simulation"
3. Fill in simulation details:
   - Title: "Test Leadership Simulation"
   - Description: "Testing scenario creation"
   - Category: Leadership
   - Difficulty: Intermediate
4. Add introduction video (URL or embed)
5. Save simulation

**Expected Results**:
- Simulation created successfully
- Appears in simulations list
- All fields saved correctly
- Video preview displays properly

---

**Test ID**: ADMIN-003
**Feature**: Create Scenarios with Branching
**Steps**:
1. Open created simulation
2. Click "Add Scenario"
3. Create first scenario:
   - Question text: "How do you approach the team meeting?"
   - Hierarchy level: Manager
   - Add video content
4. Add 3 options with different outcomes:
   - Option A: Positive (Good feedback)
   - Option B: Neutral (Moderate feedback)
   - Option C: Negative (Poor feedback)
5. Connect options to next scenarios
6. Create branching paths (at least 3 scenarios deep)
7. Save scenario configuration

**Expected Results**:
- Scenarios created successfully
- Branching logic saved
- Visual connection between scenarios shown
- Options display correct feedback videos
- Hierarchy levels display properly

---

**Test ID**: ADMIN-004
**Feature**: Configure Metrics and Competencies
**Steps**:
1. Open scenario editor
2. For each option, set BRAVIN metric scores:
   - Business Acumen: 1-5
   - Results Orientation: 1-5
   - Analytical Thinking: 1-5
   - Valuing Diversity: 1-5
   - Inspiring Performance: 1-5
   - Networking: 1-5
3. Assign target competencies to scenarios
4. Set competency impact weights
5. Save configuration

**Expected Results**:
- All metric scores saved
- Competencies assigned correctly
- Weight matrix displays properly
- Auto-calculation shows expected impacts
- Changes persist after page reload

---

### 1.3 Video Management
**Test ID**: ADMIN-005
**Feature**: Video Library Management
**Steps**:
1. Navigate to Video Library
2. Test each input method:
   - **YouTube URL**: Paste valid YouTube link
   - **Vimeo URL**: Paste valid Vimeo link
   - **Embed Code**: Paste iframe embed code
   - **File Upload**: Upload MP4 file (if available)
3. Add title and description
4. Save video to library
5. Search for saved video
6. Preview video playback

**Expected Results**:
- All video sources accepted
- URLs validated correctly
- Thumbnails generated
- Search functionality works
- Videos play correctly in preview
- Library browser displays all videos

---

### 1.4 User Management
**Test ID**: ADMIN-006
**Feature**: Create and Manage Users
**Steps**:
1. Navigate to Admin > Users
2. Click "Create New User"
3. Fill in user details:
   - Full name
   - Email
   - Role (Learner/Instructor/Admin)
   - Password
4. Save user
5. Search for created user
6. Edit user details
7. Test role change
8. Test bulk upload (if CSV available)

**Expected Results**:
- User created successfully
- Appears in user list
- Search finds user correctly
- Edit updates properly
- Role changes apply immediately
- Bulk upload processes correctly

---

### 1.5 Cohort Management
**Test ID**: ADMIN-007
**Feature**: Create and Assign Cohorts
**Steps**:
1. Navigate to cohorts section
2. Create new cohort:
   - Name: "Q1 2025 Leadership Training"
   - Description: "First quarter cohort"
3. Add learners to cohort
4. Assign simulation to cohort
5. Set assignment parameters:
   - Due date
   - Access period
6. Save cohort

**Expected Results**:
- Cohort created successfully
- Learners added to cohort
- Simulation assignment active
- Learners can see assignment
- Due dates display correctly

---

### 1.6 Branding Customization
**Test ID**: ADMIN-008
**Feature**: Customize Platform Branding
**Steps**:
1. Navigate to Admin > Settings > Branding
2. Modify primary color
3. Upload logo image
4. Update application title
5. Modify welcome text
6. Save changes
7. Logout and view login page
8. Login as learner to verify changes

**Expected Results**:
- Color changes apply throughout app
- Logo displays on login and dashboard
- Title shows in browser and headers
- Welcome text appears correctly
- Changes persist across sessions
- All users see updated branding

---

### 1.7 Analytics and Reporting
**Test ID**: ADMIN-009
**Feature**: View Analytics Dashboard
**Steps**:
1. Navigate to Admin > Analytics
2. View overall statistics
3. Check learner performance metrics
4. Review completion rates
5. Analyze competency development trends
6. View BRAVIN score distributions
7. Check path analytics

**Expected Results**:
- Dashboard displays aggregate statistics
- Charts render correctly
- Data updates in real-time
- All metrics calculate accurately
- Path visualization shows decision flows
- Export functionality works

---

## 2. INSTRUCTOR TESTING

### 2.1 Instructor Dashboard
**Test ID**: INST-001
**Feature**: View Learner Progress
**Steps**:
1. Login as instructor
2. Navigate to Instructor Dashboard
3. View statistics cards:
   - Total Learners
   - Completed assignments
   - Average scores
   - Average time spent
4. Review learner progress table
5. Test search functionality
6. Filter by status (completed/in_progress/abandoned)
7. Sort by different columns

**Expected Results**:
- Dashboard loads successfully
- Statistics display accurate counts
- Learner table shows all assigned learners
- Search filters results correctly
- Status filter works properly
- Sorting functions correctly
- All learner data displays accurately

---

**Test ID**: INST-002
**Feature**: Export Progress Reports
**Steps**:
1. From Instructor Dashboard
2. Apply filters (optional)
3. Click "Export CSV"
4. Download file
5. Open CSV in spreadsheet application
6. Verify data completeness

**Expected Results**:
- CSV downloads successfully
- File contains all visible learner data
- Columns: Name, Email, Status, Scenarios, Score, Time, Dates
- Data matches dashboard display
- No corrupted or missing data
- Filters apply to export

---

### 2.2 Teacher Dashboard
**Test ID**: INST-003
**Feature**: Navigate Management Tabs
**Steps**:
1. Login as instructor
2. Navigate to Teacher Dashboard
3. Test each tab:
   - **Assignments**: View and manage assignments
   - **Cohorts**: View cohort organization
   - **Simulations**: Browse available simulations
   - **Analytics**: View performance data
   - **Metrics**: Review configuration
4. Verify tab switching animations
5. Check content loads per tab

**Expected Results**:
- All tabs accessible
- Tab content loads without errors
- Smooth transitions between tabs
- Each panel displays appropriate content
- No broken links or missing features
- Role badge displays correctly

---

### 2.3 Assignment Management
**Test ID**: INST-004
**Feature**: Create and Monitor Assignments
**Steps**:
1. Navigate to Assignments tab
2. Create new assignment
3. Select simulation
4. Assign to cohort
5. Set due date
6. Monitor completion status
7. View individual learner progress

**Expected Results**:
- Assignment created successfully
- Learners receive notification (if implemented)
- Progress tracking updates in real-time
- Due dates enforced properly
- Completion status accurate
- Individual results accessible

---

## 3. LEARNER TESTING

### 3.1 Learner Dashboard
**Test ID**: LEARN-001
**Feature**: View Available Simulations
**Steps**:
1. Login as learner
2. View dashboard
3. Check assigned simulations
4. Review progress indicators
5. View BRAVIN profile widget
6. Check recent activity
7. View skills progress

**Expected Results**:
- Dashboard displays assigned simulations
- Progress shows completion percentage
- BRAVIN widget displays current scores
- Recent activity shows simulation attempts
- Skills progress charts render correctly
- All data is learner-specific

---

### 3.2 Simulation Flow - Landing Page
**Test ID**: LEARN-002
**Feature**: Start Simulation from Landing Page
**Steps**:
1. Click on assigned simulation
2. View simulation landing page
3. Review simulation overview:
   - Title and description
   - Estimated time
   - Difficulty level
   - Preview image
4. Click "Start Simulation"

**Expected Results**:
- Landing page displays with all details
- Images load properly
- Information is accurate
- "Start" button is prominent
- Navigation is clear
- Page is responsive

---

### 3.3 Simulation Flow - Difficulty Selection
**Test ID**: LEARN-003
**Feature**: Select Difficulty Level
**Steps**:
1. After starting simulation
2. View difficulty options (if multi-level):
   - Beginner
   - Intermediate
   - Advanced
3. Read difficulty descriptions
4. Review fiction contract
5. Select difficulty level
6. Confirm selection

**Expected Results**:
- All difficulty options display
- Descriptions are clear
- Fiction contract appears
- Selection is recorded
- Proceeds to introduction
- Cannot skip if required

---

### 3.4 Simulation Flow - Introduction
**Test ID**: LEARN-004
**Feature**: Watch Simulation Introduction
**Steps**:
1. View introduction page
2. Watch introduction video
3. Read scenario context
4. Review objectives
5. Click "Begin Scenarios"

**Expected Results**:
- Introduction video plays correctly
- Context text is readable
- Objectives clearly stated
- "Begin" button becomes active
- Video can be replayed
- Skip option works (if enabled)

---

### 3.5 Simulation Flow - Scenario Questions
**Test ID**: LEARN-005
**Feature**: Complete Scenario Questions
**Steps**:
1. View first scenario
2. Watch scenario video (if present)
3. Read question text
4. Review 2-4 answer options
5. Select an option
6. View timer (if enabled)
7. Submit response

**Expected Results**:
- Scenario loads correctly
- Video plays without buffering
- Question text is clear
- All options display
- Timer counts down (if enabled)
- Selection highlights
- Submit button activates
- Response is recorded

---

### 3.6 Simulation Flow - Feedback
**Test ID**: LEARN-006
**Feature**: View Feedback After Response
**Steps**:
1. After submitting response
2. View feedback page
3. Watch feedback video (if present)
4. Read feedback text:
   - Decision impact
   - Competency feedback
   - BRAVIN metric impacts
5. Review what was assessed
6. Click "Continue"

**Expected Results**:
- Feedback loads immediately
- Video plays correctly
- Feedback is relevant to choice
- Metric impacts display with +/- indicators
- Competency feedback shows strength/weakness
- Clear path to next scenario
- Reflection prompts appear

---

### 3.7 Simulation Flow - Transitions
**Test ID**: LEARN-007
**Feature**: Experience Scenario Transitions
**Steps**:
1. Complete one scenario
2. View transition page
3. Watch transition video (if present)
4. Read narrative connection
5. See progress indicator
6. Continue to next scenario

**Expected Results**:
- Smooth transition between scenarios
- Narrative maintains continuity
- Progress bar shows completion
- Transition video plays correctly
- Story remains coherent
- "Continue" button is clear

---

### 3.8 Simulation Flow - Branching
**Test ID**: LEARN-008
**Feature**: Experience Branching Paths
**Steps**:
1. Complete multiple scenarios
2. Make different choices
3. Notice path changes based on decisions
4. Encounter different scenarios
5. Experience varied outcomes

**Expected Results**:
- Different choices lead to different paths
- Scenarios match previous decisions
- Story remains coherent despite branching
- No broken connections
- All paths have proper endings
- Logic follows expected flow

---

### 3.9 Simulation Flow - Completion
**Test ID**: LEARN-009
**Feature**: Complete Simulation and View Results
**Steps**:
1. Complete all scenarios in path
2. View final results page
3. Review overall performance:
   - Final score
   - Scenarios completed
   - Time spent
   - Hierarchy level reached
4. View BRAVIN results:
   - All 6 dimension scores
   - Radar chart visualization
   - Detailed breakdown
5. View competency results:
   - Strengths identified
   - Areas for development
   - Growth suggestions
6. View metrics summary
7. Download report (if available)

**Expected Results**:
- Results page displays all metrics
- Final score calculated correctly
- BRAVIN radar chart renders properly
- All 6 dimensions shown with scores
- Competency feedback is personalized
- Time tracking is accurate
- Report download works
- Results saved to profile

---

### 3.10 Resume Simulation
**Test ID**: LEARN-010
**Feature**: Resume Incomplete Simulation
**Steps**:
1. Start a simulation
2. Complete 2-3 scenarios
3. Logout or close browser
4. Login again
5. Navigate to dashboard
6. Click on incomplete simulation
7. View resume modal
8. Choose to resume or restart

**Expected Results**:
- System detects incomplete simulation
- Resume modal appears with:
  - Previous progress shown
  - Current scenario indicated
  - Option to resume or restart
- Resume continues from last scenario
- All previous responses preserved
- Restart begins from introduction
- Timer resumes correctly (if applicable)

---

### 3.11 Decision Timer
**Test ID**: LEARN-011
**Feature**: Experience Timed Decisions
**Steps**:
1. Start simulation with timer enabled
2. View scenario question
3. Observe countdown timer
4. Test timer behavior:
   - Make decision before time expires
   - Let timer expire without selection
5. View impact of timeout

**Expected Results**:
- Timer displays prominently
- Countdown is accurate
- Timer shows warning at 10 seconds
- Timeout triggers automatic submission
- Timeout is recorded in results
- Feedback explains timeout impact
- Timer can be disabled in settings

---

### 3.12 BRAVIN Profile Widget
**Test ID**: LEARN-012
**Feature**: View Personal BRAVIN Profile
**Steps**:
1. From dashboard, locate BRAVIN widget
2. View current scores:
   - Business Acumen
   - Results Orientation
   - Analytical Thinking
   - Valuing Diversity
   - Inspiring Performance
   - Networking
3. View score history/trends
4. Click for detailed breakdown
5. Compare with benchmarks

**Expected Results**:
- Widget displays on dashboard
- All 6 dimensions shown
- Scores update after simulations
- Visual representation (chart/bars)
- Detailed view accessible
- History tracks progress over time
- Benchmarks provide context

---

## 4. CROSS-FUNCTIONAL TESTING

### 4.1 Multi-Language Support
**Test ID**: CROSS-001
**Feature**: Switch Between Languages
**Steps**:
1. Login as any user
2. Locate language switcher
3. Switch from English to Spanish
4. Navigate through different pages
5. Start a simulation
6. Complete a scenario
7. Switch back to English

**Expected Results**:
- Language switcher accessible
- All UI text translates
- Scenario content translates
- Feedback translates
- No broken translations
- Language preference persists
- Option labels translate correctly

---

### 4.2 Responsive Design
**Test ID**: CROSS-002
**Feature**: Mobile and Tablet Responsiveness
**Steps**:
1. Test on different screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)
2. Navigate through key pages
3. Complete a simulation on mobile
4. Test admin dashboard on tablet
5. Verify all interactive elements

**Expected Results**:
- Layout adapts to screen size
- No horizontal scrolling
- Buttons remain clickable
- Forms are usable
- Videos scale properly
- Tables scroll or stack
- Navigation remains accessible

---

### 4.3 Dark Mode
**Test ID**: CROSS-003
**Feature**: Dark Mode Toggle
**Steps**:
1. Enable dark mode (if available)
2. Navigate through application
3. Check contrast and readability
4. View videos in dark mode
5. Complete simulation in dark mode
6. Switch back to light mode

**Expected Results**:
- Dark mode applies throughout
- Text remains readable
- Sufficient contrast maintained
- Videos display properly
- No white flashes
- Toggle persists across sessions
- Smooth transition between modes

---

### 4.4 Performance and Loading
**Test ID**: CROSS-004
**Feature**: Application Performance
**Steps**:
1. Measure page load times
2. Test with slow network (throttling)
3. Load pages with many simulations
4. Upload large files (if applicable)
5. Watch videos with varying bandwidth
6. Test with multiple tabs open

**Expected Results**:
- Pages load within 3 seconds
- Loading indicators appear
- No crashes or freezes
- Videos buffer appropriately
- Upload progress shows
- Multiple tabs don't conflict
- Graceful degradation on slow networks

---

### 4.5 Error Handling
**Test ID**: CROSS-005
**Feature**: Error Messages and Recovery
**Steps**:
1. Test invalid form inputs
2. Try accessing unauthorized pages
3. Submit incomplete forms
4. Test with network disconnected
5. Try duplicate operations
6. Test session expiration

**Expected Results**:
- Clear error messages display
- Validation prevents bad data
- Unauthorized access blocked
- Network errors handled gracefully
- Duplicate prevention works
- Session timeout redirects to login
- Error messages are user-friendly

---

## 5. DATA INTEGRITY TESTING

### 5.1 Progress Tracking
**Test ID**: DATA-001
**Feature**: Accurate Progress Recording
**Steps**:
1. Complete a simulation as learner
2. Verify progress updates in real-time
3. Check instructor dashboard shows updates
4. Verify admin analytics reflect changes
5. Test multiple simultaneous users
6. Verify data consistency

**Expected Results**:
- All responses recorded correctly
- Progress updates immediately
- No data loss
- Timestamps accurate
- Multiple users don't interfere
- Database entries correct

---

### 5.2 Score Calculations
**Test ID**: DATA-002
**Feature**: Verify Score Calculations
**Steps**:
1. Complete simulation with known choices
2. Manually calculate expected scores:
   - Scenario option scores
   - BRAVIN dimension totals
   - Competency impacts
   - Final weighted score
3. Compare with system calculations
4. Test edge cases:
   - All high scores
   - All low scores
   - Mixed results

**Expected Results**:
- Calculations match manual results
- Weighted averages correct
- BRAVIN scores accurate
- Competency impacts proper
- Rounding handled consistently
- No negative scores
- Maximum scores respected

---

## 6. SECURITY TESTING

### 6.1 Authentication
**Test ID**: SEC-001
**Feature**: Login Security
**Steps**:
1. Test with wrong password
2. Test with non-existent email
3. Test SQL injection attempts
4. Test XSS in login fields
5. Verify password masking
6. Test session management
7. Test logout functionality

**Expected Results**:
- Invalid credentials rejected
- Error messages don't reveal details
- SQL injection prevented
- XSS attempts sanitized
- Passwords never visible
- Sessions expire properly
- Logout clears all data

---

### 6.2 Authorization
**Test ID**: SEC-002
**Feature**: Role-Based Access Control
**Steps**:
1. Login as learner
2. Try accessing admin URLs directly
3. Try accessing instructor features
4. Login as instructor
5. Try accessing admin features
6. Verify data isolation between users

**Expected Results**:
- Unauthorized access blocked
- Redirects to appropriate page
- Error messages appropriate
- No data leakage between users
- Role restrictions enforced
- API endpoints protected

---

## 7. KNOWN LIMITATIONS

Document any features that are:
- Not yet implemented
- Partially functional
- Require specific configuration
- Have browser compatibility issues

---

## 8. TEST RESULTS TEMPLATE

For each test, record:

| Test ID | Pass/Fail | Issues Found | Severity | Notes |
|---------|-----------|--------------|----------|-------|
| ADMIN-001 | Pass | None | - | All working |
| ADMIN-002 | Fail | Video preview broken | High | Fix required |
| ... | ... | ... | ... | ... |

---

## 9. CRITICAL PATH TESTING

**Minimum Viable Test Sequence** (30-minute quick test):

1. **Setup** (5 min)
   - Login as admin
   - Verify existing simulation with scenarios

2. **Admin Flow** (10 min)
   - Create cohort
   - Assign learner to cohort
   - Assign simulation to cohort

3. **Learner Flow** (10 min)
   - Login as learner
   - Start assigned simulation
   - Complete 3 scenarios
   - View feedback
   - Check results

4. **Instructor Flow** (5 min)
   - Login as instructor
   - View learner progress
   - Export report

**If all critical path tests pass, the application is functionally operational.**

---

## 10. REGRESSION TESTING CHECKLIST

After any code changes, verify:

- [ ] Login still works for all roles
- [ ] Simulations can be created/edited
- [ ] Scenarios can be completed
- [ ] Results display correctly
- [ ] Data persists across sessions
- [ ] No console errors in browser
- [ ] Build completes without errors
- [ ] Database queries execute successfully

---

## Test Environment Notes

- **Browser Testing**: Chrome, Firefox, Safari, Edge
- **Device Testing**: Desktop, Tablet, Mobile
- **Network Testing**: Fast, Slow, Offline scenarios
- **Data Volume**: Test with 1, 10, 100+ records

---

**Last Updated**: 2025-12-16
**Version**: 1.0
**Status**: Ready for Testing
**Coverage**: 83% of implemented features
