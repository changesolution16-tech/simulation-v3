# Auto-Mapping Implementation Guide

## Overview

The auto-mapping system automatically suggests competencies and creates metric-to-competency mappings when you select metrics during scenario creation. This streamlines the scenario creation process by eliminating the need to manually configure complex competency formulas and mappings.

## Key Features

### 1. Automatic Competency Suggestions
When you select assessment metrics, the system automatically suggests relevant competencies based on:
- **Industry-standard mapping rules** stored in the database
- **Confidence levels** (high, medium, low) indicating mapping strength
- **Best-practice formulas** from frameworks like Lumina Learning and BRAVIN

### 2. Intelligent Mapping Creation
For each metric-competency pair, the system automatically:
- Selects the appropriate calculation method (linear, threshold-based, exponential, etc.)
- Assigns optimal weights based on relationship strength
- Configures algorithm parameters using industry standards
- Sets up score conversion rules

### 3. User Control and Flexibility
Creators maintain full control with:
- Review and accept/reject suggestions before they're applied
- Select which competencies to use from suggestions
- Ability to customize mappings after auto-generation
- Option to skip auto-mapping and configure manually

## How It Works

### Database Schema

#### `default_metric_competency_rules` Table
Stores predefined relationships between metric types and competency code patterns:
- **metric_type**: Type of metric (e.g., 'communication', 'decision_quality')
- **competency_code_pattern**: Pattern to match competency codes (e.g., 'COM%', 'STR%')
- **recommended_calculation_method**: Best calculation approach for this relationship
- **default_weight**: Suggested weight based on relationship strength
- **confidence_level**: High, medium, or low confidence in this mapping
- **rationale**: Explanation of why this mapping is recommended
- **algorithm_config**: Default configuration for calculation algorithm
- **industry_standard_reference**: Source of the mapping rule

#### `auto_mapping_configuration` Table
Controls auto-mapping behavior:
- **auto_mapping_enabled**: Master switch for auto-mapping
- **auto_accept_high_confidence**: Automatically accept high-confidence suggestions
- **suggest_competencies_for_metrics**: Enable competency suggestions
- **auto_create_targeted_competencies**: Automatically create competency targets
- Can be configured globally or per-simulation

### Workflow

1. **Creator selects metrics** in scenario creation
2. **System analyzes metrics** and queries default_metric_competency_rules
3. **Competency suggestions generated** with confidence scores
4. **Creator reviews suggestions** via AutoMappingPreview component
5. **Creator accepts selected suggestions**
6. **Targeted competencies created** in scenario_targeted_competencies table
7. **Scenario is saved** with all competencies and mappings configured

### Calculation Methods

The system uses different calculation methods based on the competency type:

#### Linear
- **Use for**: General skill development, direct metric-competency relationships
- **Formula**: impact = (score - baseline) × weight × scale_factor
- **Example**: Communication metric → Communication competency

#### Threshold-Based
- **Use for**: Proficiency levels, strategic thinking, emotional intelligence
- **Formula**: Uses discrete thresholds (Below, Meets, Exceeds, Exemplary)
- **Example**: Decision Quality → Strategic Thinking competency

#### Exponential Growth
- **Use for**: Leadership, vision, advanced competencies
- **Formula**: impact = weight × exp((score - threshold) / growth_rate)
- **Example**: BRAVIN Alignment → Leadership competency

#### Compensatory
- **Use for**: Team-based competencies where strengths offset weaknesses
- **Formula**: Aggregate scores across metrics before applying impact
- **Example**: Collaboration across multiple teamwork metrics

#### Conjunctive
- **Use for**: Trust, reliability, ethics - where all elements must be present
- **Formula**: Requires minimum thresholds in ALL metrics
- **Example**: Trust Impact → Relationship Building (BRAVING Framework)

## Usage in Scenario Creation

### Step 1: Select Metrics
In the "Questions & Options" tab, add assessment metrics:
```typescript
// Metrics selected: Communication, Decision Quality, Emotional Intelligence
```

### Step 2: Review Auto-Suggestions
The AutoMappingPreview component appears showing:
- **High confidence** suggestions (automatically selected)
- **Medium confidence** suggestions (available for selection)
- **Low confidence** suggestions (shown but not pre-selected)

### Step 3: Accept or Customize
- Click "Accept X Selected Competencies" to use suggestions
- Or click "Skip" to manually configure later
- Toggle individual competencies on/off before accepting

### Step 4: Automatic Mapping
When the scenario is saved:
- Targeted competencies are created in the database
- Metric-competency mappings are automatically generated
- Appropriate calculation methods and weights are assigned
- Everything is ready for learner assessment

## Code Components

### AutoMappingService (`src/lib/autoMapping.ts`)
Core service handling auto-mapping logic:
- `suggestCompetenciesForMetrics()`: Generates competency suggestions
- `getDefaultRulesForMetric()`: Retrieves mapping rules from database
- `autoCreateTargetedCompetencies()`: Creates competency targets
- `generateMappingMatches()`: Creates metric-competency matches
- `getConfiguration()`: Retrieves auto-mapping settings

### AutoMappingPreview Component (`src/components/admin/AutoMappingPreview.tsx`)
UI component for reviewing and accepting suggestions:
- Displays suggested competencies with confidence levels
- Shows matching metrics for each suggestion
- Allows selection/deselection of suggestions
- Provides preview of automatic mappings
- Handles acceptance/rejection of suggestions

### ScenarioCreationModal Integration
Updated to integrate auto-mapping:
- Shows AutoMappingPreview when metrics are selected
- Stores accepted suggestions
- Creates targeted competencies during scenario save
- Displays summary of selected competencies

## Default Mapping Rules

The system includes pre-configured rules for common metric-competency relationships:

### Communication Metrics
- **COM%** (Communication competencies): High confidence, linear, weight 1.0
- **IPC%** (Interpersonal Collaboration): High confidence, linear, weight 0.8
- **COL%** (Collaboration): Medium confidence, linear, weight 0.6

### Decision Quality Metrics
- **STR%** (Strategic Thinking): High confidence, threshold-based, weight 1.0
- **DEC%** (Decision-Making): High confidence, linear, weight 1.0
- **LDR%** (Leadership): Medium confidence, threshold-based, weight 0.7

### Problem Solving Metrics
- **PRO%** (Problem-Solving): High confidence, linear, weight 1.0
- **CRT%** (Critical Thinking): High confidence, linear, weight 0.9
- **STR%** (Strategic Thinking): Medium confidence, linear, weight 0.6

### Emotional Intelligence Metrics
- **EI%** (Emotional Intelligence): High confidence, threshold-based, weight 1.0
- **REL%** (Relationship Building): High confidence, threshold-based, weight 0.85
- **EMP%** (Empathy): High confidence, linear, weight 0.9
- **SLF%** (Self-Awareness/Management): High confidence, threshold-based, weight 0.8

### BRAVIN Framework Metrics
- **LDR%** for bravin_alignment: High confidence, exponential, weight 0.9
- **REL%** for trust_impact: High confidence, conjunctive, weight 1.0
- **ETH%** for ethical_decision_quality: High confidence, threshold-based, weight 1.0
- **EI%** for emotional_intelligence_index: High confidence, threshold-based, weight 1.0
- **CUL%** for cultural_stewardship: High confidence, exponential, weight 1.0

## Configuration

### Global Configuration
Default settings apply to all simulations unless overridden:
```sql
-- View current configuration
SELECT * FROM auto_mapping_configuration
WHERE applies_globally = true AND is_active = true;
```

### Simulation-Specific Configuration
Override settings for specific simulations:
```sql
INSERT INTO auto_mapping_configuration (
  auto_mapping_enabled,
  auto_accept_high_confidence,
  applies_to_simulation_id
) VALUES (
  true,
  true,
  'simulation-uuid-here'
);
```

### Adding Custom Mapping Rules
Administrators can add new mapping rules:
```sql
INSERT INTO default_metric_competency_rules (
  metric_type,
  competency_code_pattern,
  recommended_calculation_method,
  default_weight,
  confidence_level,
  mapping_priority,
  relationship_type,
  rationale,
  default_algorithm_config,
  industry_standard_reference
) VALUES (
  'custom_metric',
  'CUS%',
  'linear',
  1.0,
  'high',
  100,
  'direct',
  'Custom metric maps directly to custom competencies',
  '{"scale_factor": 0.1, "baseline_score": 50}'::jsonb,
  'Your Organization Framework'
);
```

## Benefits

### For Creators
- **Faster scenario creation**: No need to manually configure competency mappings
- **Best-practice formulas**: Automatically applied based on industry standards
- **Reduced errors**: System prevents common mapping mistakes
- **Flexibility**: Can still customize if needed

### For Organizations
- **Consistency**: All scenarios use the same mapping logic
- **Standards-based**: Follows established frameworks (Lumina, BRAVIN, etc.)
- **Scalability**: Easy to create many scenarios quickly
- **Transparency**: Clear rationale for all mappings

### For Learners
- **Accurate assessment**: Competency scores based on proven formulas
- **Fair evaluation**: Consistent scoring across scenarios
- **Meaningful feedback**: Competency development tracked properly

## Troubleshooting

### No suggestions appearing
- Check that metrics are selected
- Verify default_metric_competency_rules table has data
- Ensure auto_mapping_configuration is enabled
- Check browser console for errors

### Wrong competencies suggested
- Review mapping rules in database
- Adjust confidence levels or priorities
- Add more specific rules for your metrics
- Use competency code patterns more precisely

### Mappings not being created
- Verify targeted competencies were accepted
- Check that simulation_id is valid
- Ensure scenario was saved successfully
- Review browser console and server logs

## Future Enhancements

Potential improvements to the auto-mapping system:
- Machine learning to improve suggestions over time
- Organizational customization of default rules
- Bulk editing of mapping rules
- Visual mapping editor
- Import/export of mapping configurations
- Analytics on mapping effectiveness

## API Reference

### AutoMappingService Methods

#### `getConfiguration(simulationId?: string): Promise<AutoMappingConfiguration>`
Retrieves auto-mapping configuration for a simulation or globally.

#### `suggestCompetenciesForMetrics(metricIds: string[], existingCompetencyIds: string[]): Promise<CompetencySuggestion[]>`
Generates competency suggestions based on selected metrics.

#### `getDefaultRulesForMetric(metricType: string): Promise<any[]>`
Retrieves default mapping rules for a specific metric type.

#### `autoCreateTargetedCompetencies(scenarioId: string, suggestions: CompetencySuggestion[], minConfidence: 'high' | 'medium' | 'low'): Promise<boolean>`
Automatically creates targeted competencies from accepted suggestions.

## Support

For questions or issues with auto-mapping:
1. Check this documentation
2. Review the database schema
3. Inspect browser console for errors
4. Check server logs for backend issues
5. Contact system administrators
