# AWS Amplify SSR Solution

## Current Problem

Your Next.js app is configured as a **full SSR (Server-Side Rendering)** application with:
- 39 pages/routes with `export const dynamic = 'force-dynamic'`
- API routes requiring Node.js runtime
- NextAuth session management
- Real-time database connections

**AWS Amplify Hosting Gen 1 only supports static sites** and cannot run SSR applications.

## Why Logs Are Failing

Amplify is trying to serve your `.next` build artifacts as static files, but:
1. Server components need Node.js runtime
2. API routes (`/api/*`) need a server to execute
3. Dynamic rendering can't happen without a server
4. Database connections fail because there's no runtime environment

## Solution Options

### Option 1: AWS Amplify Gen 2 with SSR Support (RECOMMENDED)

AWS Amplify Gen 2 supports Next.js SSR through AWS Lambda.

**Setup Steps:**

1. **Create new Amplify Gen 2 app**:
   ```bash
   npm create amplify@latest
   ```

2. **Update `next.config.mjs`**:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'standalone', // Required for Amplify Gen 2
     eslint: {
       ignoreDuringBuilds: true,
     },
     typescript: {
       ignoreBuildErrors: true,
     },
   };

   export default nextConfig;
   ```

3. **Update `amplify.yml`**:
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
   ```

4. **Deploy**:
   - Amplify Gen 2 automatically detects Next.js SSR
   - Creates Lambda functions for server-side rendering
   - Sets up CloudFront distribution
   - Handles API routes automatically

**Pros**:
- Full Next.js support (SSR, API routes, middleware)
- Automatic serverless infrastructure
- AWS integration
- Environment variables and secrets support

**Cons**:
- Requires migration to Gen 2
- Different deployment model
- May need to reconfigure secrets

---

### Option 2: Deploy to Vercel (EASIEST)

Vercel is built specifically for Next.js and handles everything automatically.

**Setup Steps:**

1. **Connect repository**:
   - Go to [vercel.com](https://vercel.com)
   - Import your Git repository
   - Vercel auto-detects Next.js

2. **Add environment variables**:
   - Go to Project Settings → Environment Variables
   - Add all variables from your `.env` file
   - AWS credentials can be added as regular environment variables

3. **Deploy**:
   - Vercel automatically builds and deploys
   - Handles SSR, API routes, and edge functions
   - Provides automatic HTTPS and CDN

**Pros**:
- Zero configuration for Next.js
- Automatic deployments on git push
- Best Next.js performance
- Free tier available

**Cons**:
- Different platform (not AWS)
- May have different pricing model

---

### Option 3: AWS Lambda + CloudFront (Manual SSR)

Deploy Next.js to AWS Lambda with CloudFront distribution.

**Setup Steps:**

1. **Update `next.config.mjs`**:
   ```javascript
   const nextConfig = {
     output: 'standalone',
     // ... other config
   };
   ```

2. **Build Docker container**:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --production
   COPY .next/standalone ./
   COPY .next/static ./.next/static
   COPY public ./public
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

3. **Deploy to AWS**:
   - Push container to ECR
   - Create Lambda function or ECS task
   - Configure CloudFront distribution
   - Set up API Gateway

**Pros**:
- Full control over infrastructure
- Stay within AWS ecosystem
- Cost-effective for high traffic

**Cons**:
- Complex manual setup
- Requires AWS infrastructure knowledge
- More maintenance

---

### Option 4: Convert to Static Export (NOT RECOMMENDED)

Convert app to static generation (SSG) by removing SSR.

**Why This Won't Work for Your App:**

Your app requires SSR because of:
1. **NextAuth sessions** - need server-side authentication
2. **API routes** - can't be static
3. **Database queries** - need runtime execution
4. **User-specific content** - requires server-side rendering
5. **Dynamic data** - can't be pre-rendered

**This option is NOT feasible for your application.**

---

## Recommended Action Plan

### For Immediate Fix: Deploy to Vercel

1. **Sign up at vercel.com**
2. **Import your GitHub repository**
3. **Add environment variables**:
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-secret
   AWS_REGION=us-east-2
   AWS_ACCESS_KEY_ID=AKIAWAKSRPYDH5BTYQ4X
   AWS_SECRET_ACCESS_KEY=TGEY09MsDRObncjvRXQzXYoWNUwx+Hla4oct6CX2
   AWS_S3_BUCKET_NAME=soft-skills-videos
   AWS_S3_PUBLIC_URL=https://soft-skills-videos.s3.us-east-2.amazonaws.com
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   NEXT_PUBLIC_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```
4. **Deploy** - Vercel handles everything automatically

**Result**: App will work correctly with full SSR support in under 5 minutes.

### For Long-term: Migrate to Amplify Gen 2

If you need to stay on AWS:
1. Keep current Vercel deployment running
2. Set up new Amplify Gen 2 project
3. Test thoroughly
4. Switch DNS when ready
5. Keep `setup-env.js` for Amplify secret handling

---

## What About Current Amplify Deployment?

Your current Amplify Gen 1 setup **cannot support this SSR application**. The build succeeds, but the app won't run correctly because:
- Pages requiring SSR return errors
- API routes return 404 or fail
- Authentication doesn't work
- Database connections fail

You must either:
1. Switch to a platform that supports SSR (Vercel, Amplify Gen 2)
2. Completely redesign the app to be static (not recommended)

---

## Quick Comparison

| Feature | Amplify Gen 1 | Amplify Gen 2 | Vercel | Lambda+CF |
|---------|--------------|---------------|---------|-----------|
| SSR Support | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| API Routes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| Setup Time | N/A | Medium | Fast | Slow |
| AWS Native | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| Cost | Low | Medium | Low | Variable |
| Maintenance | Low | Low | Lowest | High |

---

## Need Help?

1. **To deploy to Vercel now**: Let me know and I'll help configure it
2. **To migrate to Amplify Gen 2**: I'll update the config files
3. **To set up custom Lambda**: I'll create the infrastructure code

Choose based on:
- **Need it working now?** → Vercel
- **Must stay on AWS?** → Amplify Gen 2
- **Have DevOps resources?** → Lambda + CloudFront
