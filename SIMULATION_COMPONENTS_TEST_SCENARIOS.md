# Simulation Components - Test Scenarios

## Overview

Comprehensive test scenarios for validating simulation component features, both existing and newly implemented.

**Target System**: Next.js Simulation Platform
**Test Environment**: Development/Staging
**Date**: January 18, 2026

---

## Test User Profiles

### Profile 1: New Learner (first_attempt)
- **User ID**: `test-learner-001`
- **Experience**: No prior attempts
- **Purpose**: Test first-time user experience

### Profile 2: Returning Learner (multiple_attempts)
- **User ID**: `test-learner-002`
- **Attempts**: 3 previous attempts
- **Purpose**: Test multi-attempt tracking and comparison

### Profile 3: High Performer (advanced_learner)
- **User ID**: `test-learner-003`
- **Scores**: All above 85%
- **Purpose**: Test excellent performance tier

### Profile 4: Developing Learner (needs_improvement)
- **User ID**: `test-learner-004`
- **Scores**: Below 60%
- **Purpose**: Test developing performance tier

---

## Test Scenarios

### Scenario Group 1: Complete Simulation Flow

#### TC-1.1: First-Time Simulation Completion
**Objective**: Verify complete simulation flow for new user

**Prerequisites**:
- User: New Learner (first_attempt)
- Simulation: "Leadership Decision Making" (with 4 scenarios)

**Steps**:
1. Navigate to `/simulations`
2. Select "Leadership Decision Making" simulation
3. Click "Start Simulation"
4. Watch introduction video (or skip if allowed)
5. Complete Scenario 1:
   - Watch scenario introduction
   - Read scenario prompt
   - Select option B (moderate choice)
   - View feedback
   - Watch feedback video
6. Complete Scenario 2:
   - Same steps as Scenario 1
7. Complete Scenario 3 and 4
8. View results page

**Expected Results**:
- ✅ All videos load correctly
- ✅ Decision timer shows (if enabled)
- ✅ Feedback displays correctly
- ✅ Progress tracked through all scenarios
- ✅ Results page shows:
  - Overall score
  - BRAVIN dimensions
  - Competency development
  - Decision time statistics
- ✅ Completion page displays with performance tier
- ✅ Learning recommendations shown

**Pass Criteria**: All steps complete without errors, results accurate

---

#### TC-1.2: Simulation with Timer
**Objective**: Verify decision timer functionality

**Prerequisites**:
- User: New Learner
- Simulation: One with `show_timer` enabled

**Steps**:
1. Start simulation
2. Navigate to decision point
3. Observe timer display
4. Wait 30 seconds before making decision
5. Select option
6. View results

**Expected Results**:
- ✅ Timer displays countdown
- ✅ Timer shows time elapsed
- ✅ Decision time recorded in database
- ✅ Results page shows decision time
- ✅ Feedback page shows time taken (if configured)

---

### Scenario Group 2: Results Dashboard

#### TC-2.1: Results Hub Navigation
**Objective**: Verify all result types accessible

**Prerequisites**:
- User: Returning Learner (completed simulation)
- Simulation ID: Any completed

**Steps**:
1. Navigate to `/simulations/[id]/results`
2. Verify all result cards visible:
   - BRAVIN Leadership Assessment
   - Learning Path Visualization
   - Alignment Meeting Results
   - Competency Progress
3. Click each card
4. Verify navigation to respective pages

**Expected Results**:
- ✅ All 4 result cards display
- ✅ Each card shows relevant preview data
- ✅ Navigation works for all cards
- ✅ Back navigation returns to hub
- ✅ Proper loading states shown

---

#### TC-2.2: BRAVIN Results Detailed View
**Objective**: Validate BRAVIN dimension analysis

**Prerequisites**:
- User: High Performer
- Simulation: With BRAVIN mappings

**Steps**:
1. Navigate to `/simulations/[id]/results/bravin`
2. Verify all 6 dimensions shown:
   - Boldness
   - Responsibility
   - Accountability
   - Vision
   - Integrity
   - Nurturance
3. Check detailed breakdown option
4. Compare with expected scores

**Expected Results**:
- ✅ All 6 dimensions displayed with icons
- ✅ Scores match database values
- ✅ Radar chart rendered correctly
- ✅ Dimension descriptions shown
- ✅ Trend indicators (if multiple attempts)
- ✅ Color coding matches dimension
- ✅ Overall BRAVIN score calculated correctly

---

#### TC-2.3: Learning Path Visualization
**Objective**: Verify decision path tracking

**Prerequisites**:
- User: Any completed simulation
- Instance ID: Valid

**Steps**:
1. Navigate to `/simulations/[id]/results/learning-path`
2. Verify path visualization shows:
   - All scenarios completed
   - Options selected
   - Hierarchy levels
3. Hover over path nodes
4. Check for alternative paths

**Expected Results**:
- ✅ Complete decision path rendered
- ✅ Scenario nodes clickable/hoverable
- ✅ Alternative paths shown in lighter color
- ✅ Current path highlighted
- ✅ Scenario titles and descriptions accurate
- ✅ Responsive on different screen sizes

---

#### TC-2.4: Competency Development Results
**Objective**: Validate competency tracking

**Prerequisites**:
- User: Returning Learner
- Multiple simulations completed

**Steps**:
1. Navigate to `/simulations/[id]/results/competencies`
2. Verify competencies shown:
   - Current scores
   - Level indicators
   - Progress bars
3. Check for empty state (new user)

**Expected Results**:
- ✅ All affected competencies displayed
- ✅ Scores accurate to database
- ✅ Visual progress bars rendered
- ✅ Level names shown correctly
- ✅ Trend indicators (if applicable)
- ✅ Empty state guidance (new users)
- ✅ API calls successful

---

### Scenario Group 3: Enhanced Features

#### TC-3.1: Multi-Attempt History (NEW)
**Objective**: Verify attempt tracking and comparison

**Prerequisites**:
- User: Returning Learner (3 attempts)
- Simulation: Same simulation, multiple attempts

**Steps**:
1. Complete simulation (Attempt 1)
2. Navigate to results
3. Note final score
4. Restart simulation (Attempt 2)
5. Complete with different choices
6. Navigate to results
7. Check "View History" option
8. Verify both attempts listed
9. Compare attempts

**Expected Results**:
- ✅ All attempts tracked separately
- ✅ Attempt numbers shown (1, 2, 3...)
- ✅ Best attempt highlighted
- ✅ Scores for each attempt accurate
- ✅ Comparison view works
- ✅ Can switch between attempts
- ✅ Date/time stamps correct

---

#### TC-3.2: Trend Analysis in Metrics (NEW)
**Objective**: Verify metric trend calculation

**Prerequisites**:
- User: Returning Learner (5+ assessments)
- Metrics: Multiple data points

**Steps**:
1. Navigate to metrics summary
2. Check for trend indicators:
   - Improving (↗️)
   - Stable (→)
   - Declining (↘️)
3. Verify calculations match data
4. Check pass rate percentages

**Expected Results**:
- ✅ Trend correctly calculated
- ✅ Icons display appropriately
- ✅ Pass rate percentage accurate
- ✅ High/low scores shown
- ✅ Average calculated correctly
- ✅ Visual indicators match data

---

#### TC-3.3: Performance Tier Calculation (NEW)
**Objective**: Validate tier assignment

**Prerequisites**:
- Three user profiles with different scores

**Test Cases**:

**Case A: Excellent Tier**
- User: High Performer
- Expected: Score ≥ 85%
- Tier: "Excellent" (Gold badge)

**Case B: Good Tier**
- User: Average performer
- Expected: 70% ≤ Score < 85%
- Tier: "Good" (Silver badge)

**Case C: Developing Tier**
- User: Needs Improvement
- Expected: Score < 70%
- Tier: "Developing" (Bronze badge)

**Expected Results**:
- ✅ Correct tier assigned for each case
- ✅ Badge color matches tier
- ✅ Messaging appropriate for tier
- ✅ Recommendations tailored to tier

---

#### TC-3.4: Completion Page Experience (NEW)
**Objective**: Verify completion page features

**Prerequisites**:
- User: Any profile
- Simulation: Just completed

**Steps**:
1. Complete final scenario
2. Navigate to completion page (auto or manual)
3. Verify elements present:
   - Performance badge
   - Score reveal animation
   - Top 3 competencies
   - Personalized message
   - Learning recommendations
   - Next actions
4. Click "View Detailed Results"
5. Click "Retake Simulation"

**Expected Results**:
- ✅ Page loads automatically after completion
- ✅ Animated score reveal works
- ✅ Performance badge displayed
- ✅ Top competencies accurate
- ✅ Recommendations relevant
- ✅ Video plays (if configured)
- ✅ Navigation buttons functional
- ✅ Celebratory tone appropriate

---

### Scenario Group 4: Error Handling

#### TC-4.1: Missing Simulation Data
**Objective**: Graceful handling of missing data

**Steps**:
1. Navigate to `/simulations/invalid-id`
2. Check error display
3. Verify navigation options

**Expected Results**:
- ✅ Error page displayed
- ✅ Clear error message
- ✅ Back to dashboard link
- ✅ No console errors
- ✅ Proper HTTP status code

---

#### TC-4.2: Incomplete Simulation
**Objective**: Handle abandoned simulations

**Steps**:
1. Start simulation
2. Complete 2 of 4 scenarios
3. Close browser/logout
4. Log back in
5. Navigate to simulations

**Expected Results**:
- ✅ Resume modal appears
- ✅ Option to continue or restart
- ✅ Progress preserved
- ✅ Can complete from where left off
- ✅ Or can restart fresh

---

#### TC-4.3: No BRAVIN Data
**Objective**: Handle missing BRAVIN configuration

**Prerequisites**:
- Simulation: Without BRAVIN mappings

**Steps**:
1. Complete simulation
2. Navigate to BRAVIN results

**Expected Results**:
- ✅ Informative empty state shown
- ✅ Explains why no data
- ✅ Guides administrator
- ✅ No errors in console
- ✅ Still shows other results

---

### Scenario Group 5: Component Integration

#### TC-5.1: Video Player Integration
**Objective**: Verify all video types work

**Video Types to Test**:
- YouTube embedded
- Synthesia videos
- Direct video URLs (MP4)
- Missing/broken videos

**Steps**:
1. For each video type:
   - Load video
   - Play video
   - Pause/resume
   - Skip (if allowed)
   - Complete watching
2. Verify tracking

**Expected Results**:
- ✅ All video types load correctly
- ✅ Controls work properly
- ✅ Skip button shows if allowed
- ✅ Watch progress tracked
- ✅ Completion detected
- ✅ Broken videos handled gracefully

---

#### TC-5.2: Decision Timer Integration
**Objective**: Verify timer in question pages

**Steps**:
1. Navigate to question with timer enabled
2. Observe timer countdown
3. Make decision before timeout
4. Check recorded time

**Expected Results**:
- ✅ Timer displays correctly
- ✅ Counts down/up as configured
- ✅ Time recorded accurately
- ✅ No performance issues
- ✅ Works on mobile devices

---

#### TC-5.3: Learning Recommendations Display
**Objective**: Verify recommendations shown

**Steps**:
1. Complete scenario
2. View feedback page
3. Check for:
   - Practice exercises
   - Next steps
   - Learning resources
4. Click resource links

**Expected Results**:
- ✅ Recommendations displayed
- ✅ Relevant to option selected
- ✅ Links functional
- ✅ Proper formatting
- ✅ Empty state if none configured

---

### Scenario Group 6: Performance Testing

#### TC-6.1: Large Dataset Handling
**Objective**: Test with many attempts/assessments

**Prerequisites**:
- User: 20+ simulation attempts
- Metrics: 100+ assessments

**Steps**:
1. Load results dashboard
2. View attempt history
3. Load metrics summary
4. Check page responsiveness

**Expected Results**:
- ✅ Pages load within 3 seconds
- ✅ No UI lag
- ✅ Pagination/lazy loading works
- ✅ No memory leaks
- ✅ Smooth scrolling

---

#### TC-6.2: Concurrent Users
**Objective**: Test with multiple simultaneous users

**Steps**:
1. Simulate 50 concurrent users
2. All starting simulations
3. All completing scenarios
4. All viewing results

**Expected Results**:
- ✅ No database locks
- ✅ Correct data isolation
- ✅ No race conditions
- ✅ Response times acceptable
- ✅ No errors in logs

---

### Scenario Group 7: Accessibility

#### TC-7.1: Keyboard Navigation
**Objective**: Verify keyboard accessibility

**Steps**:
1. Navigate entire simulation using only keyboard
2. Tab through all interactive elements
3. Use Enter/Space to activate
4. Check focus indicators

**Expected Results**:
- ✅ All elements keyboard accessible
- ✅ Tab order logical
- ✅ Focus indicators visible
- ✅ No keyboard traps
- ✅ Skip links present

---

#### TC-7.2: Screen Reader Compatibility
**Objective**: Verify screen reader support

**Tools**: NVDA, JAWS, VoiceOver

**Steps**:
1. Navigate with screen reader
2. Verify all content announced
3. Check ARIA labels
4. Verify semantic HTML

**Expected Results**:
- ✅ All content accessible
- ✅ Proper heading structure
- ✅ ARIA labels present
- ✅ Form fields labeled
- ✅ Dynamic content announced

---

### Scenario Group 8: Mobile Responsiveness

#### TC-8.1: Mobile Simulation Flow
**Objective**: Complete simulation on mobile

**Devices**: iPhone 12, Samsung Galaxy S21, iPad

**Steps**:
1. Complete full simulation on each device
2. Test portrait and landscape
3. Verify touch interactions
4. Check video playback

**Expected Results**:
- ✅ Layout responsive
- ✅ All features functional
- ✅ Touch targets adequate (44px min)
- ✅ Videos play on mobile
- ✅ No horizontal scroll
- ✅ Text readable without zoom

---

## Test Data Requirements

### Database Setup

```sql
-- Create test users
INSERT INTO profiles (id, email, full_name, role) VALUES
  ('test-learner-001', 'new@test.com', 'New Learner', 'learner'),
  ('test-learner-002', 'returning@test.com', 'Returning Learner', 'learner'),
  ('test-learner-003', 'advanced@test.com', 'High Performer', 'learner'),
  ('test-learner-004', 'developing@test.com', 'Needs Improvement', 'learner');

-- Create test simulation
INSERT INTO simulations (id, name, display_name, difficulty) VALUES
  ('test-sim-001', 'test-leadership', 'Leadership Decision Making', 'intermediate');

-- Create test scenarios (4)
-- Create test options (3 per scenario)
-- Create BRAVIN mappings
-- Create competency mappings
```

---

## Automated Test Scripts

### Jest/Playwright Tests

```typescript
// Example automated test
describe('Simulation Results Dashboard', () => {
  beforeEach(async () => {
    await setupTestUser('test-learner-002');
    await completeSimulation('test-sim-001');
  });

  it('should display all result cards', async () => {
    await page.goto('/simulations/test-sim-001/results');

    expect(await page.locator('[data-testid="bravin-card"]').isVisible()).toBe(true);
    expect(await page.locator('[data-testid="competency-card"]').isVisible()).toBe(true);
    expect(await page.locator('[data-testid="learningpath-card"]').isVisible()).toBe(true);
    expect(await page.locator('[data-testid="alignment-card"]').isVisible()).toBe(true);
  });

  it('should navigate to BRAVIN results', async () => {
    await page.goto('/simulations/test-sim-001/results');
    await page.click('[data-testid="bravin-card"]');

    await page.waitForURL('**/bravin');
    expect(await page.locator('h1').textContent()).toContain('BRAVIN');
  });
});
```

---

## Test Execution Checklist

### Pre-Testing
- [ ] Database seeded with test data
- [ ] Test users created
- [ ] Environment variables configured
- [ ] Development server running

### During Testing
- [ ] Record all failures
- [ ] Screenshot errors
- [ ] Note performance metrics
- [ ] Check console for warnings

### Post-Testing
- [ ] Document all bugs found
- [ ] Create GitHub issues
- [ ] Update test scenarios as needed
- [ ] Clean up test data

---

## Bug Report Template

```markdown
### Bug ID: [Auto-generated]
### Title: [Brief description]
### Severity: [Critical/High/Medium/Low]

**Test Case**: TC-X.X
**Environment**: Dev/Staging/Prod
**Browser**: Chrome 120 / Firefox 121 / Safari 17

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots**:
[Attach screenshots]

**Console Logs**:
```
[Paste relevant logs]
```

**Additional Notes**:
[Any other relevant information]
```

---

## Test Coverage Goals

- **Unit Tests**: ≥ 80% code coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: All critical user paths
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: <3s page load, <100ms interaction

---

## Sign-Off

**Test Lead**: ________________
**Date**: ________________
**Status**: ☐ Passed ☐ Failed ☐ Blocked
**Notes**: ________________

---

**Last Updated**: January 18, 2026
