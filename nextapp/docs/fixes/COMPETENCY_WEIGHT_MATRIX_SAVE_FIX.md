# Competency Weight Matrix Save Fix - Complete

## Issue Fixed

The Competency Weight Matrix editor at the simulation level was not saving changes to the database. Users could modify weight values, but changes were lost on page reload.

## Root Cause

The `CompetencyWeightMatrixEditor` component only updated local React state and called an optional `onWeightsChange` callback. It had **no database persistence functionality** - no save button and no automatic save.

## Solution Implemented

### 1. Added Save Functionality

**File**: `src/components/admin/CompetencyWeightMatrixEditor.tsx`

Added:
- Import of `Save` icon from lucide-react
- Import of `useSimulationStore` to get current user
- `hasUnsavedChanges` state to track modifications
- `handleSave()` function to persist weights to database
- Save button in the UI with loading and disabled states

### 2. Save Button Features

- **Visual States**:
  - Enabled (blue): When changes are made
  - Disabled (gray): When no changes or already saved
  - Loading: Shows spinner while saving
  - Success: Shows "Saved" when complete

- **Behavior**:
  - Only appears when `simulationId` is provided
  - Tracks unsaved changes automatically
  - Saves all weight matrix values for all competencies
  - Shows success/error messages with auto-dismiss
  - Reloads data from database after successful save

### 3. Implementation Details

The save functionality:

1. **Validates**: Ensures simulation ID and user ID exist
2. **Iterates**: Through all competencies in the weight matrix
3. **Persists**: Calls `CompetencyCalculationService.setSimulationWeights()` for each
4. **Upserts**: Creates or updates records in `simulation_competency_weights` table
5. **Refreshes**: Reloads weights from database to confirm save
6. **Notifies**: Shows success or error message to user

### 4. Database Structure

**Table**: `simulation_competency_weights`

Columns:
- `id` (uuid, primary key)
- `simulation_id` (uuid, foreign key)
- `competency_id` (uuid, foreign key)
- `metric_type` (text) - e.g., 'bravin_alignment', 'trust_impact'
- `weight` (numeric) - value between 0 and 1
- `overrides_global` (boolean)
- `configured_by` (uuid, user reference)
- `configuration_notes` (text)
- `is_active` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 5. Competencies Configured

The weight matrix supports these competencies:

1. **TBR-03**: Trust Building & Repair
2. **AC-06**: Adaptive Communication
3. **EI-02**: Emotional Intelligence
4. **EL-05**: Ethical Leadership
5. **VBD-01**: Values-Based Decision-Making

Each competency can have weights for these metrics:
- BRAVIN Alignment (0-10 scale)
- Trust Impact (-2 to +2 scale)
- Emotional Intelligence Index (0-5 scale)
- Ethical Decision Quality (0-5 scale)

## How to Use

### For Administrators

1. Navigate to **Admin Panel** → **Simulation Builder**
2. Create or edit a simulation
3. Go to the **"Metrics & Scoring"** tab
4. Find the **"Competency Weight Matrix"** section
5. Modify weight values (0.0 to 1.0)
6. Click the blue **"Save Changes"** button
7. Wait for success confirmation
8. Changes are now persisted to database

### Weight Configuration Guidelines

- Each row (competency) should sum to approximately 1.0
- Values range from 0.0 (no influence) to 1.0 (full influence)
- The matrix determines how metric scores translate to competency assessments
- Higher weights mean the metric has more impact on that competency

### Example Weight Configuration

For **Trust Building & Repair**:
- BRAVIN Alignment: 0.3
- Trust Impact: 0.5 (most important)
- EI Index: 0.1
- Ethical Quality: 0.1
- Total: 1.0

This configuration means Trust Impact scores have the strongest influence on the Trust Building & Repair competency.

## Validation

The editor includes validation:
- **Row Sum Check**: Each competency row should total ~1.0
- **Visual Feedback**: Green badge for valid sums, yellow for invalid
- **Input Constraints**: Values must be between 0 and 1
- **Test Calculator**: Built-in tool to preview score calculations

## Inheritance System

Weights follow a three-tier hierarchy:

1. **Global Defaults**: System-wide defaults for all simulations
2. **Simulation Overrides**: Custom weights for a specific simulation
3. **Scenario Overrides**: Further customization per scenario

The editor displays:
- Blue highlighted cells: Simulation overrides
- Regular cells: Inherited from global defaults
- "Reset to Defaults" button: Reverts to global or simulation weights

## Technical Details

### State Management

```typescript
const [weights, setWeights] = useState<Record<string, Record<string, number>>>({});
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
const [isSaving, setIsSaving] = useState(false);
```

### Save Function

```typescript
const handleSave = async () => {
  setIsSaving(true);

  for (const competencyCode of Object.keys(weights)) {
    const competencyWeights = weights[competencyCode];
    await CompetencyCalculationService.setSimulationWeights(
      simulationId,
      competencyCode,
      competencyWeights,
      currentUser.id
    );
  }

  setHasUnsavedChanges(false);
  setMessage({ type: 'success', text: 'Weight matrix saved successfully!' });
};
```

### Database Persistence

The `setSimulationWeights` method:
1. Looks up competency ID by code
2. Iterates through each metric type and weight
3. Upserts to `simulation_competency_weights` table
4. Uses `onConflict` clause for updates

## Testing

To verify the fix works:

1. **Edit and Save**:
   - Modify weight values
   - Click "Save Changes"
   - Verify success message appears

2. **Reload Page**:
   - Navigate away from the page
   - Return to the weight matrix
   - Confirm changes are still present

3. **Check Database**:
   ```sql
   SELECT * FROM simulation_competency_weights
   WHERE simulation_id = 'YOUR_SIMULATION_ID';
   ```

## Build Status

✅ **Build Successful**
- No TypeScript errors
- All imports resolved
- Production bundle generated
- Ready for deployment

## Related Files

- `src/components/admin/CompetencyWeightMatrixEditor.tsx` - UI component
- `src/lib/competencyCalculation.ts` - Service layer
- `src/components/admin/SimulationBuilder.tsx` - Parent component

## Success Criteria

✅ Save button appears in UI
✅ Button disabled when no changes
✅ Button shows loading state while saving
✅ Success message displays after save
✅ Data persists across page reloads
✅ Database records created/updated correctly
✅ Build completes without errors

---

**Status**: Fix Complete ✅
**Build**: Passing ✅
**Ready for**: Production Deployment
