# Next.js Migration Guide - AWS RDS Edition

## Overview

This guide provides complete instructions for migrating your Soft Skills Training Platform from Supabase to Next.js with AWS RDS (PostgreSQL).

## What's Been Created

### ✅ Core Infrastructure (COMPLETED)

1. **Next.js 14 App Router Structure** (`/nextjs-app/`)
   - TypeScript configuration
   - Tailwind CSS setup
   - ESLint configuration

2. **Database Layer** (`/src/lib/`)
   - `db.ts` - Postgres.js connection pool
   - `db-helpers.ts` - Query helpers for common operations
   - Connection to AWS RDS: `simulation-1.ct8i4ag04imz.us-east-2.rds.amazonaws.com`

3. **Authentication System** (`/src/lib/auth.ts`)
   - NextAuth.js configured with Credentials provider
   - Session management with JWT
   - Role-based access control
   - Account lockout after 5 failed attempts
   - Password hashing with bcryptjs

4. **AWS S3 Integration** (`/src/lib/s3.ts`)
   - File upload/download
   - Signed URLs for secure access
   - Video and image storage utilities

5. **Middleware** (`/src/middleware.ts`)
   - Route protection
   - Admin/Teacher role enforcement
   - Automatic redirects

6. **API Route Structure**
   - NextAuth API route handler
   - Ready for custom API routes

## Migration Steps

### Step 1: Environment Setup

1. Copy `.env.example` to `.env.local`:

```bash
cd nextjs-app
cp .env.example .env.local
```

2. Update `.env.local` with your credentials:

```env
# Database - Your AWS RDS PostgreSQL
DATABASE_URL=postgresql://postgres:$Sim#159>?@simulation-1.ct8i4ag04imz.us-east-2.rds.amazonaws.com:5432/simulation_db
DB_HOST=simulation-1.ct8i4ag04imz.us-east-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=simulation_db
DB_USER=postgres
DB_PASSWORD='$Sim#159>?'

# NextAuth - Generate a secret key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-32-character-secret-here

# AWS S3 - Your S3 credentials
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET_NAME=soft-skills-videos
AWS_S3_PUBLIC_URL=https://soft-skills-videos.s3.us-east-2.amazonaws.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Step 2: Install Dependencies

```bash
cd nextjs-app
npm install
```

### Step 3: Database Migration

**IMPORTANT**: Your AWS RDS database already exists. You need to migrate your schema and data:

1. **Export from Supabase**:

```bash
# From your current project root
cd ..
node check-all-tables.mjs > supabase-data-export.json
```

2. **Import to AWS RDS**:

Run all migrations from `/supabase/migrations/` against your AWS RDS:

```bash
# Install PostgreSQL client
# For macOS:
brew install postgresql

# For Ubuntu/Debian:
sudo apt-get install postgresql-client

# Run migrations
for migration in supabase/migrations/*.sql; do
  psql "postgresql://postgres:\$Sim#159>?@simulation-1.ct8i4ag04imz.us-east-2.rds.amazonaws.com:5432/simulation_db" -f "$migration"
done
```

### Step 4: AWS S3 Setup

1. **Create S3 Bucket**:

```bash
aws s3 mb s3://soft-skills-videos --region us-east-2
```

2. **Configure Bucket Policy**:

Create file `s3-bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::soft-skills-videos/*"
    }
  ]
}
```

Apply policy:

```bash
aws s3api put-bucket-policy --bucket soft-skills-videos --policy file://s3-bucket-policy.json
```

3. **Enable CORS**:

Create file `s3-cors-config.json`:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Apply CORS:

```bash
aws s3api put-bucket-cors --bucket soft-skills-videos --cors-configuration file://s3-cors-config.json
```

### Step 5: Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output to your `.env.local` as `NEXTAUTH_SECRET`.

### Step 6: Test the Application

```bash
cd nextjs-app
npm run dev
```

Visit http://localhost:3000 and test:
- Login with admin account
- Database connectivity
- File uploads (if applicable)

### Step 7: Component Migration

Your original components are in `/src/components/`. You'll need to:

1. **Copy components to Next.js structure**:
   - Move `/src/components/*` to `/nextjs-app/src/components/`
   - Update imports to use Next.js patterns

2. **Update Supabase calls**:

**Before (Supabase)**:
```typescript
const { data, error } = await supabase
  .from('simulations')
  .select('*');
```

**After (Postgres.js via API route)**:
```typescript
// In API route: /app/api/simulations/route.ts
import sql from '@/lib/db';

export async function GET() {
  const simulations = await sql`SELECT * FROM simulations`;
  return Response.json(simulations);
}

// In component:
const response = await fetch('/api/simulations');
const simulations = await response.json();
```

3. **Update auth calls**:

**Before**:
```typescript
const { data: { session } } = await supabase.auth.getSession();
```

**After**:
```typescript
import { useSession } from 'next-auth/react';

const { data: session } = useSession();
```

### Step 8: Create API Routes

For each data operation, create an API route in `/app/api/`:

Example: `/app/api/simulations/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSimulationsByCategory } from '@/lib/db-helpers';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');

  const simulations = await getSimulationsByCategory(categoryId || undefined);

  return Response.json(simulations);
}
```

## Architecture Differences

### Supabase vs Next.js + AWS RDS

| Feature | Supabase | Next.js + AWS RDS |
|---------|----------|-------------------|
| **Authentication** | `supabase.auth` | NextAuth.js |
| **Database Queries** | Client-side with RLS | Server-side API routes |
| **File Storage** | Supabase Storage | AWS S3 |
| **Real-time** | Built-in subscriptions | Need custom WebSocket |
| **Row Level Security** | Database-level | API route-level |

## Database Helper Functions

Key functions in `/src/lib/db-helpers.ts`:

- `getUserByEmail(email)` - Get user profile
- `getUserById(id)` - Get user by ID
- `updateLastLogin(userId)` - Update login timestamp
- `getSimulationsByCategory(categoryId)` - Get simulations
- `getScenariosBySimulation(simulationId)` - Get scenarios
- `createSimulationInstance(data)` - Start simulation
- `saveLearnerResponse(data)` - Save learner choice
- `getCategories()` - Get all categories
- `getCompetencies()` - Get all competencies

## Security Best Practices

1. **Never expose database credentials client-side**
2. **Always validate sessions in API routes**:
   ```typescript
   const session = await getServerSession(authOptions);
   if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
   ```
3. **Use parameterized queries** (Postgres.js does this automatically)
4. **Validate all user inputs**
5. **Implement rate limiting** for authentication endpoints

## Deployment Options

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd nextjs-app
vercel
```

### Option 2: AWS Amplify

1. Connect GitHub repository
2. Set environment variables in AWS Console
3. Deploy automatically on push

### Option 3: Docker + AWS ECS

See `DOCKER_DEPLOYMENT.md` for full guide.

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql "postgresql://postgres:\$Sim#159>?@simulation-1.ct8i4ag04imz.us-east-2.rds.amazonaws.com:5432/simulation_db" -c "SELECT 1"
```

### S3 Upload Failures

Check:
1. AWS credentials are correct
2. Bucket policy allows uploads
3. CORS is configured
4. IAM user has s3:PutObject permission

### Authentication Issues

1. Verify `NEXTAUTH_SECRET` is set
2. Check database connection
3. Verify password hashing is working:

```typescript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('password', 10);
const isValid = await bcrypt.compare('password', hash);
console.log('Hash valid:', isValid);
```

## Performance Optimization

1. **Connection Pooling**: Already configured in `db.ts` (max: 10 connections)
2. **Caching**: Use Next.js built-in caching:
   ```typescript
   export const revalidate = 60; // Revalidate every 60 seconds
   ```
3. **Image Optimization**: Use Next.js Image component
4. **Code Splitting**: Automatic with Next.js App Router

## Next Steps

1. [ ] Complete environment variable setup
2. [ ] Run database migrations
3. [ ] Configure AWS S3
4. [ ] Port authentication pages
5. [ ] Port dashboard pages
6. [ ] Port simulation components
7. [ ] Port admin panel
8. [ ] Create all API routes
9. [ ] Test thoroughly
10. [ ] Deploy to production

## Support

For issues specific to:
- **Next.js**: https://nextjs.org/docs
- **Postgres.js**: https://github.com/porsager/postgres
- **NextAuth.js**: https://next-auth.js.org/
- **AWS S3**: https://docs.aws.amazon.com/s3/

## File Structure

```
nextjs-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── Providers.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   ├── db-helpers.ts
│   │   ├── auth.ts
│   │   └── s3.ts
│   ├── types/
│   │   └── next-auth.d.ts
│   └── middleware.ts
├── public/
├── .env.local
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```
