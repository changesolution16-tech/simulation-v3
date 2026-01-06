# Feedback Video Saving Fix - Complete Documentation

## Problem Statement

Feedback videos were not being saved correctly to the database, and when saved, they were not appearing in scenario preview mode. This document outlines the complete solution implemented to fix this issue.

## Root Cause Analysis

The issue stemmed from:

1. **Incomplete video metadata storage**: The database schema evolved over time, creating multiple overlapping columns for video storage
2. **Missing data transformation**: Video URLs were being saved but not properly loaded back into the application
3. **Preview mode gaps**: The preview component wasn't properly accessing the saved video URLs
4. **State management issues**: Frontend components weren't maintaining video data separately from text feedback

## Solution Architecture

### 1. Database Schema Consolidation

**Migration: `20251024034422_add_feedback_video_url_columns.sql`**

Added dedicated URL columns for each difficulty level:
- `feedback_video_url_beginner`
- `feedback_video_url_intermediate`
- `feedback_video_url_advanced`

**Migration: `20251025014635_fix_feedback_video_and_metrics_storage.sql`**

This comprehensive migration established the complete video storage pattern:

#### Video Storage Pattern (Per Difficulty Level)

For **beginner**, **intermediate**, and **advanced**, each has 5 dedicated columns:

```sql
-- Source type enum: 'url', 'library', 'file', 'embed'
feedback_video_source_[difficulty] text

-- Direct URL (legacy support + url source)
feedback_video_url_[difficulty] text

-- Foreign key to video_library table
feedback_video_library_id_[difficulty] uuid

-- Foreign key to video_files table (uploaded files)
feedback_video_file_id_[difficulty] uuid

-- Embedded HTML code (for custom embeds)
feedback_video_embed_code_[difficulty] text
```

#### Database Helper Function

Created `get_feedback_video_url()` function to intelligently resolve video URLs:

```sql
CREATE OR REPLACE FUNCTION get_feedback_video_url(
  p_option_id uuid,
  p_difficulty text
) RETURNS text
```

**Resolution Logic:**
1. If source = 'url' → return direct URL
2. If source = 'library' → lookup URL from video_library table
3. If source = 'file' → lookup storage_path from video_files table
4. If source = 'embed' → return embed code
5. Fallback to direct URL if no source specified (backward compatibility)

#### Data Quality Views

Created three monitoring views:

1. **`options_missing_feedback`**: Identifies options lacking feedback videos
2. **`options_missing_metrics`**: Identifies options without metric assignments
3. **`metric_assignments_summary`**: Comprehensive metric tracking per option

#### Performance Optimization

Added indexes for efficient video lookups:
```sql
CREATE INDEX idx_scenario_options_feedback_library_[difficulty]
CREATE INDEX idx_scenario_options_feedback_file_[difficulty]
```

### 2. Frontend Data Flow

#### Component: `ScenarioEditModal.tsx`

**State Management:**

The modal maintains separate state for each difficulty level's feedback video:

```typescript
feedback_video_beginner: VideoInput | null
feedback_video_intermediate: VideoInput | null
feedback_video_advanced: VideoInput | null
```

**VideoInput Type:**
```typescript
interface VideoInput {
  source: 'url' | 'library' | 'file' | 'embed';
  url?: string;
  libraryId?: string;
  fileId?: string;
  embedCode?: string;
}
```

**Loading Data (Lines 110-157):**

When loading an existing scenario, the component:
1. Extracts video metadata from database columns
2. Creates VideoInput objects with proper source type
3. Falls back to legacy URL fields if metadata unavailable
4. Initializes state with proper video data structure

```typescript
const createVideoInput = (metadata: any, fallbackUrl?: string): VideoInput | null => {
  if (!metadata && !fallbackUrl) return null;

  if (metadata?.source && (metadata.url || metadata.embedCode || metadata.fileId || metadata.libraryId)) {
    return {
      source: metadata.source as VideoSource,
      url: metadata.url,
      embedCode: metadata.embedCode,
      fileId: metadata.fileId,
      libraryId: metadata.libraryId
    };
  }

  if (fallbackUrl) {
    return { source: 'url' as VideoSource, url: fallbackUrl };
  }

  return null;
};
```

**Saving Data (Lines 409-467):**

When saving, the component maps VideoInput state to database columns:

```typescript
const baseOption = {
  // ... other fields ...

  // Beginner level
  feedback_video_url_beginner: opt.feedback_video_beginner?.url || null,
  feedback_video_source_beginner: opt.feedback_video_beginner?.source || null,
  feedback_video_library_id_beginner: opt.feedback_video_beginner?.libraryId || null,
  feedback_video_file_id_beginner: opt.feedback_video_beginner?.fileId || null,
  feedback_video_embed_code_beginner: opt.feedback_video_beginner?.embedCode || null,

  // Intermediate level (same pattern)
  feedback_video_url_intermediate: opt.feedback_video_intermediate?.url || null,
  // ... etc

  // Advanced level (same pattern)
  feedback_video_url_advanced: opt.feedback_video_advanced?.url || null,
  // ... etc
};
```

**Video Input Components (Lines 946-984):**

Each difficulty level has its own VideoInputSelectorWithLibrary:

```typescript
<VideoInputSelectorWithLibrary
  key={`feedback-${index}-beginner`}
  label="Beginner Feedback Video"
  value={option.feedback_video_beginner || undefined}
  onChange={(input) => updateOption(index, 'feedback_video_beginner', input)}
  videoType="feedback"
  helpText="Shown to beginner learners after selecting this option"
  filterByTopic={formData.topicId}
  scenarioName={formData.title}
  scenarioDifficulty="beginner"
  optionIndex={index}
  difficulty="beginner"
/>
```

**Key Points:**
- Each difficulty level is independent
- Video data never overwrites text feedback
- Proper field mapping prevents data corruption
- Comprehensive logging tracks data flow

#### Service: `simulations.ts`

**Data Loading (Lines 144-228):**

When loading a simulation, the service:

1. **Fetches all video columns** from scenario_options table
2. **Calls database function** to resolve video URLs for each difficulty
3. **Creates feedbackVideos object** with resolved URLs
4. **Preserves metadata** for editing purposes

```typescript
// Fetch comprehensive video data
const { data: allOptions } = await supabase
  .from('scenario_options')
  .select(`
    id, scenario_id, option_text, option_order, next_scenario_id,
    feedback_beginner, feedback_intermediate, feedback_advanced,

    feedback_video_url_beginner,
    feedback_video_url_intermediate,
    feedback_video_url_advanced,

    feedback_video_source_beginner,
    feedback_video_source_intermediate,
    feedback_video_source_advanced,

    feedback_video_library_id_beginner,
    feedback_video_library_id_intermediate,
    feedback_video_library_id_advanced,

    feedback_video_file_id_beginner,
    feedback_video_file_id_intermediate,
    feedback_video_file_id_advanced,

    feedback_video_embed_code_beginner,
    feedback_video_embed_code_intermediate,
    feedback_video_embed_code_advanced,

    transition_video_url, transition_video_source,
    transition_video_library_id, transition_video_file_id,
    transition_video_embed_code,

    skill_impacts, competency_impacts
  `)
  .in('scenario_id', scenarioIds);

// Resolve video URLs using database function
for (const opt of allOptions) {
  const [beginnerResult, intermediateResult, advancedResult] = await Promise.all([
    supabase.rpc('get_feedback_video_url', {
      p_option_id: opt.id,
      p_difficulty: 'beginner'
    }),
    supabase.rpc('get_feedback_video_url', {
      p_option_id: opt.id,
      p_difficulty: 'intermediate'
    }),
    supabase.rpc('get_feedback_video_url', {
      p_option_id: opt.id,
      p_difficulty: 'advanced'
    })
  ]);

  opt._resolved_video_beginner = beginnerResult.data;
  opt._resolved_video_intermediate = intermediateResult.data;
  opt._resolved_video_advanced = advancedResult.data;
}
```

**Data Transformation (Lines 237-296):**

Creates proper option objects with video data:

```typescript
return {
  id: opt.id,
  text: opt.option_text,
  feedback: {
    beginner: feedbackBeginner || '',
    intermediate: feedbackIntermediate || '',
    advanced: feedbackAdvanced || ''
  },
  feedbackVideos: {
    beginner: opt._resolved_video_beginner || opt.feedback_video_url_beginner || null,
    intermediate: opt._resolved_video_intermediate || opt.feedback_video_url_intermediate || null,
    advanced: opt._resolved_video_advanced || opt.feedback_video_url_advanced || null
  },
  feedbackVideoMetadata: {
    beginner: {
      source: opt.feedback_video_source_beginner,
      libraryId: opt.feedback_video_library_id_beginner,
      fileId: opt.feedback_video_file_id_beginner,
      embedCode: opt.feedback_video_embed_code_beginner,
      url: opt.feedback_video_url_beginner
    },
    intermediate: { /* ... */ },
    advanced: { /* ... */ }
  },
  transitionVideoUrl: opt.transition_video_url,
  transitionVideoMetadata: { /* ... */ },
  skillImpact: opt.skill_impacts,
  competency_impacts: opt.competency_impacts
};
```

#### Component: `ScenarioPreview.tsx`

**Video Display (Lines 485-530):**

The preview component accesses feedback videos by difficulty:

```typescript
{(() => {
  const feedbackVideoUrl = selectedOption.feedbackVideos?.[selectedDifficulty];

  console.log('=== FEEDBACK PHASE DEBUG ===');
  console.log('Selected Difficulty:', selectedDifficulty);
  console.log('Feedback Video URL for difficulty:', feedbackVideoUrl);
  console.log('Has feedback video?:', !!feedbackVideoUrl);

  return feedbackVideoUrl ? (
    <div className="mb-6">
      <SynthesiaPlayer
        videoUrl={feedbackVideoUrl}
        videoType="feedback"
        onComplete={handleFeedbackVideoComplete}
        onSkip={handleFeedbackVideoSkip}
        autoPlay={true}
        requireFullWatch={false}
        minWatchPercentage={90}
        allowSkip={true}
        testingMode={true}
      />
    </div>
  ) : (
    <div className="bg-white border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">
        Feedback ({selectedDifficulty} level)
      </h3>
      <p className="text-gray-700">
        {selectedOption.feedback[selectedDifficulty]}
      </p>
    </div>
  );
})()}
```

**Key Features:**
- Dynamic video selection based on difficulty
- Automatic fallback to text feedback
- Comprehensive logging for debugging
- Proper video player integration

### 3. Data Validation and Safety

#### UUID Detection

The system prevents UUID corruption in feedback fields:

```typescript
const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

for (let i = 0; i < options.length; i++) {
  if (uuidPattern.test(options[i].feedback_beginner)) {
    onError(`Option ${String.fromCharCode(65 + i)} beginner feedback contains invalid data (UUID detected).`);
    return false;
  }
  // Same for intermediate and advanced
}
```

#### Metric Score Validation

Database constraint ensures valid metric scores:

```sql
ALTER TABLE scenario_option_metrics
ADD CONSTRAINT scenario_option_metrics_score_range_check
CHECK (
  score_value >= 0 AND score_value <= 100 AND
  weight >= 0 AND weight <= 10
);
```

#### Comprehensive Logging

Every step of the video data flow includes logging:

```typescript
console.log(`[ScenarioEditModal] Loading option ${idx}:`, {
  id: opt.id,
  text: opt.text?.substring(0, 30),
  metricScoresCount: metricScores.length,
  feedbackVideoMetadata: opt.feedbackVideoMetadata,
  transitionVideoMetadata: opt.transitionVideoMetadata
});
```

## Testing Checklist

To verify the fix works correctly:

### 1. Creating New Scenarios

- [ ] Create a new scenario with feedback videos for all difficulty levels
- [ ] Save and verify videos appear in edit modal
- [ ] Check database columns contain correct data
- [ ] Preview scenario and verify videos play for each difficulty

### 2. Editing Existing Scenarios

- [ ] Open an existing scenario with videos
- [ ] Verify videos load correctly in edit modal
- [ ] Change video for one difficulty level
- [ ] Save and verify only changed video updated
- [ ] Preview and confirm changes visible

### 3. Video Source Types

- [ ] Test direct URL input
- [ ] Test video library selection
- [ ] Test file upload
- [ ] Test embed code input
- [ ] Verify each source type saves and loads correctly

### 4. Data Integrity

- [ ] Run diagnostic script: `node diagnose-feedback-issue.mjs`
- [ ] Check for UUID corruption in feedback fields
- [ ] Verify video URLs are in correct columns
- [ ] Query data quality views for missing videos

### 5. Preview Mode

- [ ] Start preview at beginner difficulty
- [ ] Verify beginner feedback video plays
- [ ] Restart at intermediate difficulty
- [ ] Verify intermediate feedback video plays
- [ ] Restart at advanced difficulty
- [ ] Verify advanced feedback video plays

## Maintenance Guidelines

### Adding New Video Types

If you need to add video support to other parts of the system:

1. **Add database columns** following the established pattern:
   - `{type}_video_url`
   - `{type}_video_source`
   - `{type}_video_library_id`
   - `{type}_video_file_id`
   - `{type}_video_embed_code`

2. **Create helper function** (optional) to resolve URLs

3. **Update fetch queries** to include new columns

4. **Create VideoInput state** in relevant components

5. **Map data** properly during save operations

6. **Add indexes** for foreign key columns

### Monitoring Data Quality

Regularly check the data quality views:

```sql
-- Check for options missing feedback videos
SELECT * FROM options_missing_feedback;

-- Check for options missing metrics
SELECT * FROM options_missing_metrics;

-- Review metric assignments
SELECT * FROM metric_assignments_summary
WHERE scenario_id = 'your-scenario-id';
```

### Debugging Issues

If video saving issues recur:

1. Check browser console for component logs
2. Verify database function exists and works: `SELECT get_feedback_video_url('option-id', 'beginner');`
3. Run diagnostic script to check data integrity
4. Review Network tab payload during save operation
5. Check that VideoInputSelectorWithLibrary uses correct onChange callback

## Benefits of This Solution

1. **Separation of Concerns**: Video metadata stored separately from text feedback
2. **Multiple Input Methods**: Supports URL, library, file upload, and embed code
3. **Backward Compatible**: Legacy URL fields still work
4. **Type Safe**: Proper TypeScript types prevent data corruption
5. **Easy to Debug**: Comprehensive logging throughout data flow
6. **Scalable**: Pattern can be extended to other video types
7. **Data Quality**: Views and validation prevent corruption
8. **Performance**: Indexed lookups for video references

## Related Files

### Database Migrations
- `/supabase/migrations/20251024034422_add_feedback_video_url_columns.sql`
- `/supabase/migrations/20251025014635_fix_feedback_video_and_metrics_storage.sql`

### Frontend Components
- `/src/components/admin/ScenarioEditModal.tsx` (lines 110-157, 409-467, 946-984)
- `/src/components/admin/ScenarioPreview.tsx` (lines 485-530)

### Services
- `/src/lib/simulations.ts` (lines 144-296)

### Types
- `/src/types/index.ts` (VideoInput, VideoSource interfaces)

### Diagnostic Tools
- `/diagnose-feedback-issue.mjs`
- `/check-scenario-data.mjs`

## Conclusion

This comprehensive fix ensures feedback videos are properly saved, loaded, and displayed throughout the application. The solution maintains data integrity, supports multiple video input methods, and provides excellent debugging capabilities. Future developers can follow this pattern when adding video support to other parts of the system.
