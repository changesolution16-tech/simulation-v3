# Video Player - Hybrid Approach

## Overview

The VideoPlayer component now intelligently supports **both direct video files AND platform embed URLs**. This gives you maximum flexibility in how you host and deliver videos.

## Supported Video Formats

### 1. Direct Video Files (HTML5 Player)
When you provide a direct video file URL, the player uses a custom HTML5 video tag with full controls.

**Supported formats:**
- MP4 (H.264) - Recommended
- WebM
- OGG

**Example URLs:**
```
https://your-cdn.com/videos/intro.mp4
https://storage.example.com/media/scenario-1.webm
https://yourdomain.com/videos/feedback.mp4
```

**Features:**
- Custom play/pause controls
- Volume control with mute
- Seekbar for time scrubbing
- Time display
- Fullscreen toggle
- Skip button
- Auto-hiding controls

---

### 2. Embedded Platform Videos (iframe Player)
When you provide a URL from supported platforms, the player automatically uses an iframe embed.

**Supported platforms:**
- **Synthesia** - https://share.synthesia.io/...
- **YouTube** - https://youtube.com/watch?v=... or https://youtu.be/...
- **Vimeo** - https://vimeo.com/...
- **Loom** - https://loom.com/share/...

**Features:**
- Native platform player
- Platform-specific controls
- Skip button overlay
- Automatic URL conversion to embed format

---

## How It Works

The VideoPlayer automatically detects the URL type and renders the appropriate player:

```
URL Provided → Detection Logic → Render Decision

Direct file (.mp4, .webm, etc.)
  ↓
HTML5 video player with custom controls

Platform URL (youtube.com, synthesia.io, etc.)
  ↓
iframe embed player
```

### Detection Logic

The player checks if the URL contains any of these patterns:
- `youtube.com/embed/` or `youtube.com/watch` or `youtu.be/`
- `player.vimeo.com` or `vimeo.com/`
- `loom.com/embed` or `loom.com/share`
- `synthesia.io` or `share.synthesia.io`

If **none** match → Uses HTML5 video player
If **any** match → Uses iframe embed player

---

## Admin Input Options

Admins can enter video content in **multiple formats**:

### Option 1: Direct URL
```
https://share.synthesia.io/abc123
```

### Option 2: Watch/Share URL
```
https://www.youtube.com/watch?v=nC-cRmW9ZV8
```

### Option 3: Complete Embed Code
```html
<iframe width="560" height="315" src="https://www.youtube.com/embed/nC-cRmW9ZV8?si=j0DI8VARuOIUaarA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
```

The system automatically:
1. Extracts the URL from embed code (if provided)
2. Converts watch URLs to embed URLs
3. Adds appropriate parameters (autoplay, etc.)
4. Renders the correct player type

---

## Automatic URL Conversion

### YouTube
**Input:**
```
https://www.youtube.com/watch?v=nC-cRmW9ZV8
https://youtu.be/nC-cRmW9ZV8
```

**Converted to:**
```
https://www.youtube.com/embed/nC-cRmW9ZV8?autoplay=1&enablejsapi=1&rel=0
```

### Vimeo
**Input:**
```
https://vimeo.com/123456789
```

**Converted to:**
```
https://player.vimeo.com/video/123456789?autoplay=1
```

### Loom
**Input:**
```
https://www.loom.com/share/abc123xyz
```

**Converted to:**
```
https://www.loom.com/embed/abc123xyz
```

### Synthesia
**Input:**
```
https://share.synthesia.io/embeds/videos/abc-123
```

**Used as-is** (already in embed format)

---

## Usage Examples

### Example 1: Synthesia Video (Most Common)
```tsx
<VideoPlayer
  videoUrl="https://share.synthesia.io/embeds/videos/abc-123"
  autoPlay={true}
  allowSkip={true}
  onComplete={() => console.log('Video completed')}
/>
```

Result: **iframe embed** with Synthesia player

### Example 2: Direct MP4 File
```tsx
<VideoPlayer
  videoUrl="https://cdn.example.com/videos/intro.mp4"
  autoPlay={true}
  allowSkip={true}
  onComplete={() => console.log('Video completed')}
/>
```

Result: **HTML5 video player** with custom controls

### Example 3: YouTube URL
```tsx
<VideoPlayer
  videoUrl="https://www.youtube.com/watch?v=nC-cRmW9ZV8"
  autoPlay={true}
  allowSkip={true}
  onComplete={() => console.log('Video completed')}
/>
```

Result: **iframe embed** with YouTube player

### Example 4: Embed Code (Extracted Automatically)
Admin pastes this:
```html
<iframe src="https://www.youtube.com/embed/nC-cRmW9ZV8" ...></iframe>
```

System extracts: `https://www.youtube.com/embed/nC-cRmW9ZV8`

Result: **iframe embed** with YouTube player

---

## Database Schema

Store the URL directly - no need for special formatting:

```sql
-- Scenario introduction videos
UPDATE scenarios
SET introduction_video_url = 'https://share.synthesia.io/embeds/videos/abc-123'
WHERE id = 'scenario-1';

-- Option feedback videos (Synthesia)
UPDATE scenario_options
SET feedback_video_url_beginner = 'https://share.synthesia.io/embeds/videos/beginner-feedback'
WHERE id = 'option-1';

-- Or use direct files
UPDATE scenarios
SET introduction_video_url = 'https://your-cdn.com/videos/intro.mp4'
WHERE id = 'scenario-2';

-- Or use YouTube
UPDATE scenarios
SET introduction_video_url = 'https://www.youtube.com/watch?v=abc123'
WHERE id = 'scenario-3';
```

The VideoPlayer handles all formats automatically.

---

## Comparison: HTML5 vs iframe

### HTML5 Video Player (Direct Files)

**Pros:**
- Full control over UI/UX
- Custom controls styling
- Better completion tracking
- No third-party dependencies
- Works offline (if cached)

**Cons:**
- Requires video hosting
- More bandwidth usage
- No adaptive bitrate (unless using HLS)

**Best for:**
- Self-hosted videos
- Full control needed
- Offline capability required

### iframe Embed Player (Platform URLs)

**Pros:**
- No hosting required
- Platform handles optimization
- Adaptive bitrate streaming
- Platform analytics
- Easy to update videos

**Cons:**
- Less control over UI
- Requires internet connection
- Subject to platform policies
- Limited completion tracking

**Best for:**
- Synthesia videos
- YouTube/Vimeo content
- Quick deployment
- No hosting infrastructure

---

## Recommendations by Use Case

### Scenario Introduction Videos
**Recommended:** Synthesia (iframe)
- Professional AI avatars
- Easy to create and update
- No hosting needed
```
https://share.synthesia.io/embeds/videos/scenario-intro
```

### Option Feedback Videos
**Recommended:** Synthesia (iframe)
- Quick to generate multiple variants
- Consistent quality across difficulty levels
```
feedback_video_url_beginner: https://share.synthesia.io/embeds/videos/feedback-1
feedback_video_url_intermediate: https://share.synthesia.io/embeds/videos/feedback-2
feedback_video_url_advanced: https://share.synthesia.io/embeds/videos/feedback-3
```

### Demo/Marketing Videos
**Option 1:** YouTube (iframe)
- Wider reach
- Easy sharing
```
https://www.youtube.com/watch?v=your-demo-video
```

**Option 2:** Direct file (HTML5)
- Professional presentation
- No YouTube branding
```
https://your-cdn.com/videos/demo.mp4
```

### Training Materials
**Recommended:** Direct files (HTML5)
- Better control
- Offline capability
- Custom branding
```
https://cdn.training.com/module-1.mp4
```

---

## Testing Your Setup

### Test 1: Synthesia URL
```
https://share.synthesia.io/embeds/videos/test-123
```
**Expected:** iframe player, video plays

### Test 2: YouTube URL
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```
**Expected:** iframe player, converts to embed URL

### Test 3: YouTube Embed Code
```html
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>
```
**Expected:** Extracts URL, iframe player

### Test 4: Direct MP4
```
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
```
**Expected:** HTML5 player with custom controls

---

## Troubleshooting

### Video Doesn't Play (iframe)
1. Check if URL is publicly accessible
2. Verify video allows embedding
3. Check browser console for errors
4. Try URL directly in browser

### Video Doesn't Play (HTML5)
1. Verify URL returns video file (not HTML page)
2. Check CORS headers are configured
3. Ensure HTTPS (not HTTP)
4. Try different format (MP4 vs WebM)

### Embed Code Not Working
1. Ensure complete `<iframe>` tag is pasted
2. Check URL is extracted correctly
3. Verify platform is supported

### Wrong Player Type
1. Check URL matches detection patterns
2. Verify URL spelling (e.g., `youtube.com` not `youtub.com`)
3. Clear browser cache

---

## Best Practices

1. **Use Synthesia for most simulation videos**
   - Professional quality
   - Easy to update
   - No hosting needed

2. **Use direct files for offline capability**
   - Training materials
   - Presentations
   - High-security content

3. **Use YouTube for public content**
   - Marketing videos
   - Demos
   - Tutorials

4. **Always provide skip button**
   - Some users may have seen videos before
   - Improves user experience

5. **Test on multiple devices**
   - Desktop browsers
   - Mobile devices
   - Different network speeds

6. **Monitor loading times**
   - Optimize video file sizes
   - Use CDN for direct files
   - Consider adaptive bitrate for large audiences

---

## Migration from Old System

If you have existing URLs, they will work automatically:

### Already Using Synthesia
```sql
-- No changes needed!
SELECT introduction_video_url FROM scenarios;
-- Result: https://share.synthesia.io/embeds/videos/abc-123
-- Will use iframe player ✅
```

### Using Direct Files
```sql
-- No changes needed!
SELECT introduction_video_url FROM scenarios;
-- Result: https://cdn.example.com/video.mp4
-- Will use HTML5 player ✅
```

### Using YouTube (Old Format)
```sql
-- Works but gets converted automatically
SELECT introduction_video_url FROM scenarios;
-- Result: https://www.youtube.com/watch?v=abc123
-- Converts to: https://www.youtube.com/embed/abc123 ✅
```

---

## Summary

The hybrid VideoPlayer gives you flexibility:

✅ **Synthesia videos** → iframe embed (recommended for simulations)
✅ **YouTube/Vimeo** → iframe embed (good for public content)
✅ **Direct files** → HTML5 player (best for offline/custom controls)
✅ **Embed codes** → Automatically extracted and embedded

**No configuration needed** - just paste the URL or embed code, and the player handles the rest!

---

## Example Admin Workflow

1. **Create video in Synthesia**
2. **Get share link:**
   ```
   https://share.synthesia.io/embeds/videos/abc-123
   ```
3. **Paste into scenario editor** (either URL or embed code)
4. **System automatically:**
   - Detects it's a Synthesia URL
   - Uses iframe player
   - Adds skip button
   - Handles autoplay
5. **Video plays perfectly in simulation** ✅

---

## Component API

```tsx
interface VideoPlayerProps {
  videoUrl: string;        // Any supported URL format
  videoType?: string;      // Optional type hint (not used in detection)
  onComplete?: () => void; // Callback when video ends
  onSkip?: () => void;     // Callback when skip button clicked
  autoPlay?: boolean;      // Auto-start playback (default: true)
  allowSkip?: boolean;     // Show skip button (default: true)
}
```

---

## Files Modified

- `src/components/simulation/VideoPlayer.tsx` - Hybrid player logic
- `src/components/video/VideoEmbedField.tsx` - Updated help text

---

## Support

For issues:
1. Check URL format matches examples
2. Test URL directly in browser
3. Review browser console for errors
4. Verify platform allows embedding
5. Check CORS for direct files
