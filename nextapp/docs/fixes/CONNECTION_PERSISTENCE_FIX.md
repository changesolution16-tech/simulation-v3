# Connection Persistence Fix - Flow Builder

## Problem Overview

Connections in the scenario flow builder were frequently getting removed or deleted due to several critical issues:

### Root Causes Identified

1. **Aggressive Delete-Then-Insert Pattern**
   - Previous implementation deleted ALL options and re-inserted them on every save
   - This caused a brief moment where connections didn't exist in the database
   - Database triggers fired on DELETE, potentially removing branch records
   - Race conditions between delete/insert operations

2. **State Synchronization Issues**
   - Connections array was maintained separately from nodes state
   - No React dependency tracking to keep connections in sync with node updates
   - Manual state updates could desynchronize UI from database state

3. **Race Conditions**
   - Multiple simultaneous calls to `loadScenarios()` could occur
   - UI updates and database saves could conflict
   - No locking mechanism to prevent concurrent operations

4. **Insufficient Error Recovery**
   - Failed save operations didn't rollback UI state
   - No validation to verify connections were persisted
   - Users weren't aware of save failures

## Solutions Implemented

### 1. Surgical Updates Instead of Delete-All (Lines 250-344)

**Before:**
```typescript
// Delete ALL options
await supabase.from('scenario_options').delete().eq('scenario_id', node.id);

// Insert all options again
await supabase.from('scenario_options').insert(optionsToInsert);
```

**After:**
```typescript
// Fetch existing options
const { data: existingOptions } = await supabase
  .from('scenario_options')
  .select('id')
  .eq('scenario_id', node.id);

// Determine what changed
const existingOptionIds = new Set(existingOptions?.map(o => o.id) || []);
const currentOptionIds = new Set(node.options.map(o => o.id));
const optionsToDelete = Array.from(existingOptionIds).filter(id => !currentOptionIds.has(id));

// Only delete removed options
if (optionsToDelete.length > 0) {
  await supabase.from('scenario_options').delete().in('id', optionsToDelete);
}

// Upsert (update or insert) current options
await supabase.from('scenario_options').upsert(optionsToUpsert);
```

**Benefits:**
- Preserves existing options during updates
- Only removes options that were actually deleted
- Reduces database churn and trigger overhead
- Minimizes window for race conditions

### 2. Derived Connection State with useMemo (Lines 75-90)

**Before:**
```typescript
const [connections, setConnections] = useState<Connection[]>([]);

// Manually rebuild connections
const connectionsData: Connection[] = [];
nodesData.forEach(node => {
  node.options.forEach(option => {
    if (option.nextScenarioId) {
      connectionsData.push({...});
    }
  });
});
setConnections(connectionsData);
```

**After:**
```typescript
const connections = useMemo(() => {
  const connectionsData: Connection[] = [];
  nodes.forEach(node => {
    node.options.forEach(option => {
      if (option.nextScenarioId) {
        connectionsData.push({
          from: node.id,
          to: option.nextScenarioId,
          optionId: option.id,
          fromOption: option
        });
      }
    });
  });
  return connectionsData;
}, [nodes]);
```

**Benefits:**
- Connections automatically update when nodes change
- Single source of truth (nodes state)
- Eliminates state synchronization bugs
- React efficiently recalculates only when nodes change

### 3. Connection Validation and Auto-Recovery (Lines 345-365)

**New Function:**
```typescript
const validateConnectionsPersisted = async (scenarioId: string, options: ScenarioOption[]) => {
  const { data } = await supabase
    .from('scenario_options')
    .select('id, next_scenario_id')
    .eq('scenario_id', scenarioId);

  const persistedConnections = data?.filter(o => o.next_scenario_id).length || 0;
  const expectedConnections = options.filter(o => o.nextScenarioId).length;

  if (persistedConnections !== expectedConnections) {
    console.warn(`Connection mismatch: expected ${expectedConnections}, found ${persistedConnections}`);
    setTimeout(() => loadScenarios(), 500);
  }
};
```

**Benefits:**
- Detects connection persistence failures
- Automatically reloads to sync state if mismatch detected
- Provides visibility into save operation success
- Self-healing mechanism for edge cases

### 4. Race Condition Prevention (Lines 85-92, 51-53)

**Debouncing and Locking:**
```typescript
const [isSaving, setIsSaving] = useState(false);
const lastLoadTimestamp = useRef<number>(0);
const DEBOUNCE_DELAY = 300;

const loadScenarios = async () => {
  const now = Date.now();
  if (now - lastLoadTimestamp.current < DEBOUNCE_DELAY || isSaving) {
    console.log('Skipping load (debounce or saving in progress)');
    return;
  }
  lastLoadTimestamp.current = now;
  // ... load logic
};

const handleSaveScenario = async (node: ScenarioNode) => {
  setIsSaving(true);
  try {
    // ... save logic
  } finally {
    setIsSaving(false);
  }
};
```

**Benefits:**
- Prevents rapid successive loads that could conflict
- Blocks loads during active save operations
- Reduces unnecessary database queries
- Prevents UI flicker from rapid state changes

### 5. Error Recovery with Rollback (Lines 273-279, 454-463)

**Automatic Rollback:**
```typescript
const completeConnection = async (targetNodeId: string) => {
  const node = nodes.find(n => n.id === isConnecting.nodeId);
  if (node) {
    const previousNode = { ...node }; // Snapshot before change

    const updatedNode = { ...node, options: updatedOptions };
    setNodes(nodes.map(n => n.id === node.id ? updatedNode : n)); // Optimistic update

    try {
      await handleSaveScenario(updatedNode);
    } catch (error) {
      // Rollback on failure
      setNodes(nodes.map(n => n.id === node.id ? previousNode : n));
      alert('Failed to save connection. The connection has been reverted.');
    }
  }
};
```

**Benefits:**
- State snapshots before risky operations
- Automatic UI rollback on save failure
- Clear user feedback on failures
- Maintains UI consistency with database state

### 6. Database Stored Procedures (Migration 20251030200000)

**New Functions:**

1. **atomic_update_scenario_with_options**
   - Updates scenario and all options in single transaction
   - Prevents partial updates
   - Returns detailed result including connection counts
   - Can be used in future for even more robust saves

2. **get_scenario_connection_status**
   - Real-time connection status queries
   - Detailed information about all option connections
   - Useful for debugging and validation

3. **verify_scenario_connections_integrity**
   - Validates connection integrity
   - Identifies orphaned connections
   - Reports branch/option mismatches
   - Provides comprehensive health check

**Benefits:**
- Atomic operations prevent data corruption
- Server-side validation reduces client complexity
- Diagnostic tools for troubleshooting
- Foundation for more advanced features

## Testing Performed

1. **Rapid Connection Creation**
   - Created multiple connections in quick succession
   - Verified all connections persisted correctly
   - No connections lost during rapid operations

2. **Connection Deletion**
   - Removed connections via UI
   - Verified database accurately reflected changes
   - Rollback worked correctly on failures

3. **Concurrent Edits**
   - Saved scenario while connections being created
   - Locking mechanism prevented conflicts
   - State remained consistent

4. **Page Refresh**
   - Created connections and refreshed page
   - All connections restored correctly from database
   - useMemo properly reconstructed connection state

5. **Error Scenarios**
   - Simulated save failures
   - Verified rollback mechanism worked
   - User feedback appeared correctly

## Performance Improvements

- **Reduced Database Operations:** Surgical updates only modify changed data
- **Fewer Trigger Executions:** Less delete/insert churn means fewer trigger fires
- **Optimized Re-renders:** useMemo prevents unnecessary React re-renders
- **Debounced Loads:** Prevents redundant database queries

## Migration Path

The fixes are backward compatible and require no data migration. The new stored procedures are additive and don't change existing behavior.

## Monitoring and Diagnostics

### Console Logging
The implementation includes detailed console logging:
- `[ScenarioFlowBuilder]` prefix identifies all flow builder operations
- Connection creation/deletion logged with full details
- Save operations show option counts and connection validation results
- Error conditions logged with context

### Database Functions
Use these functions for diagnostics:

```sql
-- Check connection status for a scenario
SELECT * FROM get_scenario_connection_status('scenario-uuid-here');

-- Verify integrity
SELECT * FROM verify_scenario_connections_integrity('scenario-uuid-here');

-- Validate all connections
SELECT * FROM validate_scenario_connections();
```

## Known Limitations

1. **Optimistic UI Updates:** The UI updates immediately before database confirmation. If saves fail consistently, users may experience rollbacks.

2. **Single User Assumption:** The locking mechanism prevents conflicts within a single browser session but doesn't coordinate across multiple users editing simultaneously.

3. **Manual Refresh Required:** After external database changes (e.g., via SQL), users must manually refresh to see updates.

## Future Enhancements

1. **Real-time Synchronization:** Use Supabase real-time subscriptions to sync changes across users

2. **Conflict Resolution:** Implement proper multi-user editing with conflict detection and resolution

3. **Undo/Redo Stack:** Add full undo/redo capability for connection operations

4. **Visual Save Indicators:** Show save status for each connection (saving, saved, failed) with icons

5. **Batch Operations:** Allow selecting multiple connections for bulk operations

6. **Connection Templates:** Save and reuse common connection patterns

## Conclusion

The connection persistence issues in the flow builder have been comprehensively resolved through:
- Surgical database updates instead of delete-all patterns
- Derived state management with React useMemo
- Connection validation and auto-recovery mechanisms
- Race condition prevention with debouncing and locking
- Automatic error recovery with state rollback
- Robust database stored procedures

These fixes ensure connections remain stable and persistent even under rapid editing, concurrent operations, and error conditions.
