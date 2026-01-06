# Quick Test Guide - Essential Test Cases

## Pre-Testing Setup

### Required Test Data
- [ ] 3 user accounts created (Admin, Instructor, Learner)
- [ ] 1 complete simulation with 5+ scenarios
- [ ] 1 cohort with assigned learners
- [ ] Sample videos or placeholders ready

---

## 15-Minute Quick Test (Critical Path)

### 1. Admin Tests (5 minutes)
```
✓ Login as admin@test.com
✓ Navigate to Admin > Simulations
✓ Open existing simulation
✓ Verify scenarios load and display properly
✓ Check video previews work
✓ Verify branching connections visible
```

### 2. Learner Tests (7 minutes)
```
✓ Login as learner1@test.com
✓ View dashboard - verify assigned simulations appear
✓ Click simulation to start
✓ Complete simulation flow:
  → Landing page displays
  → Introduction plays
  → Answer 3 scenario questions
  → View feedback after each
  → See transition between scenarios
  → Complete and view results
✓ Verify BRAVIN scores display
✓ Check competency feedback appears
```

### 3. Instructor Tests (3 minutes)
```
✓ Login as instructor@test.com
✓ View Instructor Dashboard
✓ Verify learner appears in progress table
✓ Check completed scenario count
✓ Click "Export CSV"
✓ Verify CSV downloads with correct data
```

**If all above pass → Core functionality working**

---

## 30-Minute Comprehensive Test

### ADMIN ROLE (12 minutes)

#### Simulation Management
- [ ] Create new simulation
- [ ] Add 3 scenarios with branching
- [ ] Set metrics for each option (BRAVIN scores)
- [ ] Assign competencies
- [ ] Add videos (URL or embed)
- [ ] Publish simulation

#### User & Cohort Management
- [ ] Create new learner user
- [ ] Create cohort
- [ ] Assign learners to cohort
- [ ] Assign simulation to cohort
- [ ] Set due date

#### Branding & Settings
- [ ] Change primary color
- [ ] Upload logo
- [ ] Update welcome text
- [ ] Save and verify changes appear

---

### LEARNER ROLE (12 minutes)

#### Dashboard
- [ ] View assigned simulations
- [ ] Check BRAVIN profile widget
- [ ] Review skills progress
- [ ] Verify recent activity

#### Complete Simulation
- [ ] Start from landing page
- [ ] Select difficulty (if applicable)
- [ ] Watch introduction
- [ ] Answer 5+ scenario questions
- [ ] View feedback videos
- [ ] Experience branching (try different paths)
- [ ] Complete simulation
- [ ] Review final results

#### Results & Analytics
- [ ] Check final score
- [ ] View BRAVIN breakdown
- [ ] Read competency feedback
- [ ] Verify time tracking
- [ ] Test resume simulation feature

---

### INSTRUCTOR ROLE (6 minutes)

#### Dashboard & Monitoring
- [ ] View all assigned learners
- [ ] Check statistics cards (accurate counts)
- [ ] Search for specific learner
- [ ] Filter by status
- [ ] Sort by score
- [ ] Export progress report

#### Teacher Dashboard
- [ ] Navigate through all tabs
- [ ] View assignments panel
- [ ] Check cohorts panel
- [ ] Browse simulations
- [ ] Review analytics

---

## Feature-Specific Tests (15 minutes each)

### Video System Tests
- [ ] Add YouTube video via URL
- [ ] Add Vimeo video via URL
- [ ] Add video via embed code
- [ ] Upload video file (if S3 configured)
- [ ] Browse video library
- [ ] Search videos
- [ ] Preview video playback
- [ ] Use video in scenario

### Branching Logic Tests
- [ ] Create scenario with 3 options
- [ ] Connect Option A → Scenario 2A
- [ ] Connect Option B → Scenario 2B
- [ ] Connect Option C → Scenario 2C
- [ ] Test as learner - verify different paths
- [ ] Check all paths reach completion

### Metrics & Scoring Tests
- [ ] Set BRAVIN scores for options
- [ ] Complete simulation
- [ ] Manually calculate expected score
- [ ] Compare with system score
- [ ] Verify all 6 dimensions update
- [ ] Check competency impacts apply

---

## Common Issues Checklist

### If Login Fails
- [ ] Check database connection
- [ ] Verify user exists in database
- [ ] Check password is correct
- [ ] Clear browser cache/cookies
- [ ] Check console for errors

### If Simulations Don't Display
- [ ] Verify simulation is published
- [ ] Check user is assigned to cohort
- [ ] Check cohort has simulation assigned
- [ ] Verify RLS policies (database)
- [ ] Check browser console for errors

### If Videos Don't Play
- [ ] Verify video URL is valid
- [ ] Check network connection
- [ ] Test URL in separate browser tab
- [ ] Verify embed permissions
- [ ] Check for CORS issues

### If Scores Are Wrong
- [ ] Verify metric scores set on options
- [ ] Check competency weights configured
- [ ] Review calculation logic
- [ ] Check database values
- [ ] Test with known scenario path

---

## Browser Console Checks

Open Developer Tools (F12) and check:
- [ ] No red errors in Console tab
- [ ] No 404 errors in Network tab
- [ ] No failed API requests
- [ ] Database queries execute successfully
- [ ] Session/auth tokens present

---

## Performance Checks

### Page Load Times (Target: < 3 seconds)
- [ ] Login page
- [ ] Dashboard
- [ ] Simulation list
- [ ] Scenario player
- [ ] Results page

### Video Performance
- [ ] Videos start within 2 seconds
- [ ] No excessive buffering
- [ ] Smooth playback
- [ ] No audio sync issues

---

## Mobile Testing (Quick)

On mobile device or dev tools mobile view:
- [ ] Login page responsive
- [ ] Dashboard readable
- [ ] Simulation playable
- [ ] Buttons accessible
- [ ] Videos scale properly
- [ ] Tables scroll horizontally
- [ ] Forms usable

---

## Data Verification Queries

If you have database access, verify:

```sql
-- Check user was created
SELECT * FROM profiles WHERE email = 'test@test.com';

-- Check simulation exists
SELECT * FROM simulations WHERE title = 'Test Simulation';

-- Check learner responses recorded
SELECT * FROM learner_responses WHERE learner_id = 'user-id';

-- Check metrics recorded
SELECT * FROM learner_metrics WHERE instance_id = 'instance-id';

-- Check simulation instance created
SELECT * FROM simulation_instances WHERE learner_id = 'user-id';
```

---

## Test Result Format

| Feature | Status | Issues | Priority |
|---------|--------|--------|----------|
| Login | ✅ Pass | None | - |
| Create Simulation | ❌ Fail | Video upload broken | High |
| Complete Scenario | ⚠️ Partial | Feedback delayed | Medium |
| Export Report | ✅ Pass | None | - |

**Legend:**
- ✅ Pass: Works as expected
- ❌ Fail: Does not work, blocks usage
- ⚠️ Partial: Works but has issues

---

## Priority Testing Order

**Must Test First (P0 - Critical)**:
1. Login/Authentication
2. Complete a simulation (learner flow)
3. View results
4. Basic admin creation

**Should Test Next (P1 - Important)**:
5. Branching logic
6. Instructor dashboard
7. Video playback
8. Metrics calculation

**Can Test Later (P2 - Nice to Have)**:
9. Branding customization
10. Bulk uploads
11. Advanced analytics
12. Export features

---

## One-Page Test Checklist

### Quick Smoke Test (5 min)
- [ ] Can login as admin
- [ ] Can login as learner
- [ ] Can start simulation
- [ ] Can answer 1 question
- [ ] Can view results

### Standard Test (15 min)
- [ ] Create simulation (admin)
- [ ] Assign to cohort (admin)
- [ ] Complete simulation (learner)
- [ ] View progress (instructor)
- [ ] Export report (instructor)

### Full Test (30 min)
- [ ] All admin features
- [ ] Complete learner journey
- [ ] All instructor tools
- [ ] Cross-user verification

---

## Environment Variables to Check

Ensure these are set before testing:
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
AWS_ACCESS_KEY_ID=... (if using S3)
AWS_SECRET_ACCESS_KEY=... (if using S3)
AWS_REGION=... (if using S3)
```

---

## After Each Test Session

- [ ] Document all bugs found
- [ ] Note any performance issues
- [ ] Screenshot any errors
- [ ] Record console error messages
- [ ] Check database for orphaned data
- [ ] Clear test data if needed

---

**Quick Reference Numbers:**
- Target page load: < 3 seconds
- Target video start: < 2 seconds
- Supported browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Mobile breakpoints: 375px (mobile), 768px (tablet), 1024px (desktop)

**Emergency Contacts:**
- For critical bugs: [Contact Info]
- For test data issues: [Contact Info]
- For environment issues: [Contact Info]

---

Last Updated: 2025-12-16
Version: 1.0
