# Video Embedding Enhancement Guide

## Overview

This guide documents the new video embedding functionality for the scenario builder. The system now supports embedding videos from multiple platforms including Synthesia, YouTube, Vimeo, and Loom with intelligent URL detection, validation, and a reusable video library.

## New Features

### 1. Multi-Platform Video Support

The system now automatically detects and converts video URLs from:
- **Synthesia** - Primary platform for AI-generated training videos
- **YouTube** - For supplementary content and existing training materials
- **Vimeo** - For professional training videos
- **Loom** - For quick instructional recordings
- **Custom** - Any other video platform with embed support

### 2. VideoEmbedField Component

A new reusable component (`src/components/video/VideoEmbedField.tsx`) that provides:
- Real-time URL validation with visual feedback
- Automatic platform detection
- URL to embed URL conversion
- Live video preview before saving
- Platform badges showing the detected video source
- Error handling with clear messages

**Usage Example:**
```tsx
<VideoEmbedField
  label="Introduction Video URL"
  value={videoUrl}
  onChange={(url) => setVideoUrl(url)}
  videoType="introduction"
  helpText="Video shown first to introduce the scenario"
  required
/>
```

### 3. Enhanced Scenario Creation

The `ScenarioCreationModal` now includes:
- Rich video embed fields for all video types
- Introduction, Prompt, and Transition videos
- Per-difficulty feedback videos (Beginner, Intermediate, Advanced)
- Option-specific transition videos
- Real-time preview capability
- Validation before saving

### 4. Enhanced Scenario Editing

The `ScenarioEditModal` now provides:
- All video embed fields visible and editable
- Support for updating existing video URLs
- Introduction video field support
- Consistent interface with creation modal

### 5. Video Library System

A comprehensive video library (`src/components/admin/VideoLibrary.tsx`) that enables:

**Features:**
- Store frequently used video URLs for reuse
- Tag videos by topic, difficulty, or scenario type
- Search and filter videos by platform, type, or tags
- Track video usage statistics
- Share videos between instructors (public/private setting)
- Copy video URLs with one click
- Edit and delete library videos

**Video Library Fields:**
- Title and description
- Video URL with platform auto-detection
- Video type (introduction, prompt, feedback, transition, supplementary)
- Tags for organization
- Public/private visibility
- Usage tracking

### 6. Enhanced Video Manager

The `VideoManager` component now includes:

**Two Tabs:**
1. **Manage Videos** - Assign videos to scenarios
   - VideoEmbedField for better URL input
   - Multi-platform support
   - Real-time validation
   - Bulk validation tool

2. **Video Library** - Manage reusable video collection
   - Browse all library videos
   - Add, edit, delete videos
   - Search and filter

**New Tools:**
- Validate All Videos button - Checks accessibility of all scenario videos
- Platform detection and display
- Error reporting for broken links

### 7. Enhanced SynthesiaPlayer

The video player (`src/components/video/SynthesiaPlayer.tsx`) now:
- Automatically detects video platform
- Converts share URLs to embed URLs for all platforms
- Displays platform badge for non-Synthesia videos
- Handles YouTube, Vimeo, and Loom embeds natively
- Provides consistent playback experience across platforms

## Database Schema

### New Tables

#### `video_library`
Stores reusable video URLs with metadata:
- `id`, `title`, `description`
- `video_url`, `video_platform`
- `tags[]`, `topic_ids[]`, `difficulty`, `video_type`
- `embed_parameters` (JSON for custom settings)
- `usage_count`, `last_used_at`
- `created_by`, `is_public`, `is_active`
- `last_validated_at`, `is_accessible`, `last_error`

#### `video_collections`
Groups related videos together:
- `id`, `name`, `description`
- `collection_type`, `topic_id`
- `created_by`, `is_public`, `is_active`

#### `video_collection_items`
Junction table for collection membership:
- `id`, `collection_id`, `video_id`
- `display_order`, `notes`
- `added_at`, `added_by`

#### `video_access_logs`
Tracks video accessibility:
- `id`, `video_url`, `video_source`, `source_id`
- `access_status`, `http_status_code`, `error_message`
- `response_time_ms`, `checked_by`, `checked_at`

### Enhanced Tables

#### `scenarios`
New columns:
- `video_platform` - Detected platform (synthesia, youtube, vimeo, loom, custom)
- `embed_parameters` - JSON for custom embed settings (autoplay, controls, etc.)
- `video_library_id` - Reference to video library (optional)

#### `scenario_options`
New columns:
- `embed_parameters` - JSON for custom embed settings
- `video_library_id` - Reference to video library (optional)

## Helper Functions

### `detect_video_platform(video_url_param text)`
Returns the platform name based on URL pattern matching.

### `increment_video_usage(video_id_param uuid)`
Increments usage count and updates last_used_at timestamp.

## Security

All new tables have Row Level Security (RLS) enabled:

**Video Library:**
- Instructors and admins can manage all videos they created
- All users can view public videos
- Private videos only visible to creator

**Video Collections:**
- Same policy as video library

**Video Access Logs:**
- Instructors and admins can view logs
- System can create logs automatically

## Usage Guide

### Adding Video to Scenario (Creation)

1. Navigate to Admin Dashboard → Scenario Manager
2. Click "Create Scenario"
3. In Step 1, scroll to video fields:
   - **Introduction Video** - First video shown to learner
   - **Video Prompt** - Text description for video generation
   - **Prompt Video** - Main scenario video
   - **Transition Video** - Shown between scenarios
4. Paste any video URL (Synthesia, YouTube, Vimeo, Loom)
5. Component will auto-detect platform and validate
6. Click preview to see how it will appear
7. Continue to Step 2 for options
8. Add feedback videos per difficulty level
9. Add option-specific transition videos if needed

### Using Video Library

1. Navigate to Admin Dashboard → Video Manager
2. Click "Video Library" tab
3. Click "Add Video" button
4. Fill in details:
   - Title (required)
   - Description
   - Video URL (required) - Will auto-detect platform
   - Video Type (introduction, prompt, feedback, transition, supplementary)
   - Tags (comma-separated)
   - Public checkbox (share with other instructors)
5. Click "Add to Library"
6. Use search and filters to find videos later
7. Click "Copy" to copy URL for use in scenarios

### Validating All Videos

1. Navigate to Admin Dashboard → Video Manager
2. Click "Manage Videos" tab
3. Scroll to "Video URL Validation" section
4. Click "Validate All Videos"
5. System will check accessibility of all scenario videos
6. Results will show number of broken links if any

## Best Practices

### Video URL Guidelines

1. **Use Share URLs** - Most platforms provide a share URL that's permanent
2. **Avoid Temporary Links** - Some video platforms create time-limited URLs
3. **Test Before Saving** - Always use the preview feature
4. **Use Video Library** - Store frequently used videos for easy reuse
5. **Tag Appropriately** - Add relevant tags for easy searching

### Platform Selection

- **Synthesia** - Best for consistent, branded AI-generated content
- **YouTube** - Good for existing training materials and supplementary content
- **Vimeo** - Professional training videos with better privacy controls
- **Loom** - Quick instructional recordings and screen captures

### Video Organization

1. Create descriptive titles for library videos
2. Use consistent tagging scheme (e.g., topic names, difficulty levels)
3. Mark reusable videos as public
4. Keep video library clean by removing unused videos
5. Validate videos periodically to catch broken links

## Troubleshooting

### Video Won't Preview
- Check if URL is accessible in browser
- Ensure URL is not behind authentication
- Try converting to direct embed URL manually
- Check browser console for iframe blocking errors

### Validation Shows Broken Links
- Visit the URL directly to verify access
- Check if video was deleted or made private
- Update URL if video was moved
- Remove video if no longer available

### Platform Not Detected
- System will fall back to "custom" platform
- Ensure URL is publicly accessible
- Video should support iframe embedding
- Contact admin if platform should be added

## Future Enhancements

Potential improvements for future versions:
- Automatic thumbnail extraction
- Video duration detection
- Batch video URL updates
- Video analytics integration
- Scheduled video validation checks
- Video transcription support
- Closed caption management

## Technical Notes

### URL Conversion Logic

The system automatically converts share URLs to embed URLs:

**YouTube:**
- From: `https://www.youtube.com/watch?v=VIDEO_ID`
- To: `https://www.youtube.com/embed/VIDEO_ID`

**Vimeo:**
- From: `https://vimeo.com/VIDEO_ID`
- To: `https://player.vimeo.com/video/VIDEO_ID`

**Loom:**
- From: `https://www.loom.com/share/VIDEO_ID`
- To: `https://www.loom.com/embed/VIDEO_ID`

**Synthesia:**
- URLs remain as provided (already in proper format)

### Embed Parameters

Default embed settings (stored in `embed_parameters` JSON):
```json
{
  "autoplay": false,
  "controls": true,
  "muted": false,
  "loop": false
}
```

These can be customized per scenario or option in future enhancements.

## Support

For issues or questions:
1. Check this guide first
2. Review error messages in the UI
3. Check browser console for technical errors
4. Validate video URLs are accessible
5. Contact system administrator if issues persist
