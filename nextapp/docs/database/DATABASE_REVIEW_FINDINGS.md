# DATABASE vs FRONTEND DATA REVIEW - FINDINGS

## CRITICAL ISSUE IDENTIFIED

### Your database is EMPTY but application may appear to work

**Current State:**
- Database Tables: ALL EMPTY (0 rows in critical tables)
- Application Status: May show data from hardcoded fallback files

---

## DETAILED FINDINGS

### 1. HARDCODED DATA IN FRONTEND (FALLBACK MODE)

**Location: `src/data/scenarios.ts` and `src/data/topics.ts`**

These files contain hardcoded arrays that are used as FALLBACK data when the database is empty:

```typescript
// src/data/topics.ts - Line 4
export const TOPICS: SoftSkillTopic[] = [
  { id: 'communication', title: 'Effective Communication', ... },
  { id: 'teamwork', title: 'Teamwork & Collaboration', ... },
  // ... 7 hardcoded topics
];

// src/data/scenarios.ts - Line 4
export const SCENARIOS: Scenario[] = [
  { id: 'comm-beg-1', title: 'Team Meeting Participation', ... },
  // ... many hardcoded scenarios
];
```

**Usage in Store (`src/store/index.ts`):**

```typescript
// Line 114 - Uses hardcoded SCENARIOS as initial state
scenarios: SCENARIOS,

// Line 251 - Uses hardcoded TOPICS
const topic = TOPICS.find(t => t.id === topicId);

// Line 265 - Uses hardcoded SCENARIOS
const firstScenario = SCENARIOS.find(
  s => s.topicId === selectedTopic.id && s.difficulty === selectedDifficulty
);

// Line 341 - Returns hardcoded TOPICS
getTopics: () => TOPICS,

// Line 343 - Returns from hardcoded SCENARIOS
getScenarioById: (id) => SCENARIOS.find(s => s.id === id),

// Line 390 - Fallback to hardcoded when database load fails
set({ scenarios: SCENARIOS });
```

---

### 2. DATABASE TABLES STATUS

All critical tables are EMPTY:

| Table | Rows | Status | Critical? |
|-------|------|--------|-----------|
| topics | 0 | ❌ EMPTY | YES |
| simulations | 0 | ❌ EMPTY | YES |
| scenarios | 0 | ❌ EMPTY | YES |
| scenario_options | 0 | ❌ EMPTY | YES |
| simulation_scenarios | 0 | ❌ EMPTY | YES |
| profiles | 0 | ❌ EMPTY | YES |
| competencies | ? | ❓ UNKNOWN | YES |
| assessment_metrics | ? | ❓ UNKNOWN | YES |
| simulation_categories | ? | ❓ UNKNOWN | YES |

---

### 3. DATA FLOW ANALYSIS

#### Current Behavior:

```
User opens app
   ↓
Store initializes with: scenarios: SCENARIOS (hardcoded)
   ↓
getTopics() called → Returns TOPICS (hardcoded)
   ↓
User selects topic → Uses TOPICS.find() (hardcoded)
   ↓
User starts simulation → Uses SCENARIOS.find() (hardcoded)
   ↓
NO DATABASE INTERACTION OCCURS!
```

#### Expected Behavior:

```
User opens app
   ↓
Store calls loadScenarios()
   ↓
Fetches from supabase.from('scenarios').select('*')
   ↓
Fetches from supabase.from('scenario_options').select('*')
   ↓
Sets frontend state with DATABASE data
   ↓
User works with REAL database data
   ↓
Changes saved to DATABASE
```

---

### 4. PROBLEM AREAS

#### A. Topics Loading (src/store/index.ts - Line 341)

```typescript
getTopics: () => TOPICS,  // ❌ ALWAYS returns hardcoded data
```

**Should be:**
```typescript
getTopics: async () => {
  const { data } = await supabase.from('topics').select('*');
  return data || TOPICS; // Use TOPICS as fallback only
}
```

#### B. Scenario Selection (src/store/index.ts - Line 265)

```typescript
const firstScenario = SCENARIOS.find(  // ❌ Uses hardcoded
  s => s.topicId === selectedTopic.id && s.difficulty === selectedDifficulty
);
```

**Should fetch from database scenarios, not hardcoded array.**

#### C. Store Initialization (src/store/index.ts - Line 114)

```typescript
scenarios: SCENARIOS,  // ❌ Initializes with hardcoded
```

**Should initialize empty and load from database immediately.**

---

### 5. COMPONENTS THAT MAY SHOW WRONG DATA

These components use `getTopics()` which returns hardcoded data:

1. **LearnerDashboard** (src/components/learner/LearnerDashboard.tsx:25)
2. **AssignmentManager** (src/components/teacher/AssignmentManager.tsx:10)
3. **Dashboard** (src/components/dashboard/Dashboard.tsx:11)

These components may appear to work but are NOT using database data!

---

### 6. WHY THIS IS A PROBLEM

1. **Data Loss Risk**: Any admin changes made in UI won't be reflected because hardcoded data is used
2. **Multi-User Issues**: Different users will see same hardcoded data instead of shared database
3. **No Persistence**: Simulations created won't be saved or loaded correctly
4. **Development vs Production**: Works in dev with hardcoded data, fails in production
5. **Misleading**: App appears to work but data isn't actually saved

---

## RECOMMENDATIONS

### Priority 1: SEED DATABASE (URGENT)

The migration files exist but database is empty. Run:

```bash
# Check if migrations have been applied
ls -la supabase/migrations/

# The initial migration should have seeded topics
# File: 20251022141416_create_lti_moodle_simulation_schema.sql
# Lines 604-613 contain INSERT for topics
```

**Action Required:**
1. Verify migrations have been applied to your database
2. Check Supabase dashboard to confirm tables exist
3. Manually insert topics if needed

### Priority 2: FIX TOPICS LOADING

**File: `src/store/index.ts`**

Replace hardcoded TOPICS usage with database queries.

### Priority 3: REMOVE HARDCODED SCENARIOS

The SCENARIOS array in `src/data/scenarios.ts` should ONLY be used for:
- Initial development/testing
- Fallback when database is unreachable
- Migration/seeding scripts

NOT for production data flow!

### Priority 4: ADD DATABASE HEALTH CHECK

Add startup check to warn when database is empty:

```typescript
async function checkDatabaseHealth() {
  const { count } = await supabase
    .from('topics')
    .select('*', { count: 'exact', head: true });
  
  if (count === 0) {
    console.error('⚠️ WARNING: Database is empty! Run migrations first.');
  }
}
```

---

## NEXT STEPS

1. **Verify database connectivity** - Check .env file
2. **Run/verify migrations** - Ensure tables are seeded
3. **Create admin user** - Use existing script
4. **Create test simulation** - Via admin UI
5. **Verify data persists** - Refresh page and check if data survives
6. **Fix hardcoded data usage** - Refactor store methods

---

## QUESTIONS TO ANSWER

1. ❓ Has the database been migrated? (Check Supabase dashboard)
2. ❓ Is Supabase configured? (Check .env file)
3. ❓ Do you want to keep hardcoded data as fallback? (Yes for offline mode)
4. ❓ Should we seed the database now? (Recommended)
5. ❓ Are you working with test data or production data?

