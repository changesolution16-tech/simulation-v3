# Bolt Hosting Deployment - Ready for Production

## Deployment Status: COMPLETE

Your Moodle Soft Skills Leadership Simulation platform is built and ready to publish on Bolt hosting.

---

## What's Been Completed

### Build Status
- Production build completed successfully
- Bundle size: 2.13 MB (492 KB gzipped)
- All TypeScript compiled without errors
- Environment variables embedded correctly in build
- Assets optimized and ready for deployment

### Supabase Database
- **Status**: Connected and configured
- **Project**: gglzmggwifbkxtxjclcw.supabase.co
- **Tables**: 76 tables created
- **Migrations**: 62 migrations applied
- **Features**: Full LTI integration, user management, scenarios, analytics, and assessment system

### Built Features
- LTI 1.3 / LTI Advantage integration for Moodle
- Video-based branching scenarios
- Bravin metrics assessment system
- Competency tracking and mapping
- Instructor and learner dashboards
- Real-time analytics and reporting
- Branding customization support
- Row Level Security on all tables

---

## Your Bolt Deployment Information

### Current Subdomain
```
https://change-solutions-lea-ooxn.bolt.host
```

### Application Structure
- **Frontend**: React + TypeScript + Vite
- **Database**: Supabase (already configured)
- **Auth**: Supabase Auth + LTI 1.3 SSO
- **Storage**: Supabase Storage (for videos and images)

---

## Next Steps - Publish Your Application

### 1. Publish to Bolt Hosting (You Are Here)

Your application is already on Bolt, but if you need to republish:

1. The build is complete in the `dist/` folder
2. Bolt automatically deploys changes when you save
3. Your app is live at: `https://change-solutions-lea-ooxn.bolt.host`

**To verify deployment:**
- Visit: `https://change-solutions-lea-ooxn.bolt.host`
- You should see the login page
- Check browser console for any errors

### 2. Optional: Connect Custom Domain

If you want to use your own domain instead of the .bolt.host subdomain:

1. In Bolt, go to "Domains & Hosting" settings
2. Click "Connect a domain you own" or "Buy a new domain"
3. Follow Bolt's instructions to configure DNS
4. Wait for DNS propagation (5-60 minutes)
5. Update Moodle LTI configuration with new domain

**Important**: If you change domains, you'll need to update the Moodle LTI tool configuration with the new URLs.

---

## Configure Moodle Integration

### Step 1: Access LTI Configuration Page

Visit your LTI configuration page:
```
https://change-solutions-lea-ooxn.bolt.host/lti/config
```

This page displays all the values you need for Moodle setup.

### Step 2: Register Tool in Moodle

1. **Login to Moodle as Administrator**

2. **Navigate to External Tool Settings**
   - Go to: Site administration → Plugins → Activity modules → External tool
   - Click: "Manage tools"
   - Click: "Configure a tool manually"

3. **Enter Configuration Values** (from your /lti/config page)

   | Moodle Field | Value from Config Page |
   |--------------|------------------------|
   | Tool name | Soft Skills Leadership Simulation |
   | Tool URL | https://change-solutions-lea-ooxn.bolt.host/lti/launch |
   | LTI version | LTI 1.3 |
   | Public key type | Keyset URL |
   | Public keyset URL | https://change-solutions-lea-ooxn.bolt.host/lti/jwks |
   | Initiate login URL | https://change-solutions-lea-ooxn.bolt.host/lti/login |
   | Redirection URI(s) | https://change-solutions-lea-ooxn.bolt.host/lti/launch |

4. **Enable Services**
   - Check: "IMS LTI Assignment and Grade Services"
   - Check: "IMS LTI Names and Role Provisioning Services"
   - Check: "Tool Settings"

5. **Privacy Settings**
   - Check: "Share launcher's name with tool"
   - Check: "Share launcher's email with tool"
   - Check: "Accept grades from the tool"

6. **Save Changes**

### Step 3: Register Moodle Platform in Supabase

After saving in Moodle, you'll receive:
- Client ID
- Deployment ID

Run this SQL in your Supabase SQL Editor:

```sql
INSERT INTO lti_deployments (
  platform_name,
  issuer,
  client_id,
  deployment_id,
  auth_login_url,
  auth_token_url,
  jwks_url,
  is_active
) VALUES (
  'Your Moodle Site Name',
  'https://your-moodle-domain.com',
  'CLIENT_ID_FROM_MOODLE',
  'DEPLOYMENT_ID_FROM_MOODLE',
  'https://your-moodle-domain.com/mod/lti/auth.php',
  'https://your-moodle-domain.com/mod/lti/token.php',
  'https://your-moodle-domain.com/mod/lti/certs.php',
  true
);
```

Replace:
- `Your Moodle Site Name` - friendly name for reference
- `https://your-moodle-domain.com` - your actual Moodle URL
- `CLIENT_ID_FROM_MOODLE` - from Moodle tool config
- `DEPLOYMENT_ID_FROM_MOODLE` - from Moodle tool config

### Step 4: Test Integration

1. **Add Activity to Course**
   - Go to any Moodle course
   - Turn editing on
   - Click "Add an activity or resource"
   - Select "External tool"
   - Choose "Soft Skills Leadership Simulation"
   - Configure grading if desired (0-100 points recommended)
   - Save

2. **Test as Student**
   - Enroll a test student in the course
   - Login as student
   - Click the simulation activity
   - Should automatically login (SSO)
   - Complete a simulation scenario
   - Check that grade appears in Moodle gradebook

3. **Test as Instructor**
   - Login as instructor/teacher
   - Launch the activity
   - Should see instructor dashboard
   - Verify student progress is visible
   - Test analytics and reporting features

---

## Key URLs Reference

| Purpose | URL |
|---------|-----|
| Application Home | https://change-solutions-lea-ooxn.bolt.host |
| Login Page | https://change-solutions-lea-ooxn.bolt.host/login |
| LTI Config Helper | https://change-solutions-lea-ooxn.bolt.host/lti/config |
| LTI Launch Endpoint | https://change-solutions-lea-ooxn.bolt.host/lti/launch |
| LTI Login Initiation | https://change-solutions-lea-ooxn.bolt.host/lti/login |
| JWKS Endpoint | https://change-solutions-lea-ooxn.bolt.host/lti/jwks |
| Admin Dashboard | https://change-solutions-lea-ooxn.bolt.host/admin |
| Instructor Dashboard | https://change-solutions-lea-ooxn.bolt.host/instructor |
| Learner Dashboard | https://change-solutions-lea-ooxn.bolt.host/learner |

---

## Create Your First Scenario

Before students can use the simulation, you need to create scenarios:

### 1. Login as Admin

- Go to: https://change-solutions-lea-ooxn.bolt.host/login
- Create an account (first user gets admin role automatically)
- Or login with existing admin credentials

### 2. Access Scenario Manager

- Navigate to: Admin Dashboard → Scenarios
- Or go directly to: https://change-solutions-lea-ooxn.bolt.host/admin/scenarios

### 3. Create a Simulation

1. Click "Create New Simulation"
2. Fill in:
   - **Title**: e.g., "Team Meeting Challenge"
   - **Description**: Brief overview
   - **Category**: Choose from predefined categories
   - **Difficulty**: Beginner, Intermediate, or Advanced
   - **Estimated Time**: e.g., "15 minutes"

3. Add Introduction:
   - Write context for the scenario
   - Optionally add introduction video URL
   - Set learning objectives

4. Create Scenarios:
   - **Question Text**: The situation or question
   - **Response Options**: 3-5 choices (A, B, C, D, E)
   - **Feedback**: For each option
   - **Metric Scores**: Impact on Bravin dimensions
   - **Competency Impact**: Skills affected by each choice
   - **Next Scenario**: Link to next question or mark as ending

5. Add Closing Content:
   - Summary message for different performance tiers
   - Optional closing videos

6. Publish:
   - Toggle "Published" to make available to learners
   - Test the simulation from learner view

---

## Adding Videos (Optional)

### Video Library Management

1. Go to: Admin → Video Library
2. Upload videos or add YouTube/Vimeo URLs
3. Tag videos for easy searching
4. Reference videos in scenarios by selecting from library

### Supported Video Types

- **YouTube**: Paste video URL (automatically embedded)
- **Vimeo**: Paste video URL (automatically embedded)
- **Direct Upload**: Upload MP4 files to Supabase storage
- **Synthesia**: Paste Synthesia share links

### Video Locations

You can add videos to:
- Simulation introduction
- Individual scenario questions
- Response option feedback
- Transition between scenarios
- Performance-based closing (different videos for high/medium/low scores)

---

## User Roles & Access

### Admin
- Full system access
- Create and manage simulations
- View all analytics
- Manage users and settings
- Configure branding

### Instructor/Teacher
- View assigned cohort performance
- Access analytics and reports
- Export student data
- Cannot modify scenarios

### Learner
- Access assigned simulations
- Complete scenarios
- View personal progress
- Cannot see other learners' data

---

## Monitoring & Analytics

### Real-Time Dashboards

**Instructor Dashboard**:
- Student completion rates
- Average scores by competency
- Time on task
- Learning path visualization
- Export to CSV

**Admin Dashboard**:
- Platform-wide usage statistics
- Popular scenarios
- Completion rates by difficulty
- User engagement metrics

### Database Queries

Access Supabase SQL Editor for custom queries:

**Active Sessions**:
```sql
SELECT COUNT(*) FROM simulation_instances WHERE status = 'in_progress';
```

**Completion Rate by Simulation**:
```sql
SELECT
  s.title,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE si.status = 'completed') as completed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE si.status = 'completed') / COUNT(*), 1) as completion_rate
FROM simulation_instances si
JOIN simulations s ON si.simulation_id = s.id
GROUP BY s.title
ORDER BY completion_rate DESC;
```

**Average Scores**:
```sql
SELECT
  AVG(final_score) as avg_score,
  AVG(competency_score) as avg_competency
FROM simulation_instances
WHERE status = 'completed';
```

---

## Security & Best Practices

### Important Security Notes

1. **Never commit .env file** - Already properly gitignored
2. **Rotate API keys if exposed** - See CRITICAL_DEPLOYMENT_STEPS.md
3. **Review RLS policies** - All tables have Row Level Security enabled
4. **Monitor failed logins** - Rate limiting is active (5 attempts)
5. **HTTPS required** - Bolt provides this automatically

### Recommended Settings

1. **Supabase Dashboard**:
   - Enable connection pooling
   - Set up database backups
   - Monitor query performance

2. **Regular Maintenance**:
   - Weekly: Review failed grade submissions
   - Monthly: Check storage usage
   - Quarterly: Audit user access

---

## Troubleshooting

### Issue: LTI Launch Fails

**Symptoms**: Error when launching from Moodle

**Solutions**:
1. Verify Moodle platform is registered in `lti_deployments` table
2. Check that all URLs in Moodle config match exactly (including https://)
3. Ensure deployment is active: `is_active = true`
4. Check browser console for JWT errors
5. Verify JWKS URL is accessible: visit /lti/jwks endpoint

### Issue: Students Can't See Scenarios

**Symptoms**: Empty scenario list or "no scenarios available"

**Solutions**:
1. Verify scenarios are published (`is_published = true`)
2. Check RLS policies allow student access
3. Confirm scenarios are assigned to correct category/difficulty
4. Check browser console for errors

### Issue: Grades Not Syncing to Moodle

**Symptoms**: Completed simulations but no grade in Moodle

**Solutions**:
1. Verify "Accept grades from tool" is enabled in Moodle
2. Check `grade_submissions` table for errors:
   ```sql
   SELECT * FROM grade_submissions WHERE success = false ORDER BY submitted_at DESC;
   ```
3. Ensure activity has grade item configured in Moodle
4. Check that simulation has valid scoring configuration

### Issue: Videos Not Playing

**Symptoms**: Video player shows error or doesn't load

**Solutions**:
1. Verify video URLs are publicly accessible
2. Check video format is supported (MP4, YouTube, Vimeo)
3. Test video URL directly in browser
4. Check browser console for CORS errors
5. Ensure Supabase storage bucket is public for video files

---

## Performance Optimization

### Current Performance
- **Build size**: 2.13 MB (492 KB gzipped)
- **Initial load**: Fast (Vite optimized)
- **Database**: Indexed and optimized
- **CDN**: Bolt provides automatic CDN

### If You Need Better Performance

Consider these optimizations:

1. **Code Splitting**:
   - Split large components with React.lazy()
   - Load admin components only when needed

2. **Image Optimization**:
   - Use WebP format for images
   - Implement lazy loading for images

3. **Database**:
   - Already indexed
   - Consider adding more specific indexes if queries are slow

4. **Caching**:
   - Browser caches static assets automatically
   - Consider implementing service worker for offline support

---

## Support Resources

### Documentation Files
- `DEPLOYMENT_CHECKLIST.md` - Detailed deployment guide
- `MOODLE_SETUP.md` - Moodle-specific instructions
- `COMPLETE_SIMULATION_FLOW_GUIDE.md` - How scenarios work
- `SCENARIO_CREATION_GUIDE.md` - Creating scenarios
- `BRAVIN_METRICS_INTEGRATION_SUMMARY.md` - Assessment system
- `CRITICAL_DEPLOYMENT_STEPS.md` - Security considerations

### Database Schema
- Review migration files in `supabase/migrations/`
- 62 migrations document all database changes
- Each migration has detailed comments

---

## Success Checklist

Before going live with students, verify:

- [ ] Application loads at your Bolt URL
- [ ] Login/authentication works
- [ ] At least one scenario is created and published
- [ ] LTI configuration matches in Moodle
- [ ] Moodle platform registered in Supabase
- [ ] Test launch from Moodle succeeds
- [ ] Student can complete full simulation
- [ ] Grade syncs to Moodle gradebook
- [ ] Instructor dashboard shows data
- [ ] Videos play correctly (if using videos)
- [ ] Mobile view works properly
- [ ] No console errors on key pages

---

## Next Actions

### Immediate (Do Now)
1. Visit your deployed site: https://change-solutions-lea-ooxn.bolt.host
2. Login and verify admin access works
3. Visit /lti/config page and bookmark it

### Within 1 Hour
1. Configure Moodle LTI tool with values from /lti/config
2. Register Moodle platform in Supabase database
3. Create your first test scenario

### Within 1 Day
1. Test full student flow from Moodle
2. Verify grade passback works
3. Create additional scenarios for your course
4. Test instructor dashboard

### Within 1 Week
1. Add videos to scenarios (optional)
2. Customize branding (optional)
3. Train instructors on the platform
4. Pilot with small group of students
5. Gather feedback and iterate

---

## Questions?

Your application is fully built and ready. The main task remaining is configuration, not development.

**Remember**: Everything is in one place now - your code is on Bolt, your database is on Supabase, and they're connected. You don't need to set up any additional hosting or infrastructure.

**Your deployment is COMPLETE and LIVE!**

Just visit: https://change-solutions-lea-ooxn.bolt.host
