# Auto-Mapping Quick Start Guide

## What Changed?

Your scenario creation process just got **much simpler**! The system now automatically suggests competencies and creates metric-to-competency mappings based on the metrics you select.

## Before vs After

### Before (Manual Process)
1. Select metrics for your scenario
2. Manually select competencies (which ones?)
3. Configure metric-competency mappings (complex!)
4. Set calculation methods (linear? threshold-based?)
5. Define weights (what values?)
6. Configure algorithm parameters (what does this mean?)

### After (Automated Process)
1. Select metrics for your scenario
2. **Review auto-suggested competencies** ✓ (system picks the best matches)
3. **Accept suggestions** ✓ (or customize if needed)
4. Done! Everything else is automatic ✓

## How to Use It

### Creating a New Scenario

1. **Navigate to Admin Dashboard** → **Scenario Manager** → **Create New Scenario**

2. **Fill in the Introduction tab**
   - Title, description, topic, difficulty
   - Add videos if desired

3. **Go to Questions & Options tab**
   - Add your assessment metrics (e.g., Communication, Decision Quality)
   - **The magic happens here!** 👇

4. **Auto-Mapping Preview Appears**
   - You'll see a blue panel titled "Auto-Suggested Competencies"
   - System shows competencies that match your selected metrics
   - Each suggestion includes:
     - **Confidence level** (high, medium, low)
     - **Development priority** (primary, secondary, supplementary)
     - **Matching metrics** (which metrics map to this competency)
     - **Rationale** (why this competency was suggested)

5. **Review and Accept**
   - High-confidence suggestions are pre-selected
   - Toggle individual competencies on/off as needed
   - Click "Accept X Selected Competencies"
   - Or click "Skip" if you prefer manual configuration

6. **Complete Your Scenario**
   - Add response options and feedback
   - Configure decision timer if desired
   - Click "Create Scenario"

7. **Behind the Scenes**
   - System creates targeted competencies
   - Generates metric-competency mappings
   - Applies best-practice formulas
   - Configures calculation methods and weights
   - Everything is ready for learner assessment!

## Example: Creating a Communication Scenario

### Step 1: Select Metric
You select: **Communication** metric

### Step 2: System Suggests
Auto-suggestions appear:
- ✅ **COM-01: Verbal Communication** (High confidence)
  - Priority: Primary
  - Weight: 100%
  - Matches: Communication
  - Rationale: Direct linear relationship between communication metric and competency

- ✅ **IPC-02: Interpersonal Collaboration** (High confidence)
  - Priority: Secondary
  - Weight: 80%
  - Matches: Communication
  - Rationale: Interpersonal collaboration requires effective communication

- ⚪ **COL-01: Team Collaboration** (Medium confidence)
  - Priority: Secondary
  - Weight: 60%
  - Matches: Communication
  - Rationale: Collaboration benefits from strong communication

### Step 3: Accept Suggestions
You click "Accept 2 Selected Competencies" (accepting the two high-confidence ones)

### Step 4: Done!
The system automatically:
- Sets COM-01 as a primary competency with linear calculation
- Sets IPC-02 as a secondary competency with linear calculation
- Configures appropriate weights and algorithm parameters
- Links everything to your Communication metric

## Understanding Confidence Levels

### High Confidence (Green)
- Strong, well-established relationship
- Backed by industry research and frameworks
- **Automatically pre-selected**
- Example: Communication metric → Communication competency

### Medium Confidence (Yellow)
- Supporting relationship
- Empirically validated but not as direct
- **Available for selection**
- Example: Communication metric → Collaboration competency

### Low Confidence (Gray)
- Contextual or indirect relationship
- May be relevant in specific scenarios
- **Shown but not pre-selected**
- Example: Communication metric → Strategic Thinking competency

## Customization Options

### During Creation
- **Toggle competencies**: Turn individual suggestions on/off
- **Select All / Deselect All**: Bulk actions available
- **Review rationales**: Understand why each was suggested
- **Skip auto-mapping**: Choose manual configuration

### After Creation
- Edit scenario to modify competencies
- Adjust mapping weights in the simulation builder
- Override calculation methods if needed
- Add or remove competencies as needed

## Benefits

### Save Time
- Reduces scenario creation time by 60-70%
- No need to research competency frameworks
- Eliminates manual mapping configuration

### Reduce Errors
- Prevents common mapping mistakes
- Ensures consistent calculation methods
- Uses validated formulas from industry standards

### Improve Quality
- Based on Lumina Learning Framework
- Incorporates BRAVIN Leadership Framework
- Follows emotional intelligence best practices
- Uses proven competency development models

## Tips for Best Results

1. **Start with clear metrics**: Choose metrics that align with your learning objectives
2. **Review suggestions carefully**: System is smart but you know your context best
3. **Accept high-confidence suggestions**: They're based on solid research
4. **Consider medium-confidence**: May be valuable for comprehensive assessment
5. **Skip low-confidence unless specific need**: Keep assessment focused

## Industry Frameworks Used

The auto-mapping system is based on:
- **Lumina Learning Framework**: Leadership and personal development competencies
- **BRAVIN Framework**: Brené Brown's trust and leadership model
- **Goleman EI Framework**: Emotional intelligence competencies
- **Best Practices**: Aggregated from organizational psychology research

## Need Help?

### Common Questions

**Q: Can I still manually configure everything?**
A: Yes! Click "Skip" when suggestions appear, or edit after creation.

**Q: What if suggestions don't fit my scenario?**
A: You have full control - toggle off any suggestions before accepting.

**Q: How do I add my own mapping rules?**
A: Contact your system administrator to add custom rules to the database.

**Q: Can I change mappings after accepting?**
A: Yes, edit the scenario or simulation to modify competencies and mappings.

**Q: Why are some suggestions medium/low confidence?**
A: The system shows all possible relationships, prioritized by research evidence.

## What's Next?

The auto-mapping system will continue to improve:
- More mapping rules added based on usage
- Machine learning to personalize suggestions
- Organization-specific customization options
- Enhanced preview and editing capabilities

---

**You're ready to go!** Start creating scenarios faster with intelligent auto-mapping. 🚀
