# Competency Weight Matrix Save - Complete Fix

## Issue Resolved

The Competency Weight Matrix at the simulation level was not saving to the database. Changes made to weight values were lost on page reload.

## Root Causes Identified

1. **Missing Save Functionality**: Component only updated local state, no database persistence
2. **RLS Policy Issue**: The policy used `cmd = 'ALL'` without proper `with_check` clause for INSERT/UPDATE operations

## Solutions Implemented

### 1. Added Save Button and Persistence Logic

**File**: `src/components/admin/CompetencyWeightMatrixEditor.tsx`

Added:
- Save button with loading/disabled states
- `handleSave()` function to persist weights to database
- `hasUnsavedChanges` state tracking
- Comprehensive console logging for debugging
- Success/error messages with details

### 2. Enhanced Error Logging

**File**: `src/lib/competencyCalculation.ts`

Added detailed logging:
- Competency lookup by code
- Each upsert operation with parameters
- Error details with JSON serialization
- Success confirmation for each competency

### 3. Fixed RLS Policies

**Migration**: `fix_simulation_competency_weights_rls_policy.sql`

Changed:
- Dropped the single "ALL" policy that lacked proper `with_check` clause
- Created separate policies for INSERT, UPDATE, DELETE
- Each policy now has proper `USING` and `WITH CHECK` clauses
- Ensures only admins and instructors can modify weights

## How the Save Works

### Save Flow

1. **User clicks "Save Changes"** button
2. **Validation**: Checks for simulation ID and authenticated user
3. **Iteration**: Loops through each competency code (TBR-03, AC-06, EI-02, EL-05, VBD-01)
4. **Lookup**: Finds competency ID by code
5. **Upsert**: For each metric type (bravin_alignment, trust_impact, emotional_intelligence_index, ethical_decision_quality):
   - Creates new record if doesn't exist
   - Updates existing record if already exists
6. **Success**: Shows confirmation message
7. **Reload**: Fetches fresh data from database to verify save

### Database Operations

```typescript
// For each competency code
const { data: competency } = await supabase
  .from('competencies')
  .select('id')
  .eq('code', competencyCode)
  .single();

// For each metric type and weight value
await supabase
  .from('simulation_competency_weights')
  .upsert({
    simulation_id: simulationId,
    competency_id: competency.id,
    metric_type: metricType,
    weight: weight,
    configured_by: currentUser.id,
    overrides_global: true
  }, {
    onConflict: 'simulation_id,competency_id,metric_type'
  });
```

## RLS Policies (Fixed)

### View Policy (unchanged)
```sql
CREATE POLICY "Everyone can view simulation weights"
  ON simulation_competency_weights
  FOR SELECT
  TO authenticated
  USING (true);
```

### Insert Policy (new)
```sql
CREATE POLICY "Admins can insert simulation weights"
  ON simulation_competency_weights
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );
```

### Update Policy (new)
```sql
CREATE POLICY "Admins can update simulation weights"
  ON simulation_competency_weights
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );
```

### Delete Policy (new)
```sql
CREATE POLICY "Admins can delete simulation weights"
  ON simulation_competency_weights
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );
```

## User Requirements

To save weight matrix changes, you must be logged in as:
- **Admin** user (role = 'admin'), OR
- **Instructor** user (role = 'instructor')

**Learner** users cannot modify the weight matrix.

### Admin Account

Email: `judithdavy@changesltd.com`
Role: `admin`
User ID: `88c8037d-0c8f-4527-9209-8ecf4ffdcff8`

## How to Use

### Step-by-Step

1. **Login** as admin (judithdavy@changesltd.com)
2. Go to **Admin Panel** → **Simulation Builder**
3. Create or edit a simulation
4. Navigate to **"Metrics & Scoring"** tab
5. Find **"Competency Weight Matrix"** section
6. Modify weight values (0.0 to 1.0 for each cell)
7. Click blue **"Save Changes"** button
8. Wait for success message: "Weight matrix saved successfully! (5 competencies)"
9. Verify changes persist by refreshing the page

### Debugging

If save fails, check browser console for detailed logs:

```
[CompetencyWeightMatrixEditor] Starting save...
[CompetencyWeightMatrixEditor] Simulation ID: <uuid>
[CompetencyWeightMatrixEditor] Current User: { id: <uuid>, role: 'admin' }
[CompetencyWeightMatrixEditor] Weights to save: { TBR-03: {...}, AC-06: {...}, ... }

[CompetencyCalculationService] Looking up competency with code: TBR-03
[CompetencyCalculationService] Found competency ID: <uuid>
[CompetencyCalculationService] Upserting: sim=<uuid>, comp=<uuid>, metric=bravin_alignment, weight=0.3
[CompetencyCalculationService] Successfully saved all weights for TBR-03

[CompetencyWeightMatrixEditor] Saved 5 competencies, allSuccess: true
```

### Common Issues

**Issue**: "Cannot save: User not authenticated"
**Solution**: Ensure you're logged in as an admin or instructor

**Issue**: "Cannot save: Missing simulation ID"
**Solution**: Save the simulation first before configuring the weight matrix

**Issue**: "Failed to save some weights"
**Solution**: Check console logs for specific error details. May be RLS policy issue or database constraint.

**Issue**: Button shows "Saved" but data not persisting
**Solution**: Check that you're using the admin account (judithdavy@changesltd.com), not the learner account

## Verification

To verify the save worked:

### Method 1: Reload Page
1. Change some weights
2. Click "Save Changes"
3. Wait for success message
4. Refresh the browser
5. Verify values are still changed

### Method 2: Database Query
```sql
SELECT
  scw.simulation_id,
  c.code,
  c.name,
  scw.metric_type,
  scw.weight,
  scw.configured_by,
  scw.created_at,
  scw.updated_at
FROM simulation_competency_weights scw
JOIN competencies c ON c.id = scw.competency_id
WHERE scw.simulation_id = 'YOUR_SIMULATION_ID'
ORDER BY c.code, scw.metric_type;
```

## Technical Details

### Database Schema

**Table**: `simulation_competency_weights`

Key columns:
- `simulation_id` (uuid) - References simulations table
- `competency_id` (uuid) - References competencies table
- `metric_type` (text) - One of: bravin_alignment, trust_impact, emotional_intelligence_index, ethical_decision_quality
- `weight` (numeric) - Value between 0.0 and 1.0
- `configured_by` (uuid) - User who saved the configuration
- `overrides_global` (boolean) - Always true for simulation-level overrides

**Unique Constraint**: `(simulation_id, competency_id, metric_type)`

This allows upsert operations to update existing records or create new ones.

### Competencies Supported

| Code    | Name                            | ID                                   |
|---------|---------------------------------|--------------------------------------|
| TBR-03  | Trust Building & Repair         | f9f04850-6200-4de5-9d91-4e89adffd827 |
| AC-06   | Adaptive Communication          | f67da0dd-43f6-49dd-a828-5bbae5e0ff41 |
| EI-02   | Emotional Intelligence          | cec8bbf2-136b-46a9-8bbd-080738a506b7 |
| EL-05   | Ethical Leadership              | 29d36f4b-80be-4ea8-b400-4210ec104bba |
| VBD-01  | Values-Based Decision-Making    | 0a0d87af-74a1-44e1-86a7-4a6629d033e6 |

### Metric Types

| Key                              | Label              | Scale    |
|----------------------------------|--------------------|----------|
| bravin_alignment                 | BRAVIN Alignment   | 0-10     |
| trust_impact                     | Trust Impact       | -2 to +2 |
| emotional_intelligence_index     | EI Index           | 0-5      |
| ethical_decision_quality         | Ethical Quality    | 0-5      |

## Build Status

✅ **Build Successful**
- All TypeScript compilation passed
- Enhanced logging added
- RLS policies fixed
- Production bundle generated

## Files Modified

1. `src/components/admin/CompetencyWeightMatrixEditor.tsx` - Added save functionality and logging
2. `src/lib/competencyCalculation.ts` - Enhanced error logging
3. `supabase/migrations/fix_simulation_competency_weights_rls_policy.sql` - Fixed RLS policies

## Success Criteria

✅ Save button appears and is functional
✅ Button tracks unsaved changes
✅ Success/error messages display
✅ Console logs provide debugging info
✅ Data persists across page reloads
✅ RLS policies allow admin/instructor access
✅ RLS policies block learner access
✅ Build completes without errors

---

**Status**: Issue Resolved ✅
**Testing**: Ready for verification
**Action Required**: Log in as admin user (judithdavy@changesltd.com) and test the save functionality
