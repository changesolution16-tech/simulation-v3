# Session 3: Component Migration Plan

## Overview
This document tracks the complete migration of components from the Vite+React+Supabase app to Next.js 14 with AWS RDS.

## Prerequisites Completed
- ✅ Database migrated to AWS RDS
- ✅ Database seeded with production data
- ✅ Schema validated (80+ tables confirmed)
- ✅ Next.js infrastructure in place
- ✅ NextAuth.js configured
- ✅ AWS S3 integration ready

## Migration Strategy

### Phase 1: Foundation (2-3 hours)
**Goal**: Set up core types and utilities

1. **Type Definitions** ⏳ IN PROGRESS
   - Copy `/src/types/index.ts` to Next.js app
   - Adapt for Next.js patterns
   - Add NextAuth session types

2. **Utility Libraries**
   - Copy core utilities (formatting, analytics, etc.)
   - Adapt Supabase client to use API routes
   - Set up error handling

3. **Context Providers**
   - Language context
   - Theme context
   - Branding context
   - Dialog context

### Phase 2: Authentication (2 hours)
**Goal**: Working login and session management

4. **Auth Components**
   - Login page (with branding)
   - Reset password
   - Session persistence

5. **Auth API Routes**
   - NextAuth configuration (already done)
   - Password reset endpoint
   - Session refresh endpoint

### Phase 3: Core Components (3-4 hours)
**Goal**: Shared UI components and layouts

6. **Layout Components**
   - Main layout
   - Admin layout
   - Error boundary
   - Network status indicator

7. **UI Components**
   - Dialog system
   - Toast notifications
   - Skeleton loaders
   - Language switcher

### Phase 4: Dashboard (3-4 hours)
**Goal**: Role-based dashboards working

8. **Learner Dashboard**
   - Dashboard component
   - Skills progress widget
   - Recent activity
   - Category browser
   - BRAVIN profile widget

9. **Teacher Dashboard**
   - Assignment manager
   - Cohort manager
   - Analytics views

10. **Admin Dashboard**
    - User manager
    - Simulation builder
    - Competency manager
    - Metrics manager

### Phase 5: Simulation Player (4-5 hours)
**Goal**: Complete simulation playback

11. **Simulation Core**
    - Simulation player
    - Scenario flow engine
    - Landing page
    - Introduction page

12. **Question & Feedback**
    - Question page
    - Decision timer
    - Feedback page
    - Transition page

13. **Results**
    - Results page
    - Competency feedback
    - BRAVIN feedback
    - Metrics summary

### Phase 6: Admin Panel (4-5 hours)
**Goal**: Full content management

14. **Scenario Management**
    - Scenario manager
    - Scenario edit modal
    - Scenario flow builder
    - Scenario preview

15. **Simulation Management**
    - Simulation builder
    - Simulation list view
    - Simulation preview modal

16. **Content Management**
    - Video library
    - Video manager
    - Category manager
    - Branding settings

### Phase 7: API Routes (5-6 hours)
**Goal**: Replace all Supabase calls

17. **Simulation APIs**
    - GET /api/simulations
    - GET /api/simulations/[id]
    - POST /api/simulations
    - PUT /api/simulations/[id]

18. **Scenario APIs**
    - GET /api/scenarios
    - GET /api/scenarios/[id]
    - POST /api/scenarios
    - PUT /api/scenarios/[id]
    - POST /api/scenarios/[id]/responses

19. **User & Assignment APIs**
    - GET /api/users
    - POST /api/assignments
    - GET /api/assignments/[id]/learners

20. **Competency APIs**
    - GET /api/competencies
    - POST /api/competencies
    - GET /api/learner-competencies

21. **Video APIs**
    - POST /api/videos/upload
    - GET /api/videos/library
    - POST /api/videos/library

### Phase 8: Testing & Optimization (3-4 hours)
**Goal**: Production-ready application

22. **Functional Testing**
    - Auth flow
    - Simulation playback
    - Admin operations
    - Assignment workflow

23. **Performance Testing**
    - Page load times
    - Database query optimization
    - API response times

24. **Build & Deploy**
    - Production build
    - Environment validation
    - Deployment verification

## Database Schema Validation Results

### ✅ Core Tables Confirmed (Sample)
```
- profiles (user accounts with roles)
- scenarios (simulation scenarios)
- scenario_options (branching choices)
- simulations (simulation templates)
- simulation_instances (learner sessions)
- learner_responses (decision tracking)
- competencies (skill framework)
- learner_competencies (progress tracking)
- assessment_metrics (BRAVIN metrics)
- video_library (video management)
- training_assignments (teacher assignments)
- cohorts (learner groups)
```

### Key Features Available
- ✅ Multi-language support (en, es)
- ✅ LTI 1.3 integration
- ✅ BRAVIN metrics
- ✅ Video library with multiple sources
- ✅ Hierarchy levels for scenarios
- ✅ Timer configuration
- ✅ Multi-attempt tracking
- ✅ Competency weight matrix
- ✅ Real-time metrics tracking

## Component Migration Checklist

### Types & Utilities
- [ ] `/src/types/index.ts` → `/nextjs-app/src/types/index.ts`
- [ ] `/src/lib/formatting.ts`
- [ ] `/src/lib/analytics.ts`
- [ ] `/src/lib/errorHandling.ts`

### Contexts
- [ ] `/src/contexts/LanguageContext.tsx`
- [ ] `/src/contexts/ThemeContext.tsx`
- [ ] `/src/contexts/BrandingContext.tsx`
- [ ] `/src/contexts/DialogContext.tsx`

### Auth Components
- [ ] `/src/components/auth/Login.tsx`
- [ ] `/src/components/auth/ResetPassword.tsx`

### Core Components
- [ ] `/src/components/Layout.tsx`
- [ ] `/src/components/ErrorBoundary.tsx`
- [ ] `/src/components/LanguageSwitcher.tsx`
- [ ] `/src/components/NetworkStatusIndicator.tsx`
- [ ] `/src/components/ui/*`

### Dashboard Components
- [ ] `/src/components/learner/LearnerDashboard.tsx`
- [ ] `/src/components/teacher/TeacherDashboard.tsx`
- [ ] `/src/components/admin/AdminDashboard.tsx`
- [ ] All sub-components for each dashboard

### Simulation Components
- [ ] `/src/components/simulation/SimulationPlayer.tsx`
- [ ] `/src/components/simulation/ScenarioFlowEngine.tsx`
- [ ] `/src/components/simulation/QuestionPage.tsx`
- [ ] `/src/components/simulation/FeedbackPage.tsx`
- [ ] `/src/components/simulation/Results.tsx`
- [ ] All related simulation components

### Admin Components
- [ ] `/src/components/admin/ScenarioManager.tsx`
- [ ] `/src/components/admin/SimulationBuilder.tsx`
- [ ] `/src/components/admin/UserManager.tsx`
- [ ] All admin panel components

### Video Components
- [ ] `/src/components/video/*`

## API Route Structure

```
nextjs-app/src/app/api/
├── auth/
│   └── [...nextauth]/route.ts ✅
├── simulations/
│   ├── route.ts (GET, POST)
│   └── [id]/
│       ├── route.ts (GET, PUT, DELETE)
│       └── instances/route.ts
├── scenarios/
│   ├── route.ts (GET, POST)
│   └── [id]/
│       ├── route.ts (GET, PUT, DELETE)
│       └── responses/route.ts
├── users/
│   ├── route.ts (GET, POST)
│   └── [id]/route.ts
├── assignments/
│   ├── route.ts (GET, POST)
│   └── [id]/
│       ├── route.ts (GET, PUT)
│       └── learners/route.ts
├── competencies/
│   ├── route.ts (GET, POST)
│   └── [id]/route.ts
├── metrics/
│   └── route.ts
└── videos/
    ├── upload/route.ts
    └── library/route.ts
```

## Code Patterns

### Before (Supabase Client-Side)
```typescript
const { data, error } = await supabase
  .from('simulations')
  .select('*')
  .eq('id', id)
  .single();
```

### After (Next.js API Route)
```typescript
// In API route
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const simulations = await sql`SELECT * FROM simulations WHERE id = ${id}`;
  return Response.json(simulations[0]);
}

// In component
const res = await fetch(`/api/simulations/${id}`);
const simulation = await res.json();
```

## Environment Variables Required

### Development (.env.local)
```env
# Database
DATABASE_URL=postgresql://postgres:$Sim#159>?@simulation-1.ct8i4ag04imz.us-east-2.rds.amazonaws.com:5432/simulation_db

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl>

# AWS S3
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_S3_BUCKET_NAME=soft-skills-videos
AWS_S3_PUBLIC_URL=https://soft-skills-videos.s3.us-east-2.amazonaws.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Progress Tracking

### Current Session Statistics
- **Total Components**: ~60 components
- **Total API Routes**: ~20 routes
- **Estimated Time**: 25-30 hours
- **Complexity**: High (complex state management, video integration)

### Time Breakdown
| Phase | Tasks | Est. Time | Status |
|-------|-------|-----------|--------|
| Phase 1 | Foundation | 2-3 hrs | 🔄 In Progress |
| Phase 2 | Authentication | 2 hrs | ⏳ Pending |
| Phase 3 | Core Components | 3-4 hrs | ⏳ Pending |
| Phase 4 | Dashboard | 3-4 hrs | ⏳ Pending |
| Phase 5 | Simulation Player | 4-5 hrs | ⏳ Pending |
| Phase 6 | Admin Panel | 4-5 hrs | ⏳ Pending |
| Phase 7 | API Routes | 5-6 hrs | ⏳ Pending |
| Phase 8 | Testing | 3-4 hrs | ⏳ Pending |
| **TOTAL** | | **26-35 hrs** | |

## Quality Gates

Before marking each phase complete:
1. ✅ All TypeScript errors resolved
2. ✅ ESLint warnings addressed
3. ✅ No console errors in browser
4. ✅ Manual testing passed
5. ✅ Database queries optimized
6. ✅ Error handling implemented

## Known Challenges

### Challenge 1: Supabase Auth → NextAuth
- **Impact**: All auth calls need updating
- **Solution**: Use NextAuth hooks and session helpers
- **Time**: +2 hours

### Challenge 2: Client-Side DB Queries → API Routes
- **Impact**: Every Supabase query becomes an API call
- **Solution**: Systematic replacement with fetch calls
- **Time**: +5 hours

### Challenge 3: Real-Time Subscriptions
- **Impact**: Supabase subscriptions not available
- **Solution**: Implement polling or WebSocket if needed
- **Time**: +3 hours (if required)

### Challenge 4: File Uploads
- **Impact**: Supabase Storage → AWS S3
- **Solution**: Already implemented in /src/lib/s3.ts
- **Time**: Minimal

### Challenge 5: Row Level Security
- **Impact**: No RLS on AWS RDS
- **Solution**: Implement security checks in API routes
- **Time**: Included in API route development

## Success Criteria

### Minimum Viable Product (MVP)
- [ ] Users can log in
- [ ] Learners can play simulations
- [ ] Teachers can create assignments
- [ ] Admins can manage content
- [ ] Scores are recorded correctly

### Production Ready
- [ ] All features from original app working
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] All API routes protected
- [ ] Performance acceptable (< 2s page loads)
- [ ] Error handling comprehensive
- [ ] Deployed and accessible

## Next Steps After Session 3
1. Performance optimization
2. Monitoring setup (Sentry, etc.)
3. CI/CD pipeline
4. User acceptance testing
5. Production deployment
6. Documentation updates

## Session Reference

When user mentions "session", they're referring to this plan:
- **Session 1-2**: Infrastructure setup (COMPLETE)
- **Session 3**: Component migration (CURRENT)
- **Session 4**: Testing & optimization (FUTURE)
- **Session 5**: Production deployment (FUTURE)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-07
**Status**: Phase 1 In Progress
