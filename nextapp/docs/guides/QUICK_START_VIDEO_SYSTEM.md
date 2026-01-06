# Quick Start: Video-Based Simulation System

## Getting Started in 5 Minutes

This guide will help you start using the new video-based simulation system immediately.

---

## Step 1: Apply the Database Migration

```bash
# The migration file has been created at:
# supabase/migrations/20251025040000_enhance_video_management_system.sql

# Apply it using Supabase CLI or through your Supabase dashboard
# This creates all necessary tables and functions
```

The migration will create:
- Video content references table
- Video templates table
- Video playlists system
- Enhanced video engagement tracking
- Helper functions for video management

---

## Step 2: Understanding the New Structure

### Core Concept: Centralized Video Library

Instead of storing video URLs directly in scenarios, you now:

1. **Add videos to the library** (once)
2. **Reference videos from scenarios** (many times)
3. **Update videos in one place** (affects all scenarios)

### Video Flow

```
Video Library (Central Repository)
    ↓
Video Content References (Links to entities)
    ↓
Scenarios/Options/Simulations (Uses videos)
```

---

## Step 3: Add Your First Video to the Library

### Using the Video Service

```typescript
import { VideoService } from './lib/videoService';

// Add a YouTube video
const video = await VideoService.createVideo({
  title: 'Customer Service Introduction',
  description: 'How to handle difficult customers',
  video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  video_type: 'introduction',
  difficulty: 'beginner',
  tags: ['customer-service', 'communication'],
  is_public: true
});

// The platform will be auto-detected as 'youtube'
console.log('Video ID:', video.id);
```

### Supported Video Sources

| Platform | Example URL | Auto-Detection |
|----------|-------------|----------------|
| YouTube | `youtube.com/watch?v=...` | ✅ Yes |
| Vimeo | `vimeo.com/123456` | ✅ Yes |
| Loom | `loom.com/share/...` | ✅ Yes |
| Synthesia | `synthesia.io/...` | ✅ Yes |
| Uploaded File | Supabase storage URL | ✅ Yes |
| Custom | Any other URL | Manual |

---

## Step 4: Assign Videos to Scenarios

### Assign a Video to Scenario Introduction

```typescript
import { VideoService } from './lib/videoService';

// Link video to scenario introduction
await VideoService.assignVideoToEntity(
  'video-library-id-here',        // From step 3
  'scenario_introduction',        // Entity type
  'scenario-id-here',             // Scenario ID
  {
    difficultyLevel: 'beginner',  // Optional: specific difficulty
    displayOrder: 0,               // Order if multiple videos
    isRequired: true,              // Must watch to proceed
    autoplay: true,                // Start automatically
    allowSkip: false,              // Can learner skip?
    minWatchPercentage: 80         // Required watch %
  }
);
```

### Entity Types Available

| Entity Type | Description | Use Case |
|-------------|-------------|----------|
| `scenario_introduction` | Video before scenario | Set context |
| `scenario_prompt` | Video showing the situation | Present challenge |
| `scenario_transition` | Video between scenarios | Story continuity |
| `option_feedback` | Video after option selection | Personalized feedback |
| `option_transition` | Video after option feedback | Next step setup |
| `simulation_landing` | Video on landing page | Course introduction |
| `simulation_closing` | Video on results page | Final summary |

---

## Step 5: Use the Enhanced Video Library Browser

### In Your Admin Components

```typescript
import EnhancedVideoLibraryBrowser from './components/admin/EnhancedVideoLibraryBrowser';

function MyScenarioBuilder() {
  const [showBrowser, setShowBrowser] = useState(false);

  const handleVideoSelect = (video) => {
    console.log('Selected video:', video);
    // Assign to your scenario/option
  };

  return (
    <>
      <button onClick={() => setShowBrowser(true)}>
        Select Video from Library
      </button>

      {showBrowser && (
        <EnhancedVideoLibraryBrowser
          onSelectVideo={handleVideoSelect}
          onClose={() => setShowBrowser(false)}
          filterVideoType="introduction"  // Optional filter
          mode="select"                    // or "manage"
        />
      )}
    </>
  );
}
```

### Browser Features

- **Search**: Find videos by title/description
- **Filter**: By platform, type, difficulty, tags
- **Sort**: By usage, engagement, date, alphabetical
- **Preview**: Watch videos before selecting
- **Batch Select**: Choose multiple videos at once

---

## Step 6: Track Video Engagement

### Automatic Tracking

The system automatically tracks when learners:
- Play videos
- Pause videos
- Skip videos
- Complete videos
- Rewind videos

### Manual Tracking (if needed)

```typescript
import { VideoService } from './lib/videoService';

await VideoService.trackVideoEngagement(
  'learner-id',
  'video-library-id',
  'video-url',
  'simulation-instance-id',
  {
    scenarioId: 'scenario-id',
    optionId: 'option-id',          // Optional
    videoType: 'feedback',
    eventType: 'complete',          // play, pause, skip, complete
    watchPercentage: 95
  }
);
```

---

## Step 7: View Video Analytics

### Get Video Statistics

```typescript
import { VideoService } from './lib/videoService';

const analytics = await VideoService.getVideoAnalytics('video-id');

console.log('Total Views:', analytics.totalViews);
console.log('Unique Viewers:', analytics.uniqueViewers);
console.log('Completion Rate:', analytics.avgCompletionRate);
console.log('Engagement Score:', analytics.avgEngagementScore);
console.log('Total Watch Time:', analytics.totalWatchTime);
```

### Get Learner's Video History

```typescript
const engagement = await VideoService.getLearnerVideoEngagement(
  'learner-id',
  'simulation-instance-id'  // Optional
);

engagement.forEach(record => {
  console.log('Video:', record.video_url);
  console.log('Watched:', record.max_percentage_watched, '%');
  console.log('Completed:', record.fully_completed);
  console.log('Skip Count:', record.skip_count);
});
```

---

## Step 8: Create Video Playlists

### For Multi-Part Content

```typescript
import { VideoService } from './lib/videoService';

// Create playlist
const playlist = await VideoService.createPlaylist({
  name: 'Customer Service Fundamentals',
  description: '3-part introduction series',
  playlist_type: 'introduction_sequence',
  autoplay_next: true,
  allow_skip_videos: false,
  require_sequential: true,
  is_public: true
});

// Add videos to playlist
await VideoService.addVideoToPlaylist(playlist.id, 'video-1-id', {
  sequenceOrder: 0,
  titleOverride: 'Part 1: First Impressions',
  isOptional: false,
  minWatchPercentage: 90
});

await VideoService.addVideoToPlaylist(playlist.id, 'video-2-id', {
  sequenceOrder: 1,
  titleOverride: 'Part 2: Active Listening',
  isOptional: false,
  minWatchPercentage: 90
});
```

---

## Step 9: Common Workflows

### Creating a Complete Video-Based Scenario

```typescript
// 1. Add videos to library
const introVideo = await VideoService.createVideo({
  title: 'Difficult Customer Scenario',
  video_url: 'https://youtube.com/...',
  video_type: 'introduction',
  difficulty: 'beginner'
});

const promptVideo = await VideoService.createVideo({
  title: 'Customer Confrontation',
  video_url: 'https://vimeo.com/...',
  video_type: 'prompt',
  difficulty: 'beginner'
});

const feedbackVideo1 = await VideoService.createVideo({
  title: 'Excellent Response Feedback',
  video_url: 'https://synthesia.io/...',
  video_type: 'feedback',
  difficulty: 'beginner'
});

// 2. Create scenario in database (using existing scenario creation)
// 3. Link videos to scenario

await VideoService.assignVideoToEntity(
  introVideo.id,
  'scenario_introduction',
  scenarioId,
  { autoplay: true, allowSkip: false }
);

await VideoService.assignVideoToEntity(
  promptVideo.id,
  'scenario_prompt',
  scenarioId,
  { autoplay: true, allowSkip: true }
);

// 4. Link feedback videos to options

await VideoService.assignVideoToEntity(
  feedbackVideo1.id,
  'option_feedback',
  optionId,
  { difficultyLevel: 'beginner', autoplay: true }
);
```

---

## Step 10: Integration with Existing Components

### Update Your Scenario Builder

```typescript
// Instead of direct URL input:
<input
  type="text"
  placeholder="Video URL"
  value={videoUrl}
  onChange={e => setVideoUrl(e.target.value)}
/>

// Use the enhanced browser:
<button onClick={() => setShowVideoBrowser(true)}>
  Select from Video Library
</button>

{showVideoBrowser && (
  <EnhancedVideoLibraryBrowser
    onSelectVideo={video => {
      // Store video reference instead of URL
      setSelectedVideoId(video.id);
      setShowVideoBrowser(false);
    }}
    onClose={() => setShowVideoBrowser(false)}
    filterVideoType="introduction"
  />
)}
```

### Retrieve Videos for Display

```typescript
// Get all videos for a scenario
const videos = await VideoService.getVideosForEntity(
  'scenario_introduction',
  scenarioId,
  'beginner'  // difficulty
);

videos.forEach(ref => {
  console.log('Video:', ref.video.title);
  console.log('Required:', ref.is_required);
  console.log('Autoplay:', ref.autoplay);
  console.log('URL:', ref.video.video_url);
});
```

---

## Troubleshooting

### Video Not Playing

1. **Check URL format**: Use full URLs with protocol (https://)
2. **Verify platform detection**: Use `VideoService.detectPlatform(url)`
3. **Test embed URL**: Use `VideoService.getEmbedUrl(url, platform)`
4. **Check video privacy**: Ensure video is publicly accessible

### Video Not in Library

1. **Verify creation**: Check return value from `createVideo()`
2. **Check filters**: Disable all filters in browser
3. **Verify is_active**: Ensure video wasn't soft-deleted
4. **Check RLS policies**: Verify user has permission

### Engagement Not Tracking

1. **Check function exists**: Verify `track_video_engagement` function
2. **Check parameters**: All required params must be provided
3. **Check RLS**: User must have insert permission
4. **Check instance ID**: Ensure simulation instance exists

---

## Next Steps

1. **Migrate Existing Videos**: Move current video URLs to library
2. **Create Templates**: Build reusable scenario templates
3. **Build Playlists**: Group related videos
4. **Monitor Analytics**: Track video effectiveness
5. **Optimize Content**: Use engagement data to improve videos

---

## Support & Resources

- **Full Documentation**: See `VIDEO_BASED_SIMULATION_IMPLEMENTATION.md`
- **Database Schema**: Check migration file for table structures
- **API Reference**: Review `videoService.ts` for all available methods
- **Component Examples**: See `EnhancedVideoLibraryBrowser.tsx`

---

## Quick Reference

### Most Used Functions

```typescript
// Video Management
VideoService.getVideoLibrary(filters)
VideoService.createVideo(data)
VideoService.updateVideo(id, updates)

// Video Assignment
VideoService.assignVideoToEntity(videoId, entityType, entityId, options)
VideoService.getVideosForEntity(entityType, entityId, difficulty)

// Analytics
VideoService.trackVideoEngagement(learnerId, videoId, url, instanceId, context)
VideoService.getVideoAnalytics(videoId)

// Utilities
VideoService.detectPlatform(url)
VideoService.getEmbedUrl(url, platform)
VideoService.validateVideoUrl(url)
```

---

## Success!

You now have a fully functional video-based simulation system with:
- ✅ Centralized video management
- ✅ Flexible video assignments
- ✅ Comprehensive analytics
- ✅ Enhanced user experience
- ✅ Scalable architecture

Happy building! 🎥🎓
