# CloudWatch Logs Access Guide for Your Amplify Next.js App

## Current Status Analysis

Based on your configuration files:

- ✅ You see "Next.js - SSR" in Amplify Console
- ⚠️ Your `next.config.mjs` is missing `output: 'standalone'`
- ⚠️ Your `amplify.yml` has no `compute` setting
- ❌ No `amplify/backend.ts` file (Gen 2 indicator)

**Conclusion:** You're likely on **Amplify Gen 1** with Amplify attempting SSR auto-detection, but it may not be fully functional.

## Step 1: Determine Your Amplify Generation

### Check in AWS Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click on your app
3. Look at the URL pattern:

**Gen 1 URL:**
```
https://[branch].[app-id].amplifyapp.com
Example: https://main.d12345abcde.amplifyapp.com
```

**Gen 2 URL:**
```
Same format, but you'll see "Gen 2" badge in the console
```

### Check Build Logs

In your Amplify app:
1. Click "Build settings" → Latest build
2. Look for these indicators:

**Gen 1 SSR Attempt:**
```
✓ Detected Next.js
✓ Building for server-side rendering
⚠️ Warning: SSR may have limited functionality
```

**Gen 2 Proper:**
```
✓ Creating Lambda function for SSR
✓ Setting up CloudFront distribution
✓ Deploying API routes
```

## Step 2: Access CloudWatch Logs

### Finding Your Log Groups

1. Open [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)
2. **IMPORTANT:** Select the correct AWS region (top-right dropdown)
   - Check where your Amplify app is deployed (usually `us-east-1` or `us-east-2`)
3. Click "Logs" → "Log groups" in left sidebar

### Log Group Naming Patterns

Look for these log groups (if on Gen 2 or proper SSR):

```
/aws/lambda/amplify-[app-id]-[branch]-server
/aws/lambda/amplify-[app-id]-[branch]-api
/aws/lambda/amplify-[app-id]-[branch]-edge
```

**Your specific pattern (replace with your app ID):**
```
/aws/lambda/amplify-d[your-app-id]-main-server
```

### If You Don't See Lambda Logs

This means one of these:

1. **You're on Gen 1 (most likely)** - No Lambda functions created
2. **No server-side code has executed yet** - Visit SSR pages first
3. **Wrong AWS region** - Check other regions

### Gen 1 Logs Location

If you're on Gen 1, logs are in a different place:

```
/aws/amplify/[app-id]
/aws/amplify/[app-id]/build
```

These show **build-time logs only**, not runtime logs.

## Step 3: Test If SSR is Actually Working

### Create a Test API Route

Add this file to test if API routes work:

**File: `src/app/api/test-ssr/route.ts`**

```typescript
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const serverTime = new Date().toISOString();

  console.log('=== API ROUTE CALLED ===');
  console.log('Server Time:', serverTime);
  console.log('Process ID:', process.pid);
  console.log('Node Version:', process.version);
  console.log('Environment:', process.env.NODE_ENV);

  return NextResponse.json({
    message: 'API route is working',
    serverTime,
    pid: process.pid,
    nodeVersion: process.version,
    env: process.env.NODE_ENV,
    isServerSide: true
  });
}
```

### Deploy and Test

1. Commit and push this file
2. Wait for Amplify build to complete
3. Visit: `https://[your-domain]/api/test-ssr`

**Expected Results:**

✅ **If SSR is working:**
```json
{
  "message": "API route is working",
  "serverTime": "2026-01-15T10:30:45.123Z",
  "pid": 123,
  "nodeVersion": "v20.18.0",
  "env": "production",
  "isServerSide": true
}
```
- The `serverTime` changes on each refresh
- You see logs in CloudWatch within 2-3 minutes

❌ **If SSR is NOT working:**
```
404 Not Found
or
502 Bad Gateway
or
Static response (same serverTime on every refresh)
```

## Step 4: Check Database Connectivity

### Test Database Connection from Server

**File: `src/app/api/test-db/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('=== DATABASE CONNECTION TEST ===');
    console.log('Attempting to connect...');

    const result = await sql`SELECT NOW() as current_time, version() as postgres_version`;

    console.log('✅ Database connection successful');
    console.log('Result:', result);

    return NextResponse.json({
      success: true,
      message: 'Database connected',
      data: result[0]
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

### Test It

1. Deploy the file
2. Visit: `https://[your-domain]/api/test-db`

**Expected Results:**

✅ **If database works:**
```json
{
  "success": true,
  "message": "Database connected",
  "data": {
    "current_time": "2026-01-15T10:30:45.123Z",
    "postgres_version": "PostgreSQL 15.3 on x86_64-pc-linux-gnu..."
  }
}
```

❌ **If database fails:**
```json
{
  "success": false,
  "error": "Connection timeout" // or other error
}
```

## Step 5: Access Real-Time Logs

### Using CloudWatch Live Tail

1. In CloudWatch, find your log group
2. Click the log group name
3. Click "Live tail" button (top right)
4. Visit your test endpoints
5. Watch logs appear in real-time

### Using AWS CLI (Faster)

```bash
# Install AWS CLI if not installed
# brew install awscli  # macOS
# apt install awscli   # Linux

# Configure credentials
aws configure

# Tail logs in real-time
aws logs tail /aws/lambda/amplify-[app-id]-main-server --follow

# Or filter for specific messages
aws logs tail /aws/lambda/amplify-[app-id]-main-server --follow --filter-pattern "ERROR"
```

## Step 6: What to Do Based on Results

### Scenario A: SSR is Working
✅ API routes return dynamic data
✅ Logs appear in CloudWatch
✅ Database connections work

**Action:** You're good! No migration needed. Just use the logs for debugging.

### Scenario B: SSR is Partially Working
⚠️ Some routes work, others don't
⚠️ Intermittent database errors
⚠️ Slow cold starts

**Action:** Consider migrating to Gen 2 properly for better performance and reliability.

### Scenario C: SSR is NOT Working
❌ API routes return 404
❌ No CloudWatch logs
❌ Database connections fail

**Action:** You MUST migrate to Gen 2. Follow the migration plan in `AMPLIFY_GEN2_MIGRATION_PLAN.md`.

## Quick Checklist

- [ ] Verified which Amplify generation you're on
- [ ] Found (or didn't find) CloudWatch log groups
- [ ] Created and tested `/api/test-ssr` endpoint
- [ ] Created and tested `/api/test-db` endpoint
- [ ] Checked if logs appear in CloudWatch
- [ ] Determined if migration to Gen 2 is needed

## Common Issues and Solutions

### Issue 1: No Logs Appearing

**Possible Causes:**
- Wrong AWS region selected
- No server-side code has executed yet
- On Gen 1 (no Lambda functions)

**Solutions:**
1. Check all AWS regions
2. Visit multiple pages/endpoints
3. Wait 5 minutes after visiting endpoints
4. Verify you're on Gen 2

### Issue 2: API Routes Return 404

**Possible Causes:**
- On Gen 1 (API routes not supported)
- Wrong route path
- Build failed

**Solutions:**
1. Check Amplify build logs for errors
2. Verify file is in correct location: `src/app/api/[route]/route.ts`
3. Migrate to Gen 2

### Issue 3: Database Connection Timeouts

**Possible Causes:**
- Lambda in different VPC than database
- Database not accessible from internet
- Connection string incorrect

**Solutions:**
1. Verify `DATABASE_URL` in Amplify environment variables
2. Check database firewall rules
3. Test connection locally first

## Next Steps

Based on your test results:

1. **If SSR works:** Document your log group names, set up monitoring
2. **If SSR doesn't work:** Follow `AMPLIFY_GEN2_MIGRATION_PLAN.md` to migrate
3. **If unsure:** Share your test results and I'll help diagnose

## Your App Details

Fill this out after testing:

```
App ID: _________________
AWS Region: _________________
Amplify Generation: Gen 1 / Gen 2 (circle one)
Log Group Found: Yes / No
API Routes Work: Yes / No
Database Connected: Yes / No

Test Results:
/api/test-ssr: ______________
/api/test-db: ______________

Decision: Need migration? Yes / No
```

---

**Want me to create these test files for you?** Let me know and I'll add them to your project.
