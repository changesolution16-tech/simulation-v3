# Moodle LTI Integration Setup Guide

## Overview

This application is a **standalone web application** that integrates with Moodle via **LTI 1.3** (Learning Tools Interoperability). This means you can deploy it anywhere and add it to Moodle as an External Tool activity.

## Key Features

- **LTI 1.3 Authentication** - Seamless single sign-on from Moodle
- **Grade Passback** - Automatic grade sync to Moodle gradebook
- **Synthesia Video Integration** - AI narrator-driven scenarios with video feedback
- **Unlimited Branching Scenarios** - Create complex decision trees
- **Comprehensive Analytics** - Track learner progress and skill development
- **Instructor Dashboard** - Monitor course-wide performance
- **Mobile Responsive** - Works on any device

---

## Deployment Options

### Option 1: Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables (see below)
   - Deploy!

3. **Environment Variables in Vercel**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Option 2: Deploy to Netlify

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Netlify:
   - Drag the `dist` folder to [app.netlify.com/drop](https://app.netlify.com/drop)
   - Or use Netlify CLI

### Option 3: Self-Host

1. Build:
   ```bash
   npm run build
   ```

2. Serve the `dist` folder with any web server (Apache, Nginx, etc.)

---

## Moodle Integration Steps

### Step 1: Configure LTI Tool in Moodle

1. **Go to Moodle Administration**
   - Navigate to: **Site administration → Plugins → Activity modules → External tool → Manage tools**

2. **Click "Configure a tool manually"**

3. **Fill in the configuration:**

   | Field | Value |
   |-------|-------|
   | **Tool name** | Soft Skills Leadership Simulation |
   | **Tool URL** | `https://your-deployment-url.com/lti/launch` |
   | **LTI version** | LTI 1.3 |
   | **Public key type** | Keyset URL |
   | **Public keyset URL** | `https://your-deployment-url.com/lti/jwks` |
   | **Initiate login URL** | `https://your-deployment-url.com/lti/login` |
   | **Redirection URI(s)** | `https://your-deployment-url.com/lti/launch` |

4. **Enable Services:**
   - ☑ IMS LTI Assignment and Grade Services
   - ☑ IMS LTI Names and Role Provisioning Services
   - ☑ Deep Linking

5. **Privacy Settings:**
   - ☑ Share launcher's name with tool
   - ☑ Share launcher's email with tool
   - ☑ Accept grades from the tool

6. **Click "Save changes"**

### Step 2: Add to Course

1. Go to any Moodle course
2. Turn editing on
3. Click "Add an activity or resource"
4. Select "External tool"
5. Choose "Soft Skills Leadership Simulation" from the preconfigured tools
6. Set up grading if needed
7. Save and display

### Step 3: Register Moodle Platform in Database

After the first LTI launch, you need to register the Moodle platform in Supabase:

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
  'My Moodle Site',
  'https://your-moodle-site.com',
  'CLIENT_ID_FROM_MOODLE',
  'DEPLOYMENT_ID_FROM_MOODLE',
  'https://your-moodle-site.com/mod/lti/auth.php',
  'https://your-moodle-site.com/mod/lti/token.php',
  'https://your-moodle-site.com/mod/lti/certs.php',
  true
);
```

> **Note:** You can find these values in Moodle after creating the tool configuration.

---

## Quick Setup Script

For easy configuration, visit:
```
https://your-deployment-url.com/lti/config
```

This page provides:
- Copy-paste configuration values
- Downloadable JSON config
- Step-by-step setup guide

---

## Testing the Integration

### Test LTI Launch

1. In Moodle, add the External Tool to a course
2. Click the activity
3. You should be automatically logged in to the simulation
4. Complete a scenario
5. Check Moodle gradebook - grade should appear automatically

### Test Instructor Dashboard

1. Log in to Moodle as an instructor
2. Launch the simulation activity
3. Navigate to the Instructor Dashboard
4. You should see all learner progress in your course

---

## Database Schema

The database automatically creates these tables on first migration:

### Core Tables
- `profiles` - User accounts
- `lti_deployments` - Moodle platform registrations
- `lti_contexts` - Course mappings
- `lti_resource_links` - Activity instances
- `lti_user_mappings` - User identity mapping

### Content Tables
- `topics` - Soft skill categories
- `scenarios` - Branching scenario nodes
- `scenario_options` - Response choices
- `scenario_videos` - Synthesia video links

### Analytics Tables
- `simulation_instances` - Learner sessions
- `learner_attempts` - Complete attempts with scores
- `learner_responses` - Individual responses
- `skill_tracking` - Skill progression
- `learning_recommendations` - Personalized suggestions
- `grade_submissions` - Grade sync log
- `engagement_metrics` - Time-on-task analytics
- `cohort_analytics` - Class-level insights

---

## Adding Scenarios

### Via Admin Interface

1. Log in as admin
2. Go to `/admin/scenarios`
3. Click "Add Scenario"
4. Fill in:
   - Title and description
   - Difficulty level
   - 4 response options
   - Feedback for each difficulty
   - Skill impacts (positive or negative values)
   - Next scenario ID for branching

### Via Database

```sql
INSERT INTO scenarios (
  topic_id,
  title,
  description,
  difficulty,
  level_number,
  is_end_scenario,
  is_published
) VALUES (
  (SELECT id FROM topics WHERE slug = 'communication'),
  'Team Meeting Participation',
  'You are in a team meeting and have an idea...',
  'beginner',
  1,
  false,
  true
) RETURNING id;
```

---

## Adding Synthesia Videos

### Upload Video URLs

1. Create video in Synthesia
2. Get shareable link or embed code
3. Go to `/admin/videos`
4. Add video:
   - Select scenario
   - Choose type (prompt/feedback)
   - Paste Synthesia URL
   - Save

### Video Types

- **prompt** - Plays at start of scenario
- **feedback** - Plays after response selection
- **introduction** - Course welcome video
- **conclusion** - Course summary video

---

## Troubleshooting

### LTI Launch Fails

1. Check browser console for errors
2. Verify Moodle platform is registered in `lti_deployments` table
3. Ensure redirect URIs match exactly (including https://)
4. Check Supabase connection

### Grades Not Syncing

1. Verify "Accept grades from tool" is enabled in Moodle
2. Check `grade_submissions` table for error messages
3. Ensure LTI Assignment and Grade Services is enabled
4. Verify resource_link_id exists in database

### Videos Not Playing

1. Ensure video URL is publicly accessible
2. For Synthesia, use embed or shareable links
3. Check browser console for CORS errors
4. Try direct video URL instead of embed code

---

## API Endpoints

### LTI Endpoints (automatically handled)

- `POST /lti/login` - LTI 1.3 login initiation
- `POST /lti/launch` - LTI 1.3 launch endpoint
- `GET /lti/jwks` - Public key endpoint
- `GET /lti/config` - Configuration helper page

### Application Routes

- `/` - Home/Login
- `/dashboard` - Learner dashboard
- `/simulation` - Start simulation
- `/simulation/scenario` - Active scenario
- `/simulation/results` - Performance summary
- `/admin/scenarios` - Scenario management
- `/admin/videos` - Video management
- `/instructor` - Instructor analytics dashboard

---

## Security Best Practices

1. **Always use HTTPS** in production
2. **Keep Supabase keys secure** - Never commit to Git
3. **Enable RLS** - All tables have Row Level Security policies
4. **Validate LTI tokens** - Authentication happens on every launch
5. **Use environment variables** - For all sensitive configuration

---

## Support & Documentation

- **Moodle LTI Documentation**: https://docs.moodle.org/en/LTI_External_tools
- **LTI 1.3 Specification**: https://www.imsglobal.org/spec/lti/v1p3/
- **Supabase Documentation**: https://supabase.com/docs
- **Synthesia API**: https://www.synthesia.io/integrations

---

## License

This project is open source and available for educational use.
