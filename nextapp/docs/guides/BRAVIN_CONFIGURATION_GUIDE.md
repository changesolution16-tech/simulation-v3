# BRAVIN Configuration Guide

## Overview

The BRAVIN assessment system is now fully integrated into the Scenario Manager UI. You can configure BRAVIN impact scores for each scenario option to enable the BRAVIN Leadership Profile on the learner dashboard.

## What is BRAVIN?

BRAVIN is JMMB's leadership culture framework consisting of 6 dimensions:

1. **Boldness** - The courage to take calculated risks and challenge the status quo
2. **Responsibility** - Taking ownership of actions and outcomes
3. **Accountability** - Holding oneself and others to high standards
4. **Vision** - Strategic thinking about the future
5. **Integrity** - Demonstrating honesty and ethical behavior
6. **Nurturance** - Creating supportive environments for growth

## How to Configure BRAVIN Mappings

### Step 1: Open Scenario Manager

1. Go to **Admin Panel**
2. Navigate to **Scenario Manager** tab
3. Select your simulation (e.g., "JMMB Leadership Development Programme - Trust Building")

### Step 2: Edit Scenario Options

1. Click **Edit** on any scenario
2. Expand each option by clicking on it (Option A, B, C, D)
3. Scroll down to find the **"BRAVIN Impact Assessment"** section

### Step 3: Configure BRAVIN Impact

1. Click the blue **"Configure BRAVIN"** button
2. A modal will open showing all 6 BRAVIN dimensions
3. For each dimension, set an impact score from **-100 to +100**:
   - **Positive scores (+1 to +100)**: Choice strengthens this dimension
   - **Negative scores (-1 to -100)**: Choice weakens this dimension
   - **Zero (0)**: Choice has no significant impact on this dimension

### Step 4: Set Context Information

In the BRAVIN configuration modal, you can also set:

- **Pressure Level**: low, medium, or high
- **Complexity Level**: simple, moderate, or complex

These help provide context for the decision's difficulty.

### Step 5: Save Configuration

1. Click **Save** in the BRAVIN configuration modal
2. Click **Save Changes** in the scenario editor to persist all changes

## Impact Score Guidelines

### Positive Impacts (+1 to +100)

- **+1 to +25**: Minor positive impact
- **+26 to +50**: Moderate positive impact
- **+51 to +75**: Strong positive impact
- **+76 to +100**: Exceptional positive impact

### Negative Impacts (-1 to -100)

- **-1 to -25**: Minor negative impact
- **-26 to -50**: Moderate negative impact
- **-51 to -75**: Strong negative impact
- **-76 to -100**: Severe negative impact

## Example Configuration

**Scenario**: Team member reports unethical behavior

**Option A**: "Address the issue immediately and investigate thoroughly"
- Boldness: +60 (taking strong action)
- Responsibility: +70 (addressing the issue)
- Accountability: +80 (investigating thoroughly)
- Vision: +30 (protecting organizational culture)
- Integrity: +90 (upholding ethical standards)
- Nurturance: +40 (protecting team wellbeing)

**Option B**: "Wait and see if the issue resolves itself"
- Boldness: -70 (avoiding difficult action)
- Responsibility: -80 (shirking duty)
- Accountability: -90 (failing to investigate)
- Vision: -50 (risking organizational culture)
- Integrity: -85 (ignoring ethical concerns)
- Nurturance: -60 (failing to protect team)

## What Learners Will See

Once BRAVIN mappings are configured, learners who complete the simulation will see:

### On the Learner Dashboard

A **BRAVIN Leadership Profile** widget displaying:

1. **Overall BRAVIN Score** (0-100)
2. **Top Strength** - Their highest-scoring dimension
3. **Improving Count** - Number of dimensions showing positive trends
4. **Individual Dimension Scores**:
   - Progress bar for each of 6 dimensions
   - Current score (0-100)
   - Trend indicator (↑ improving or → stable)

### In Simulation Results

- Detailed breakdown of BRAVIN dimension impacts
- How each decision affected their BRAVIN profile
- Comparison to previous attempts
- Development recommendations

## Required for BRAVIN Assessment

For BRAVIN assessments to be recorded, you must:

✅ Configure BRAVIN impact scores for ALL options in your simulation
✅ Ensure learners complete the simulation
✅ Have at least one option in each scenario configured

Without BRAVIN mappings configured, learners will see:
- "Start Your BRAVIN Journey" placeholder
- No BRAVIN assessment data
- No dimension scores

## Current Status: JMMB Trust Building Simulation

**Simulation**: JMMB Leadership Development Programme - Trust Building
- ✅ 13 scenarios created
- ✅ Competencies selected
- ✅ Metrics configured
- ❌ BRAVIN mappings NOT configured (0 mappings exist)

**Action Required**: Configure BRAVIN impact scores for all 52 options (13 scenarios × 4 options each)

## Tips for Efficient Configuration

1. **Start with key scenarios**: Configure scenarios that test core BRAVIN dimensions first
2. **Be consistent**: Similar choices across scenarios should have similar impacts
3. **Use context**: Consider the scenario's difficulty when assigning impact scores
4. **Test iteratively**: Configure a few scenarios, have a learner test, review results
5. **Document rationale**: Use the configuration notes field to explain your scoring decisions

## Technical Details

- BRAVIN mappings are stored in the `bravin_scenario_option_mappings` table
- Impact scores are converted to percentages for display (0-100 scale)
- Final BRAVIN score is calculated as the average across all 6 dimensions
- Assessments are recorded in `bravin_learner_scores` table
- Trends are automatically calculated based on assessment history

## Need Help?

If you encounter issues:
1. Ensure you're in **edit mode** for an existing scenario
2. Verify the scenario has been saved (has an ID)
3. Check that options have been created and saved
4. Look for the "Configure BRAVIN" button in each option's expanded view

The BRAVIN configuration is now ready to use. Configure your simulation options to enable the full BRAVIN assessment experience!
