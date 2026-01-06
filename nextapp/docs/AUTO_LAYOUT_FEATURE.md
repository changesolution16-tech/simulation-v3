# Auto-Layout Feature for Scenario Flow Builder

## Overview

The Scenario Flow Builder now includes intelligent auto-layout functionality that automatically positions scenario nodes based on their connections and hierarchy, preventing scenarios from stacking on top of each other.

## Features Implemented

### 1. Hierarchical Layout Algorithm
- **Location**: `src/lib/scenarioLayoutAlgorithm.ts`
- Analyzes scenario connections to determine parent-child relationships
- Organizes scenarios by depth level (root scenarios at top, children below)
- Distributes nodes horizontally within each level to prevent overlap
- Provides optimal spacing between nodes based on canvas dimensions

### 2. Automatic Layout on Load
- When scenarios are first loaded from the database with default positions (0, 0)
- System detects all nodes are unpositioned and triggers auto-layout
- Positions are automatically saved to database for persistence
- Scenarios that already have custom positions are preserved

### 3. Manual Auto-Layout Button
- New "Auto Layout" button in the toolbar (purple network icon)
- Allows users to reorganize scenarios at any time
- Confirmation dialog if nodes already have custom positions
- Visual feedback with pulsing icon during layout calculation

### 4. Layout Modes
- **Hierarchical Mode**: Standard spacing for clear visualization
- **Compact Mode**: Reduced spacing for dense scenario flows
- Toggle button to switch between modes on the fly
- Mode preference applies to future auto-layout operations

### 5. Smooth Animations
- Scenarios animate to new positions using spring physics
- Natural, fluid motion instead of instant jumps
- Framer Motion integration for professional feel
- Visual loading indicator during layout calculation

### 6. Database Integration
- Batch position updates to minimize database calls
- Position data persists across sessions
- Automatically saves after auto-layout completes
- Updates `position_x` and `position_y` fields in scenarios table

## User Experience

### First Time Load
1. User opens Scenario Flow Builder
2. System detects scenarios at position (0, 0)
3. Auto-layout runs automatically after 100ms delay
4. Scenarios smoothly animate to organized positions
5. Positions save to database

### Manual Reorganization
1. User clicks purple "Auto Layout" button in toolbar
2. System checks for existing positioned nodes
3. Confirmation dialog appears if custom positions exist
4. Layout algorithm reorganizes all scenarios
5. Smooth animation transitions nodes to new positions
6. Loading indicator shows "Organizing scenarios..."

### Layout Modes
- Click the mode toggle button below the Auto Layout button
- Switch between "Hierarchical" and "Compact" layouts
- Next auto-layout operation uses the selected mode

## Technical Details

### Algorithm Features
- Root node detection (scenarios with no incoming connections)
- Level-based hierarchical positioning
- Collision detection and prevention
- Configurable spacing parameters
- Handles disconnected scenario groups

### Performance
- Efficient O(n) algorithm for position calculation
- Batch database updates reduce round trips
- Smooth 60fps animations via Framer Motion
- Non-blocking UI during layout operations

### Edge Cases Handled
- No scenarios: Button disabled
- Single scenario: Centered positioning
- Circular dependencies: First node becomes root
- Disconnected graphs: Separate levels for orphaned nodes
- Mixed positioned/unpositioned: Auto-layout only on request

## UI Elements

### Toolbar Additions
- **Auto Layout Button**: Purple network icon, triggers reorganization
- **Layout Mode Toggle**: Text button showing current mode
- **Loading Indicator**: Purple badge with spinner when processing

### Visual Feedback
- Pulsing animation on Auto Layout button during processing
- "Organizing scenarios..." message appears top-right
- Smooth spring animations as nodes move to positions
- Disabled state when no scenarios exist

## Future Enhancements

Possible improvements for future iterations:
- Undo/redo for layout changes
- Multiple layout algorithms (force-directed, circular, etc.)
- Custom spacing configuration in UI
- Layout presets for common patterns
- Export/import layout configurations
- Keyboard shortcuts (Ctrl+L for auto-layout)

## Usage Tips

1. **First Time**: Just load scenarios - auto-layout happens automatically
2. **Reorganize**: Click the purple network icon in the left toolbar
3. **Change Density**: Toggle between Hierarchical and Compact modes
4. **Manual Adjustment**: Drag nodes after auto-layout for fine-tuning
5. **Reset**: Click Auto Layout again to recalculate from scratch

## Code Structure

```
src/lib/scenarioLayoutAlgorithm.ts
├── calculateHierarchicalLayout()  # Main layout algorithm
├── calculateCompactLayout()       # Compact variant
├── identifyRootNodes()            # Find starting scenarios
├── detectOverlappingNodes()       # Collision detection
└── areAllNodesUnpositioned()      # Check if layout needed

src/components/admin/ScenarioFlowBuilder.tsx
├── applyAutoLayout()              # Apply layout to nodes
├── batchSaveNodePositions()       # Save to database
├── handleAutoLayoutClick()        # User-triggered layout
└── Auto-layout trigger on load    # Automatic initial layout
```

## Database Schema

Uses existing fields in `scenarios` table:
- `position_x`: integer (default 0)
- `position_y`: integer (default 0)

No migration required - feature uses existing schema.
