# Printable Test Checklist

## Pre-Test Setup
- [ ] Database connected and accessible
- [ ] Application running (dev or production)
- [ ] Test users created:
  - [ ] admin@test.com (Admin)
  - [ ] instructor@test.com (Instructor)
  - [ ] learner1@test.com (Learner)
- [ ] At least 1 complete simulation available
- [ ] Test cohort created with assigned learners

---

## ADMIN TESTS

### Authentication
- [ ] Login successful
- [ ] Dashboard displays
- [ ] Admin menu accessible
- [ ] Logout works

### Simulation Management
- [ ] Create new simulation
- [ ] Edit simulation details
- [ ] Add scenarios
- [ ] Connect branching paths
- [ ] Add videos to scenarios
- [ ] Set difficulty levels
- [ ] Publish simulation
- [ ] Preview simulation

### Scenario Configuration
- [ ] Add scenario question
- [ ] Create 2-4 options per scenario
- [ ] Set BRAVIN scores for options
- [ ] Assign competencies
- [ ] Add feedback videos
- [ ] Configure transitions
- [ ] Set hierarchy levels

### Video Management
- [ ] Add video via YouTube URL
- [ ] Add video via Vimeo URL
- [ ] Add video via embed code
- [ ] Upload video file (if S3)
- [ ] Browse video library
- [ ] Search videos
- [ ] Preview playback

### User Management
- [ ] Create new user
- [ ] Edit user details
- [ ] Change user role
- [ ] Bulk upload users
- [ ] Search users
- [ ] Deactivate user

### Cohort Management
- [ ] Create cohort
- [ ] Add learners to cohort
- [ ] Assign simulation to cohort
- [ ] Set due dates
- [ ] Remove learners from cohort

### Branding
- [ ] Change primary color
- [ ] Upload logo
- [ ] Update app title
- [ ] Modify welcome text
- [ ] Save changes
- [ ] Verify changes apply

### Analytics
- [ ] View dashboard statistics
- [ ] Check completion rates
- [ ] Review score distributions
- [ ] Analyze path decisions
- [ ] Export reports

---

## INSTRUCTOR TESTS

### Dashboard Access
- [ ] Login successful
- [ ] Instructor dashboard displays
- [ ] Statistics cards show data
- [ ] Learner table loads

### Progress Monitoring
- [ ] View all assigned learners
- [ ] See completion status
- [ ] Check scenario counts
- [ ] View scores
- [ ] See time spent

### Search & Filter
- [ ] Search by name
- [ ] Search by email
- [ ] Filter by status (completed)
- [ ] Filter by status (in_progress)
- [ ] Filter by status (abandoned)
- [ ] Sort by score
- [ ] Sort by date

### Export
- [ ] Click Export CSV
- [ ] File downloads
- [ ] Open in spreadsheet
- [ ] Verify data accuracy
- [ ] All columns present

### Teacher Dashboard
- [ ] Access teacher dashboard
- [ ] Navigate Assignments tab
- [ ] Navigate Cohorts tab
- [ ] Navigate Simulations tab
- [ ] Navigate Analytics tab
- [ ] Navigate Metrics tab
- [ ] Tab transitions smooth

---

## LEARNER TESTS

### Dashboard
- [ ] Login successful
- [ ] Assigned simulations display
- [ ] BRAVIN widget shows
- [ ] Skills progress displays
- [ ] Recent activity shows

### Simulation Flow - Start
- [ ] Click simulation tile
- [ ] Landing page displays
- [ ] Read description
- [ ] View estimated time
- [ ] See difficulty level
- [ ] Click "Start Simulation"

### Difficulty Selection (if applicable)
- [ ] Difficulty options display
- [ ] Select difficulty
- [ ] Fiction contract shows
- [ ] Confirm selection

### Introduction
- [ ] Introduction page displays
- [ ] Video plays
- [ ] Context text readable
- [ ] Objectives clear
- [ ] Click "Begin Scenarios"

### Scenario Completion
- [ ] Scenario 1 loads
- [ ] Video plays smoothly
- [ ] Question text displays
- [ ] All options show
- [ ] Timer displays (if enabled)
- [ ] Select option
- [ ] Submit response

### Feedback
- [ ] Feedback loads immediately
- [ ] Feedback video plays
- [ ] Feedback text relevant
- [ ] BRAVIN impacts show (+/-)
- [ ] Competency feedback displays
- [ ] Click "Continue"

### Transitions
- [ ] Transition page displays
- [ ] Transition video plays (if present)
- [ ] Narrative text shows
- [ ] Progress indicator updates
- [ ] Click "Continue to Next"

### Branching
- [ ] Different choices lead to different scenarios
- [ ] Story remains coherent
- [ ] No broken connections
- [ ] All paths work

### Completion
- [ ] Final results page displays
- [ ] Final score shows
- [ ] Scenarios completed count
- [ ] Time spent accurate
- [ ] BRAVIN breakdown displays:
  - [ ] Business Acumen
  - [ ] Results Orientation
  - [ ] Analytical Thinking
  - [ ] Valuing Diversity
  - [ ] Inspiring Performance
  - [ ] Networking
- [ ] Radar chart renders
- [ ] Competency feedback shows
- [ ] Growth suggestions display

### Resume Feature
- [ ] Start simulation
- [ ] Complete 2 scenarios
- [ ] Logout
- [ ] Login again
- [ ] Resume modal displays
- [ ] Shows previous progress
- [ ] Resume continues correctly
- [ ] Restart option works

### Profile Updates
- [ ] BRAVIN widget updates
- [ ] Skills progress updates
- [ ] Recent activity updated
- [ ] Simulation marked complete

---

## CROSS-FUNCTIONAL TESTS

### Multi-Language (if implemented)
- [ ] Language switcher accessible
- [ ] Switch to Spanish
- [ ] UI text translates
- [ ] Scenario content translates
- [ ] Feedback translates
- [ ] Switch back to English
- [ ] Language persists

### Responsive Design
- [ ] Test mobile view (375px)
- [ ] Test tablet view (768px)
- [ ] Test desktop view (1920px)
- [ ] All pages responsive
- [ ] No horizontal scroll
- [ ] Buttons accessible
- [ ] Forms usable
- [ ] Videos scale properly

### Dark Mode (if implemented)
- [ ] Toggle dark mode
- [ ] Text readable
- [ ] Good contrast
- [ ] Videos display well
- [ ] Toggle persists

### Performance
- [ ] Pages load < 3 seconds
- [ ] Videos start < 2 seconds
- [ ] No excessive buffering
- [ ] No lag in interactions
- [ ] Smooth animations

### Error Handling
- [ ] Invalid login rejected
- [ ] Form validation works
- [ ] Network errors handled
- [ ] Session timeout redirects
- [ ] Error messages clear
- [ ] No crashes

---

## DATA VERIFICATION

### Database Checks (if accessible)
- [ ] User created in profiles table
- [ ] Simulation created in simulations table
- [ ] Scenarios linked correctly
- [ ] Responses recorded in learner_responses
- [ ] Metrics saved in learner_metrics
- [ ] Instance created in simulation_instances
- [ ] Timestamps accurate

### Calculation Verification
- [ ] BRAVIN scores add up correctly
- [ ] Competency impacts applied
- [ ] Final score matches expected
- [ ] Weighted averages correct

---

## BROWSER TESTING

### Chrome
- [ ] All features work
- [ ] Videos play
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] Videos play
- [ ] No console errors

### Safari
- [ ] All features work
- [ ] Videos play
- [ ] No console errors

### Edge
- [ ] All features work
- [ ] Videos play
- [ ] No console errors

---

## SECURITY TESTS

### Authentication
- [ ] Wrong password rejected
- [ ] Non-existent user rejected
- [ ] SQL injection prevented
- [ ] XSS attempts blocked
- [ ] Passwords masked
- [ ] Session expires properly
- [ ] Logout clears session

### Authorization
- [ ] Learner can't access admin pages
- [ ] Learner can't access instructor pages
- [ ] Instructor can't access admin features
- [ ] Users see only their data
- [ ] Direct URL access blocked

---

## ISSUES FOUND

| # | Feature | Issue | Severity | Status |
|---|---------|-------|----------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

**Severity Levels:**
- **Critical**: Blocks usage, must fix immediately
- **High**: Major feature broken, fix soon
- **Medium**: Feature works but has issues
- **Low**: Minor issue, cosmetic

---

## TEST SESSION INFO

**Date:** _______________
**Tester:** _______________
**Environment:** _______________
**Build/Version:** _______________
**Browser:** _______________
**Start Time:** _______________
**End Time:** _______________

---

## OVERALL ASSESSMENT

**Pass Rate:** _____ / _____ tests passed (_____%)

**Critical Issues:** _____
**High Priority Issues:** _____
**Medium Priority Issues:** _____
**Low Priority Issues:** _____

**Ready for Production?** [ ] Yes [ ] No

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## SIGN-OFF

**Tested By:** _______________________  **Date:** ______________

**Reviewed By:** _____________________  **Date:** ______________

**Approved By:** _____________________  **Date:** ______________

---

Last Updated: 2025-12-16
Version: 1.0
