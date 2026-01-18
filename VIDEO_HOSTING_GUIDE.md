# Video Hosting Guide for Simulations

The VideoPlayer component has been updated to **only use HTML5 video tags** instead of iframes. This means you need to host your videos on a service that provides direct video file URLs.

## Why No iframes?

Iframes are often blocked by video providers (YouTube, Vimeo, etc.) due to CORS policies and content protection. The HTML5 video tag provides better control, works across all devices, and avoids embedding restrictions.

## Supported Video Formats

The VideoPlayer automatically tries multiple formats:
- **MP4** (H.264) - Best compatibility, recommended
- **WebM** - Good for modern browsers
- **OGG** - Fallback for older browsers

## Recommended Video Hosting Options

### 1. AWS S3 (Recommended)
**Pros**: Reliable, scalable, cost-effective, direct URLs
**Cost**: ~$0.023/GB storage + ~$0.09/GB transfer

Setup:
```bash
# Upload video to S3 bucket
aws s3 cp video.mp4 s3://your-bucket/videos/intro.mp4 --acl public-read

# Get direct URL
https://your-bucket.s3.amazonaws.com/videos/intro.mp4
```

Database entry:
```sql
UPDATE scenarios
SET introduction_video_url = 'https://your-bucket.s3.amazonaws.com/videos/intro.mp4'
WHERE id = 'scenario-id';
```

### 2. Cloudflare R2
**Pros**: Zero egress fees, S3-compatible API
**Cost**: $0.015/GB storage, $0 egress

Setup similar to S3, get public URL:
```
https://pub-xxxxxx.r2.dev/videos/intro.mp4
```

### 3. Cloudflare Stream
**Pros**: Optimized for video, adaptive bitrate
**Cost**: $1 per 1,000 minutes stored + $1 per 1,000 minutes delivered

Get direct download URL or use their HLS endpoint.

### 4. Bunny CDN
**Pros**: Fast, affordable, video optimization
**Cost**: $0.01/GB storage + $0.01-0.03/GB bandwidth

### 5. Vercel Blob Storage
**Pros**: Integrated with Vercel, easy setup
**Cost**: Free tier available, then pay-as-you-go

```javascript
import { put } from '@vercel/blob';
const blob = await put('intro.mp4', file, { access: 'public' });
// Use blob.url in database
```

### 6. Self-Hosted (Your Server)
**Pros**: Full control, no third-party
**Cons**: Bandwidth costs, server management

Place videos in `public/videos/` folder:
```
/public/videos/intro.mp4
```

URL: `https://yourdomain.com/videos/intro.mp4`

## Video Optimization Tips

### 1. Compress Videos
Use FFmpeg to optimize:
```bash
# Compress to 720p with good quality
ffmpeg -i input.mp4 -vf scale=-2:720 -c:v libx264 -crf 23 -preset slow -c:a aac -b:a 128k output.mp4

# For web optimization
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset slow -movflags +faststart output.mp4
```

### 2. Use Appropriate Resolutions
- **Introduction/Feedback videos**: 720p (1280x720) - good balance
- **Short clips**: 480p (854x480) - smaller size
- **High-quality demos**: 1080p (1920x1080) - larger files

### 3. Target Bitrates
- **720p**: 2-3 Mbps
- **480p**: 1-1.5 Mbps
- **1080p**: 4-5 Mbps

## Database Schema for Videos

Your database should store video URLs like this:

```sql
-- Scenario introduction videos
ALTER TABLE scenarios ADD COLUMN introduction_video_url TEXT;

-- Option-specific videos (difficulty-based)
ALTER TABLE scenario_options ADD COLUMN feedback_video_url_beginner TEXT;
ALTER TABLE scenario_options ADD COLUMN feedback_video_url_intermediate TEXT;
ALTER TABLE scenario_options ADD COLUMN feedback_video_url_advanced TEXT;

-- Simulation-level videos
ALTER TABLE simulations ADD COLUMN landing_video_url TEXT;
```

Example data:
```sql
UPDATE scenarios
SET introduction_video_url = 'https://your-cdn.com/videos/scenario-1-intro.mp4'
WHERE id = 'scenario-id';

UPDATE scenario_options
SET
  feedback_video_url_beginner = 'https://your-cdn.com/videos/option-1-beginner.mp4',
  feedback_video_url_intermediate = 'https://your-cdn.com/videos/option-1-intermediate.mp4',
  feedback_video_url_advanced = 'https://your-cdn.com/videos/option-1-advanced.mp4'
WHERE id = 'option-id';
```

## VideoPlayer Features

### Built-in Controls
- ▶️ Play/Pause button
- 🔊 Volume control with mute
- ⏩ Seekbar for video scrubbing
- ⏱️ Time display (current/total)
- ⛶ Fullscreen toggle
- ⏭️ Skip button (when enabled)

### Automatic Features
- Autoplay on load (if browser allows)
- Completion tracking
- Error handling with graceful fallback
- Multiple format support
- Mobile-friendly (playsInline)
- Responsive sizing

### Error Handling
If a video fails to load:
1. Error message displays
2. Option to skip and continue
3. Console logs the error
4. Simulation can continue

## Testing Your Videos

### 1. Test Video URL
Open the URL directly in a browser:
```
https://your-cdn.com/videos/test.mp4
```

Should:
- ✅ Play immediately
- ✅ Not require login
- ✅ Work in incognito mode
- ✅ Support seeking/scrubbing
- ❌ Not redirect to a webpage

### 2. Test in VideoPlayer
Create a test page:
```tsx
import VideoPlayer from '@/components/simulation/VideoPlayer';

export default function TestPage() {
  return (
    <VideoPlayer
      videoUrl="https://your-cdn.com/videos/test.mp4"
      autoPlay={true}
      allowSkip={true}
      onComplete={() => console.log('Video completed')}
    />
  );
}
```

### 3. Check CORS Headers
Video host must allow cross-origin requests:
```
Access-Control-Allow-Origin: *
```

For S3, ensure bucket policy allows:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::your-bucket/videos/*"
  }]
}
```

## Migration from YouTube/Vimeo

If you currently have YouTube/Vimeo URLs:

1. **Download videos** (if you have rights):
```bash
# Using yt-dlp
yt-dlp -f 'best[height<=720]' YOUR_YOUTUBE_URL
```

2. **Re-encode for web**:
```bash
ffmpeg -i downloaded.mp4 -c:v libx264 -crf 23 -preset slow -movflags +faststart web-ready.mp4
```

3. **Upload to your hosting**

4. **Update database**:
```sql
UPDATE scenarios
SET introduction_video_url = 'https://your-cdn.com/videos/web-ready.mp4'
WHERE introduction_video_url LIKE '%youtube%';
```

## Setting Up AWS S3 (Step-by-Step)

### 1. Create S3 Bucket
```bash
aws s3 mb s3://your-simulation-videos
```

### 2. Set Bucket Policy
Create `bucket-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::your-simulation-videos/*"
  }]
}
```

Apply:
```bash
aws s3api put-bucket-policy --bucket your-simulation-videos --policy file://bucket-policy.json
```

### 3. Configure CORS
Create `cors.json`:
```json
{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }]
}
```

Apply:
```bash
aws s3api put-bucket-cors --bucket your-simulation-videos --cors-configuration file://cors.json
```

### 4. Upload Videos
```bash
# Single file
aws s3 cp video.mp4 s3://your-simulation-videos/videos/intro.mp4 --acl public-read

# Entire directory
aws s3 sync ./videos s3://your-simulation-videos/videos/ --acl public-read
```

### 5. Get URLs
```
https://your-simulation-videos.s3.amazonaws.com/videos/intro.mp4
```

Or use CloudFront for faster delivery:
```
https://d1234567890abc.cloudfront.net/videos/intro.mp4
```

## Using Environment Variables

Store your CDN base URL in `.env`:
```
NEXT_PUBLIC_VIDEO_CDN_URL=https://your-cdn.com
```

Then construct URLs:
```typescript
const videoUrl = `${process.env.NEXT_PUBLIC_VIDEO_CDN_URL}/videos/${filename}`;
```

## Troubleshooting

### Video won't play
- ✅ Check URL is publicly accessible
- ✅ Verify CORS headers are set
- ✅ Test URL directly in browser
- ✅ Check video format (MP4 H.264 is safest)
- ✅ Ensure HTTPS (not HTTP)

### Video loads slowly
- Use CDN (CloudFront, Cloudflare, etc.)
- Compress videos more
- Use lower resolution
- Enable browser caching headers

### Autoplay doesn't work
- Some browsers block autoplay with sound
- Try muted autoplay first
- Provide clear play button (already included)

### Videos use too much bandwidth
- Use adaptive bitrate streaming (HLS/DASH)
- Compress more aggressively
- Use video CDN with compression
- Cache videos at edge locations

## Best Practices

1. **Always use HTTPS** for video URLs
2. **Optimize before uploading** - don't serve 4K videos for 720p display
3. **Use CDN** - faster load times, lower server costs
4. **Set appropriate cache headers** - videos rarely change
5. **Test on mobile** - bandwidth and CPU constraints
6. **Provide fallbacks** - skip button if video fails
7. **Monitor bandwidth costs** - especially with self-hosted
8. **Keep videos short** - 1-3 minutes ideal for simulations
9. **Use descriptive filenames** - easier to manage
10. **Version your videos** - `intro-v2.mp4` for updates

## Example: Complete Setup

```bash
# 1. Prepare video
ffmpeg -i raw-video.mov -vf scale=-2:720 -c:v libx264 -crf 23 -preset slow -movflags +faststart scenario-1-intro.mp4

# 2. Upload to S3
aws s3 cp scenario-1-intro.mp4 s3://my-simulations/videos/ --acl public-read

# 3. Get URL
echo "https://my-simulations.s3.amazonaws.com/videos/scenario-1-intro.mp4"

# 4. Update database
psql $DATABASE_URL -c "UPDATE scenarios SET introduction_video_url = 'https://my-simulations.s3.amazonaws.com/videos/scenario-1-intro.mp4' WHERE id = 'scenario-1';"

# 5. Test in app
# Navigate to scenario introduction page and verify video plays
```

## Cost Estimates

For a simulation with:
- 10 scenarios
- 3 options per scenario
- Average 2-minute videos
- 1,000 learners/month

### AWS S3 + CloudFront
- Storage: ~20GB @ $0.023/GB = $0.46/month
- Transfer: ~40TB @ $0.085/GB = $60/month
- **Total: ~$60/month**

### Cloudflare R2
- Storage: ~20GB @ $0.015/GB = $0.30/month
- Transfer: $0 (zero egress)
- **Total: ~$0.30/month** ✨

### Self-Hosted
- Storage: Included in server
- Bandwidth: ~40TB @ varies by host
- **Total: $100-500/month** (depends on host)

**Recommendation**: Start with Cloudflare R2 for best cost/performance.

## Need Help?

1. Check video URL works in browser
2. Verify CORS is configured
3. Test with a sample video first
4. Check browser console for errors
5. Review the VideoPlayer component error messages
