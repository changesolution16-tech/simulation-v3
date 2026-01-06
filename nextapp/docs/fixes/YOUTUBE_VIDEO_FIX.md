# YouTube Video Embed Fix - Complete

## Issues Fixed

### 1. Video List Not Showing Saved Videos
**Problem:** Videos were being saved but not appearing in the list
**Solution:**
- Expanded `loadVideos()` to query all video fields including `introduction_video_url`
- Added query to load feedback videos from `scenario_options` table
- Removed filter that was excluding scenarios without prompt videos
- Now loads: introduction, prompt, transition, and feedback videos (all difficulties)

### 2. YouTube Embed Code Not Working
**Problem:** Pasting iframe embed code was not being processed correctly
**Solutions Applied:**
- Fixed URL extraction from iframe embed codes
- Updated URL validation regex to handle query parameters (`?si=`, `?v=`, etc.)
- Simplified YouTube video ID extraction logic to avoid conflicts
- Always extract clean video ID and rebuild URL with proper parameters

### 3. Video URL Processing
**Improvements:**
- URL validation now allows `?`, `=`, `&` characters for query parameters
- Video ID extraction uses sequential checks (stops at first match)
- Generates clean embed URLs: `https://www.youtube.com/embed/{VIDEO_ID}?enablejsapi=1&rel=0`
- Removes any existing parameters and rebuilds with optimal settings

## Testing Your Video

Your embed code:
```html
<iframe width="560" height="315" src="https://www.youtube.com/embed/3UjuxXuk5XM?si=TiBuoQVcZSKxsWWO" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
```

**Extracted URL:** `https://www.youtube.com/embed/3UjuxXuk5XM?si=TiBuoQVcZSKxsWWO`

**Video ID:** `3UjuxXuk5XM`

**Clean Embed URL Generated:** `https://www.youtube.com/embed/3UjuxXuk5XM?enablejsapi=1&rel=0`

## How to Use

### Method 1: Paste Full Embed Code (Recommended)
1. Go to Admin Dashboard → Video Manager → Manage Videos
2. Select a scenario
3. Select video type (introduction, prompt, transition, or feedback)
4. Paste the ENTIRE iframe code into the video URL field
5. System will automatically extract the URL
6. Click Save

### Method 2: Paste Just the URL
1. Extract the URL from the iframe `src` attribute
2. Paste: `https://www.youtube.com/embed/3UjuxXuk5XM?si=TiBuoQVcZSKxsWWO`
3. System will clean and optimize it
4. Click Save

### Method 3: Use Watch URL
1. Get the YouTube watch URL: `https://www.youtube.com/watch?v=3UjuxXuk5XM`
2. Paste it
3. System will convert to embed format
4. Click Save

### Method 4: Use Short URL
1. Get the short URL: `https://youtu.be/3UjuxXuk5XM`
2. Paste it
3. System will convert to embed format
4. Click Save

## Testing Tools Available

### YouTube Test Tool (NEW)
Navigate to: **Admin Dashboard → Video Manager → YouTube Test**

Features:
- Live URL validation
- Video ID extraction test
- Platform detection
- Generated embed URL preview
- Live video preview
- Copy embed URL functionality
- Troubleshooting guidance

### Video Debugger
Navigate to: **Admin Dashboard → Video Manager → Debug Videos**

Features:
- Test any video URL
- Platform detection
- Embed accessibility check
- Domain restriction detection

## What Should Happen

1. **When you paste the embed code or URL:**
   - System extracts the video ID: `3UjuxXuk5XM`
   - Validates it's a proper 11-character YouTube ID
   - Generates clean embed URL
   - Shows green checkmark for valid URL
   - Displays platform badge: "YouTube"

2. **When you click Save:**
   - URL is saved to database
   - Success message appears
   - Video list automatically refreshes
   - Your video appears in the list

3. **When viewing the video:**
   - Video player shows YouTube logo
   - Video loads and plays
   - Full screen option works
   - Video is responsive

## Common Issues & Solutions

### Issue: "Invalid URL format"
**Solution:** The URL regex has been updated to accept query parameters. This should now work.

### Issue: Video saved but not in list
**Solution:** The video loading query has been expanded. All video types now appear.

### Issue: Blank video player
**Possible causes:**
1. Video is private or deleted
2. Video has embedding disabled
3. Domain restrictions (common on StackBlitz/Bolt)
4. Age-restricted content

**Test:** Open the embed URL in a new browser tab directly

### Issue: "Could not extract video URL"
**Solution:** Make sure you're pasting either:
- Full iframe code (starts with `<iframe`)
- Direct URL (starts with `http://` or `https://`)

## Video URL Formats Supported

All these will work:

1. **Watch URL:** `https://www.youtube.com/watch?v=3UjuxXuk5XM`
2. **Short URL:** `https://youtu.be/3UjuxXuk5XM`
3. **Embed URL:** `https://www.youtube.com/embed/3UjuxXuk5XM`
4. **With parameters:** `https://www.youtube.com/watch?v=3UjuxXuk5XM&t=10s`
5. **Iframe code:** `<iframe src="...">...</iframe>`
6. **V URL:** `https://www.youtube.com/v/3UjuxXuk5XM`
7. **E URL:** `https://www.youtube.com/e/3UjuxXuk5XM`

## Next Steps

1. Try the YouTube Test Tool first to verify your video works
2. Once confirmed, add it to your scenario
3. Preview the scenario to see the video in context
4. If issues persist, check browser console (F12) for specific errors

## Technical Details

**Generated Parameters:**
- `enablejsapi=1` - Enables JavaScript API for player control
- `origin={current_domain}` - Improves CORS compatibility
- `rel=0` - Prevents showing related videos from other channels

**iframe Attributes:**
- `allow`: accelerometer, autoplay, clipboard-write, encrypted-media, gyroscope, picture-in-picture, web-share
- `allowFullScreen`: Enabled
- `referrerPolicy`: strict-origin-when-cross-origin
- `sandbox`: allow-same-origin, allow-scripts, allow-forms, allow-popups, allow-presentation, allow-popups-to-escape-sandbox
