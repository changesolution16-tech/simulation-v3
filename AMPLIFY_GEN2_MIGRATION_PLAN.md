# AWS Amplify Gen 2 Migration Plan

## Overview

AWS Amplify Gen 2 is a complete redesign that supports Next.js SSR through serverless architecture. Unlike Gen 1 (static hosting only), Gen 2 automatically:
- Deploys SSR pages to AWS Lambda
- Handles API routes as Lambda functions
- Sets up CloudFront for CDN
- Manages environment variables and secrets
- Supports middleware and edge functions

## Key Differences: Gen 1 vs Gen 2

| Feature | Gen 1 (Current) | Gen 2 (Target) |
|---------|----------------|----------------|
| Hosting Type | Static files only | Full SSR support |
| API Routes | ❌ Not supported | ✅ Lambda functions |
| Server Components | ❌ Not supported | ✅ Lambda@Edge |
| Configuration | `amplify.yml` | Code-based (TypeScript) |
| Deployment | Git-based | Git-based |
| Runtime | Static HTML/JS | Node.js 20 on Lambda |
| Environment Variables | Build-time only | Build + Runtime |
| Cost Model | Static hosting | Lambda + CloudFront |

## Migration Steps

### Phase 1: Preparation (No Code Changes)

#### Step 1: Audit Current Setup
- [x] Verify all environment variables
- [x] Document current build process
- [x] Test local build (`npm run build`)
- [ ] Export current environment variables from Amplify console

#### Step 2: Backup Current Deployment
```bash
# Document current Amplify app settings
- App ID
- Environment variables
- Custom domain (if any)
- Build settings
- Access roles
```

### Phase 2: Configure Next.js for Gen 2

#### Step 1: Update `next.config.mjs`

**Current:**
```javascript
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};
```

**Update to:**
```javascript
const nextConfig = {
  output: 'standalone', // Required for Amplify Gen 2
  experimental: {
    outputFileTracingRoot: undefined, // Let Amplify handle this
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};
```

#### Step 2: Create Amplify Gen 2 Configuration

Create `amplify/backend.ts`:
```typescript
import { defineBackend } from '@aws-amplify/backend';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  // We're using external database (Supabase) so no backend resources needed
  // Gen 2 will auto-detect Next.js and configure SSR
});
```

Create `amplify/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "rootDir": ".",
    "outDir": "./dist",
    "lib": ["ES2022"],
    "declaration": true,
    "strict": true,
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["./**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### Step 3: Update Build Configuration

**Replace `amplify.yml` with:**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - node setup-env.js
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
compute:
  type: COMPUTE_MEDIUM # Required for SSR builds
```

### Phase 3: Install Amplify Gen 2 CLI

#### Step 1: Install Dependencies
```bash
npm install --save-dev @aws-amplify/backend @aws-amplify/backend-cli
```

#### Step 2: Update package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "amplify:sandbox": "ampx sandbox",
    "amplify:deploy": "ampx pipeline-deploy --branch main"
  }
}
```

### Phase 4: Configure Environment Variables

Gen 2 handles environment variables differently. You have two options:

#### Option A: AWS Systems Manager Parameter Store (Recommended)

Store secrets in AWS SSM Parameter Store:
```bash
aws ssm put-parameter \
  --name "/amplify/d12345abcde/main/DATABASE_URL" \
  --value "postgresql://..." \
  --type "SecureString"

aws ssm put-parameter \
  --name "/amplify/d12345abcde/main/NEXTAUTH_SECRET" \
  --value "your-secret" \
  --type "SecureString"
```

Then reference in Amplify:
```typescript
// amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { addEnvironmentVariablesFromParameterStore } from '@aws-amplify/backend/utils';

const backend = defineBackend({});

addEnvironmentVariablesFromParameterStore(backend, {
  DATABASE_URL: '/amplify/d12345abcde/main/DATABASE_URL',
  NEXTAUTH_SECRET: '/amplify/d12345abcde/main/NEXTAUTH_SECRET',
  // Add all other secrets
});
```

#### Option B: Keep Current setup-env.js Approach

Your current `setup-env.js` can continue working:
- Add secrets to Amplify environment variables in console
- `setup-env.js` runs during preBuild phase
- Generates `.env` file
- Next.js picks up variables at build and runtime

### Phase 5: Deploy to Amplify Gen 2

#### Step 1: Create New Amplify Gen 2 App

**Via AWS Console:**
1. Go to AWS Amplify Console
2. Click "Create new app"
3. Choose "Host web app"
4. Select "Gen 2" deployment type
5. Connect your Git repository
6. Amplify auto-detects Next.js configuration

**Via CLI:**
```bash
# Initialize Amplify Gen 2
npx ampx init

# Connect to Git
amplify add hosting

# Push to create app
git push
```

#### Step 2: Configure Environment Variables

In Amplify Console → App Settings → Environment Variables:

**Build-time variables:**
```
NEXT_PUBLIC_APP_URL=https://main.d12345abcde.amplifyapp.com
NEXT_PUBLIC_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Runtime secrets (for Lambda):**
```
DATABASE_URL=postgresql://user:pass@host/db
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://main.d12345abcde.amplifyapp.com
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=AKIAWAKSRPYDH5BTYQ4X
AWS_SECRET_ACCESS_KEY=TGEY09MsDRObncjvRXQzXYoWNUwx+Hla4oct6CX2
AWS_S3_BUCKET_NAME=soft-skills-videos
AWS_S3_PUBLIC_URL=https://soft-skills-videos.s3.us-east-2.amazonaws.com
```

#### Step 3: Configure Compute Resources

For SSR, you need more compute power:

1. Go to App Settings → Build settings
2. Set compute to **COMPUTE_MEDIUM** or higher
3. This provides:
   - 3 GB RAM
   - 2 vCPUs
   - Enough for database connections during build

#### Step 4: Deploy

```bash
# Push to trigger deployment
git add .
git commit -m "Migrate to Amplify Gen 2"
git push origin main
```

Amplify will automatically:
- Detect Next.js SSR
- Create Lambda functions for each route
- Set up CloudFront distribution
- Deploy API routes as Lambda functions
- Configure edge locations

### Phase 6: Verify Deployment

#### Check 1: Build Logs
```
✓ Downloading source code
✓ Running preBuild commands
✓ Installing dependencies
✓ Running build command
✓ Creating Lambda functions
✓ Deploying to CloudFront
✓ Deployment successful
```

#### Check 2: Test Routes
```bash
# Test static pages
curl https://main.d12345abcde.amplifyapp.com/login

# Test SSR pages
curl https://main.d12345abcde.amplifyapp.com/dashboard

# Test API routes
curl https://main.d12345abcde.amplifyapp.com/api/users/me
```

#### Check 3: Monitor Lambda Functions

In AWS Console → Lambda:
- Look for functions named like `amplify-d12345abcde-main-...`
- Check CloudWatch logs for errors
- Monitor cold start times

### Phase 7: Configure Custom Domain (Optional)

If you have a custom domain:

1. Go to App Settings → Domain management
2. Add custom domain
3. Amplify creates SSL certificate (ACM)
4. Update DNS records
5. Wait for propagation (5-10 minutes)

### Phase 8: Migrate Traffic

#### Blue-Green Deployment Strategy

1. **Keep Gen 1 running** (main traffic)
2. **Deploy Gen 2 to staging branch** first
3. **Test thoroughly** on staging URL
4. **Switch DNS** to Gen 2 when ready
5. **Monitor** for 24 hours
6. **Decomission Gen 1** after verification

#### DNS Migration

**If using custom domain:**
```
# Old (Gen 1)
yourdomain.com → d12345old.cloudfront.net

# New (Gen 2) - after testing
yourdomain.com → d12345new.amplifyapp.com
```

## Detailed File Changes

### 1. next.config.mjs
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // NEW: Required for Gen 2
  experimental: {
    outputFileTracingRoot: undefined, // NEW: Let Amplify handle
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
```

### 2. amplify/backend.ts (NEW FILE)
```typescript
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  // Using external Supabase database
  // Gen 2 auto-detects Next.js SSR
});

export default backend;
```

### 3. package.json (UPDATE)
```json
{
  "devDependencies": {
    "@aws-amplify/backend": "^1.0.0",
    "@aws-amplify/backend-cli": "^1.0.0",
    // ... existing deps
  }
}
```

### 4. amplify.yml (UPDATE)
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - node setup-env.js
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
compute:
  type: COMPUTE_MEDIUM # NEW: Required for SSR
```

## Cost Implications

### Gen 1 (Current)
- Static hosting: ~$0.15/GB served
- No compute costs
- Estimated: $5-20/month for typical usage

### Gen 2 (Target)
- Lambda compute: $0.20 per 1M requests
- Lambda duration: $0.0000166667 per GB-second
- CloudFront: $0.085/GB (first 10TB)
- Estimated: $20-100/month depending on traffic

**Cost factors:**
- More expensive for low traffic (Lambda cold starts)
- More cost-effective for high traffic
- SSR adds compute costs
- API routes count as Lambda invocations

## Rollback Plan

If Gen 2 deployment fails:

### Immediate Rollback
1. Keep Gen 1 app running during migration
2. DNS still points to Gen 1
3. No traffic impact

### If Gen 2 Has Issues After Go-Live
1. Update DNS back to Gen 1
2. Propagation: 5-10 minutes
3. Gen 1 continues serving traffic
4. Debug Gen 2 without pressure

## Timeline Estimate

| Phase | Duration | Complexity |
|-------|----------|------------|
| Preparation | 1 hour | Low |
| Configuration | 2 hours | Medium |
| Deployment | 1 hour | Medium |
| Testing | 2-4 hours | High |
| Migration | 1 hour | Low |
| **Total** | **7-9 hours** | **Medium** |

## Risks and Mitigations

### Risk 1: Environment Variables Not Working
**Mitigation:** Test all secrets in staging first, keep setup-env.js as backup

### Risk 2: Database Connection Limits
**Mitigation:** Postgres connection pooling already configured, monitor connections

### Risk 3: Cold Start Latency
**Mitigation:** Implement Lambda warming, use provisioned concurrency for critical paths

### Risk 4: Build Failures
**Mitigation:** Test build locally first, use same Node version (20.x)

### Risk 5: Cost Overruns
**Mitigation:** Set up billing alerts, monitor Lambda invocations, optimize functions

## Pre-Deployment Checklist

- [ ] Backup all environment variables from Gen 1
- [ ] Test build locally with `npm run build`
- [ ] Verify database connections work
- [ ] Document all custom configurations
- [ ] Create test plan for all critical features
- [ ] Set up monitoring and alerts
- [ ] Brief team on deployment timeline
- [ ] Schedule deployment during low-traffic window
- [ ] Prepare rollback procedure
- [ ] Update documentation

## Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test user authentication flow
- [ ] Check API routes respond correctly
- [ ] Test database operations
- [ ] Verify file uploads to S3
- [ ] Check logs for errors
- [ ] Monitor Lambda metrics
- [ ] Test from different geographic regions
- [ ] Update status page
- [ ] Communicate success to team

## Getting Help

### AWS Support Channels
- Amplify Discord: https://discord.gg/amplify
- AWS Support (if you have support plan)
- Amplify Documentation: https://docs.amplify.aws/nextjs/

### Common Issues
- **Lambda timeout:** Increase timeout in Amplify console (default 10s)
- **Memory issues:** Increase Lambda memory allocation
- **Cold starts:** Implement warming or provisioned concurrency
- **Database connections:** Check connection pool limits

## Next Steps

1. **Review this plan** - Make sure you understand each phase
2. **Set aside time** - Block 8-9 hours for migration
3. **Backup current setup** - Document everything
4. **Start with Phase 1** - Preparation and audit
5. **Test in staging first** - Never deploy directly to production

Would you like me to:
- Start implementing the configuration changes?
- Create a test environment first?
- Set up monitoring before migration?
