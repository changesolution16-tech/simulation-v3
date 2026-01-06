# Test Scenarios by User Role

## Overview
This document provides realistic, story-based test scenarios for each user type. Follow these narratives to test the application in context.

---

## ADMINISTRATOR SCENARIOS

### Scenario 1: Sarah - Learning & Development Manager
**Context**: Sarah needs to create a new leadership training simulation for mid-level managers.

**Story**:
Sarah's company is launching a new leadership development program. She needs to create an interactive simulation that helps managers practice difficult conversations with team members.

**Test Steps**:

1. **Login & Setup**
   - Login as admin
   - Navigate to Simulations
   - Click "Create New Simulation"

2. **Create Simulation**
   - Title: "Difficult Conversations: Performance Management"
   - Description: "Practice navigating challenging discussions with underperforming team members"
   - Category: Leadership
   - Difficulty: Intermediate
   - Add introduction video explaining the scenario

3. **Build Scenario 1: Initial Meeting**
   - Question: "Your team member Alex has missed three project deadlines. How do you open the conversation?"
   - Add scenario video showing Alex at their desk
   - Create 3 options:
     - A: "Alex, we need to talk about your performance immediately"
     - B: "Hi Alex, do you have a moment? I'd like to discuss the recent projects"
     - C: "Alex, I'm disappointed in your recent work. What's going on?"
   - Assign BRAVIN scores to each option:
     - Option A: Low on Inspiring Performance (1), High on Results (5)
     - Option B: Balanced scores (3s and 4s)
     - Option C: Low on Valuing Diversity (1), Mixed others
   - Add feedback videos for each choice

4. **Build Branching Paths**
   - Option A leads to → Defensive employee scenario
   - Option B leads to → Open conversation scenario
   - Option C leads to → Damaged relationship scenario
   - Create 3 different scenario paths (5 scenarios each)

5. **Configure Assessment**
   - Set target competencies:
     - Emotional Intelligence
     - Communication
     - Conflict Resolution
   - Configure competency weight matrix
   - Verify auto-calculated impacts

6. **Assign to Learners**
   - Create cohort: "2025 Q1 Managers"
   - Add 10 test learners
   - Assign simulation to cohort
   - Set due date: 2 weeks from now

7. **Verify**
   - Preview simulation as learner
   - Check all videos play
   - Verify branching works
   - Confirm assignment appears for learners

**Expected Outcome**: Complete, functional simulation ready for learners

---

### Scenario 2: Michael - Training Administrator
**Context**: Michael needs to set up the platform for a new client organization.

**Story**:
A new company has purchased the platform. Michael needs to brand it for their organization and set up initial users.

**Test Steps**:

1. **Customize Branding**
   - Navigate to Settings > Branding
   - Change primary color to company blue (#0066CC)
   - Upload company logo
   - Update application title to "ABC Corp Leadership Academy"
   - Modify welcome message: "Welcome to ABC Corp's Leadership Development Program"
   - Save changes

2. **Create User Accounts**
   - Create 3 instructors:
     - instructor1@abccorp.com
     - instructor2@abccorp.com
     - instructor3@abccorp.com
   - Create 20 learners using bulk upload:
     - Prepare CSV with names, emails, departments
     - Upload CSV
     - Verify all users created

3. **Organize Users**
   - Create 3 cohorts:
     - "Sales Team"
     - "Operations Team"
     - "Management Team"
   - Assign learners to appropriate cohorts
   - Assign instructors to monitor cohorts

4. **Setup Content**
   - Import existing simulations
   - Assign simulations to each cohort
   - Configure access periods
   - Set completion deadlines

5. **Verify Setup**
   - Logout and view branded login page
   - Login as instructor - verify cohort access
   - Login as learner - verify assigned simulations
   - Test branding consistency across all pages

**Expected Outcome**: Fully branded platform with organized users and content

---

### Scenario 3: Jennifer - Content Manager
**Context**: Jennifer maintains the video library and updates simulations.

**Story**:
Jennifer needs to add new video content and update an existing simulation with better quality videos.

**Test Steps**:

1. **Add Videos to Library**
   - Navigate to Video Library
   - Add 5 new videos:
     - 2 from YouTube (copy URLs from client channel)
     - 2 from Vimeo (embed codes provided)
     - 1 uploaded file (if S3 available)
   - Tag videos with categories:
     - "Leadership"
     - "Communication"
     - "Feedback"
   - Add descriptions and titles

2. **Update Existing Simulation**
   - Open "Communication Skills" simulation
   - Navigate to scenario editor
   - Replace old scenario videos:
     - Scenario 1: Select new video from library
     - Scenario 3: Add new YouTube video
     - Scenario 5: Update feedback video
   - Preview each change

3. **Test Video Quality**
   - Play each video in preview mode
   - Verify audio quality
   - Check video resolution
   - Test on different browsers
   - Test playback speed

4. **Organize Library**
   - Create folders/categories
   - Move videos to appropriate categories
   - Delete outdated videos
   - Verify deleted videos don't break simulations

5. **Verify in Learner View**
   - Start simulation as test learner
   - Confirm new videos play correctly
   - Check transitions are smooth
   - Verify no broken video links

**Expected Outcome**: Updated video library and simulation with improved content

---

## INSTRUCTOR SCENARIOS

### Scenario 4: David - Department Manager
**Context**: David manages a team of 15 sales representatives and needs to track their training progress.

**Story**:
David's team must complete quarterly leadership training. He needs to monitor progress, identify struggling team members, and report completion to HR.

**Test Steps**:

1. **Initial Review**
   - Login as instructor
   - Navigate to Instructor Dashboard
   - Review statistics:
     - Total learners: 15
     - Completed: Check number
     - In progress: Check number
     - Average score: Review performance

2. **Monitor Individual Progress**
   - Scan learner progress table
   - Identify learners with:
     - Not started (status: assigned)
     - Low scores (< 60%)
     - Long completion times (> 45 min)
     - Abandoned attempts

3. **Search and Filter**
   - Search for specific team member: "John Smith"
   - Filter by status: "in_progress"
   - Sort by score (ascending) to find lowest performers
   - Sort by scenarios completed

4. **Generate Reports**
   - Filter to show only completed
   - Export CSV report
   - Open in Excel/Sheets
   - Verify all data present:
     - Names
     - Completion dates
     - Scores
     - Time spent
   - Format for HR submission

5. **Follow-up Actions**
   - Note which team members need reminders
   - Identify who may need additional support
   - Check deadline compliance

6. **Teacher Dashboard Review**
   - Navigate to Teacher Dashboard
   - Review Assignments tab
   - Check Cohorts organization
   - Browse available simulations for future assignments
   - Review Analytics panel

**Expected Outcome**: Complete progress report and action items for team

---

### Scenario 5: Lisa - Corporate Trainer
**Context**: Lisa runs multiple training cohorts and needs to compare performance across groups.

**Story**:
Lisa manages 3 cohorts taking the same simulation. She needs to compare results and identify which cohort needs additional support.

**Test Steps**:

1. **Review Multiple Cohorts**
   - View Instructor Dashboard
   - Filter by cohort 1: "Morning Group"
   - Export data
   - Switch filter to cohort 2: "Afternoon Group"
   - Export data
   - Switch filter to cohort 3: "Evening Group"
   - Export data

2. **Compare Performance**
   - Open all 3 CSV files
   - Calculate averages for each cohort:
     - Average completion time
     - Average score
     - Completion rate
   - Identify cohort with lowest performance

3. **Detailed Analysis**
   - For lowest-performing cohort:
     - View individual learner details
     - Check which scenarios cause most difficulty
     - Note common patterns in choices
     - Identify specific struggling learners

4. **Plan Interventions**
   - Document findings
   - Identify learners needing 1-on-1 support
   - Note scenarios that may need clarification
   - Plan follow-up sessions

**Expected Outcome**: Comparative analysis and intervention plan

---

## LEARNER SCENARIOS

### Scenario 6: James - New Manager
**Context**: James was recently promoted to manager and needs to complete leadership training.

**Story**:
James is nervous about his first performance review meeting. He's assigned to complete the "Difficult Conversations" simulation to prepare.

**Test Steps**:

1. **Start Training**
   - Login as learner
   - View dashboard
   - See assigned simulation: "Difficult Conversations: Performance Management"
   - Read description and objectives
   - Note estimated time: 30 minutes
   - Click to start simulation

2. **Landing Page**
   - Review simulation overview
   - Check difficulty level
   - Read fiction contract (if present)
   - Click "Start Simulation"

3. **Difficulty Selection** (if applicable)
   - Review difficulty options:
     - Beginner: Basic conversation
     - Intermediate: Challenging situation
     - Advanced: Complex scenario
   - Select "Intermediate"
   - Confirm selection

4. **Introduction**
   - Watch introduction video
   - Read scenario context:
     - Alex is a good employee
     - Recently missing deadlines
     - You need to address it constructively
   - Review objectives
   - Click "Begin Scenarios"

5. **Complete Scenario 1**
   - Watch video: Alex at their desk, looking stressed
   - Read question: "How do you open the conversation?"
   - Review 3 options carefully
   - Notice timer counting down (if enabled)
   - Select Option B (balanced approach)
   - Submit response

6. **View Feedback**
   - Watch feedback video
   - Read feedback:
     - "Good choice! You showed empathy while maintaining professionalism"
     - BRAVIN impacts: +3 Inspiring Performance, +4 Valuing Diversity
     - Competency feedback: "Strength in Emotional Intelligence"
   - Note areas for improvement
   - Click "Continue"

7. **Transition**
   - Watch transition video
   - Read narrative: "Alex opens up about personal challenges"
   - See progress: 1 of 5 scenarios complete
   - Click "Continue"

8. **Complete Scenarios 2-5**
   - Continue through branching path
   - Make thoughtful choices
   - Review feedback each time
   - Experience consequences of earlier decisions

9. **Final Results**
   - View completion summary:
     - Final Score: 78%
     - Time Spent: 25 minutes
     - Scenarios Completed: 5
     - Path: Supportive Manager
   - Review BRAVIN results:
     - Business Acumen: 3/5
     - Results Orientation: 4/5
     - Analytical Thinking: 3/5
     - Valuing Diversity: 5/5
     - Inspiring Performance: 5/5
     - Networking: 2/5
   - Read competency feedback:
     - **Strengths**: Emotional intelligence, empathy
     - **Develop**: Direct communication, boundary setting
   - View growth suggestions
   - Consider reflection prompts

10. **Post-Completion**
    - Return to dashboard
    - View updated BRAVIN profile widget
    - Check skills progress chart
    - See simulation marked complete
    - Review recent activity

**Expected Outcome**: Completed training with personalized feedback and insights

---

### Scenario 7: Maria - Experienced Manager
**Context**: Maria has 10 years of management experience but wants to refresh her skills.

**Story**:
Maria is confident but wants to see if modern training aligns with her methods. She approaches the simulation with curiosity.

**Test Steps**:

1. **Fast-Paced Completion**
   - Login and start simulation quickly
   - Skip introduction (if allowed)
   - Rapidly read through scenarios
   - Make intuitive choices
   - Test timer feature (make decisions quickly)

2. **Explore Branching**
   - Make some unexpected choices to see different paths
   - Restart simulation to try different approach
   - Compare outcomes from different choices
   - Note how feedback changes

3. **Challenge High Difficulty**
   - Select "Advanced" difficulty
   - Encounter more complex scenarios
   - Deal with additional constraints
   - Experience more nuanced feedback

4. **Compare Results**
   - Complete simulation multiple ways
   - Compare BRAVIN scores from different approaches
   - Analyze how choices affect competency ratings
   - Reflect on which approach was most effective

**Expected Outcome**: Multiple completions with varied results

---

### Scenario 8: Tom - Reluctant Learner
**Context**: Tom views this as mandatory compliance training and wants to finish quickly.

**Story**:
Tom is busy and sees this as a checkbox exercise. He wants to complete it as fast as possible.

**Test Steps**:

1. **Minimal Engagement**
   - Login reluctantly
   - Click through landing page quickly
   - Skip reading full descriptions
   - Watch videos at 1.5x speed (if available)

2. **Quick Completion**
   - Select first available option without thinking
   - Skip feedback if possible
   - Rush through transitions
   - Aim for completion, not quality

3. **Encounter Consequences**
   - Receive low scores
   - Get feedback about hasty decisions
   - Reach negative outcome in branching
   - See impact on BRAVIN scores

4. **Results Review**
   - Receive low final score (< 50%)
   - Review poor BRAVIN ratings
   - Read feedback about areas needing development
   - Realize he may need to retake

5. **Second Attempt** (optional)
   - Restart with more attention
   - Read scenarios carefully
   - Consider options thoughtfully
   - Achieve better results

**Expected Outcome**: Experience consequences of low engagement, potential for growth

---

### Scenario 9: Priya - High Achiever
**Context**: Priya wants to excel and get the highest possible score.

**Story**:
Priya is competitive and studies each scenario carefully to make the best choices.

**Test Steps**:

1. **Thorough Preparation**
   - Read all provided materials carefully
   - Review objectives multiple times
   - Take notes during introduction
   - Pay attention to every detail

2. **Strategic Completion**
   - Watch videos completely
   - Read all options carefully before choosing
   - Consider BRAVIN dimensions in choices
   - Think about long-term consequences
   - Use full timer duration to deliberate

3. **Maximize Learning**
   - Read all feedback thoroughly
   - Take notes on improvement areas
   - Pause to reflect on each scenario
   - Connect scenarios to real experiences

4. **Analyze Results**
   - Achieve high score (> 85%)
   - Review BRAVIN breakdown in detail
   - Compare strengths and weaknesses
   - Identify one area for development
   - Read all growth suggestions

5. **Apply Learnings**
   - Download results (if available)
   - Create personal development plan
   - Share insights with manager
   - Implement suggestions in real work

**Expected Outcome**: High score with deep learning and actionable insights

---

### Scenario 10: Carlos - Technical Issues
**Context**: Carlos encounters problems during his simulation.

**Story**:
Carlos's internet is unstable and he needs to complete training despite technical challenges.

**Test Steps**:

1. **Start With Issues**
   - Login successfully
   - Start simulation
   - Video buffers/loads slowly
   - Connection drops mid-scenario

2. **Recovery Process**
   - Refresh page
   - See resume modal
   - Review saved progress
   - Choose to resume (not restart)

3. **Verify Progress Saved**
   - Continues from last scenario
   - Previous answers preserved
   - Score tracking accurate
   - No data lost

4. **Complete Despite Issues**
   - Continue with slow connection
   - Experience buffering
   - Wait for videos to load
   - Submit responses when able

5. **Alternative Solutions**
   - Try different browser
   - Test on mobile device
   - Download offline version (if available)
   - Complete during better internet times

**Expected Outcome**: Successful completion with progress preservation

---

## CROSS-ROLE SCENARIOS

### Scenario 11: End-to-End Workflow
**Context**: Full lifecycle from admin creation to learner completion to instructor review.

**Story**:
Test the complete workflow of a simulation from creation to analysis.

**Participants**:
- Admin: Sarah
- Instructor: David
- Learner: James

**Test Steps**:

1. **Admin Creates (Sarah)**
   - Create new simulation
   - Build 5 scenarios with branching
   - Configure all metrics
   - Publish simulation

2. **Admin Assigns (Sarah)**
   - Create cohort
   - Add learners to cohort
   - Assign simulation
   - Set deadline

3. **Learner Notified (James)**
   - Login and see new assignment
   - View assignment details
   - Check due date
   - Note in calendar

4. **Learner Completes (James)**
   - Start simulation
   - Complete all scenarios
   - View results
   - Check BRAVIN profile updates

5. **Instructor Monitors (David)**
   - See real-time progress update
   - View James's completion
   - Check his score
   - Review his path through scenarios

6. **Instructor Reports (David)**
   - Export data including James
   - Generate completion report
   - Send to management
   - Document outcomes

7. **Admin Analyzes (Sarah)**
   - View overall analytics
   - Check completion rates
   - Review average scores
   - Identify improvement areas for simulation

**Expected Outcome**: Complete workflow functions seamlessly

---

### Scenario 12: Concurrent Users
**Context**: Multiple users accessing the system simultaneously.

**Story**:
Test system performance with multiple simultaneous users.

**Test Steps**:

1. **Setup**
   - Open 5 browser windows/tabs
   - Login as 5 different learners
   - All start the same simulation at once

2. **Simultaneous Progress**
   - All users progress through scenarios
   - Each makes different choices
   - System tracks all independently
   - No data conflicts

3. **Instructor Monitoring**
   - Instructor dashboard updates in real-time
   - Shows all 5 learners in progress
   - Updates as each completes scenarios
   - No performance degradation

4. **Completion**
   - Users finish at different times
   - Each receives individual results
   - All data recorded accurately
   - No lost or mixed data

**Expected Outcome**: System handles concurrent users without issues

---

## Test Data Suggestions

### Realistic Names for Test Users
**Admins**: Sarah Chen, Michael Rodriguez, Jennifer Park
**Instructors**: David Thompson, Lisa Wong, Carlos Martinez
**Learners**: James Wilson, Maria Garcia, Tom Anderson, Priya Patel, Emma Johnson

### Sample Simulation Titles
- "Difficult Conversations: Performance Management"
- "Leading Through Change"
- "Giving Effective Feedback"
- "Conflict Resolution Skills"
- "Building High-Performance Teams"
- "Strategic Decision Making"

### Sample Cohort Names
- "2025 Q1 Leadership Development"
- "New Manager Training - January"
- "Sales Team Excellence"
- "Operations Leadership"
- "Executive Development Program"

---

## Success Criteria

Each scenario should result in:
- [ ] All steps completed successfully
- [ ] No errors or crashes
- [ ] Data saved correctly
- [ ] User experience is smooth
- [ ] Expected outcomes achieved
- [ ] No data loss or corruption

---

Last Updated: 2025-12-16
Version: 1.0
