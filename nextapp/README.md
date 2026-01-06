# Soft Skills Training Platform - Next.js + AWS RDS

## 🎯 Project Overview

This is the **Next.js migration** of your Soft Skills Training Platform, configured to use **AWS RDS PostgreSQL** instead of Supabase, with **AWS S3** for file storage.

## ✅ What's Been Created

### Core Infrastructure
- ✅ Next.js 14 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS styling
- ✅ Postgres.js database client
- ✅ NextAuth.js authentication
- ✅ AWS S3 integration
- ✅ Middleware for route protection
- ✅ Complete documentation

### Database Configuration
- ✅ Connection pool setup
- ✅ Helper functions for common queries
- ✅ AWS RDS connection configured
- ✅ Health check endpoint ready

### Authentication System
- ✅ Credentials-based login
- ✅ JWT session management
- ✅ Role-based access control (Admin, Instructor, Student)
- ✅ Account lockout protection
- ✅ Password hashing with bcryptjs

### File Storage
- ✅ AWS S3 client configured
- ✅ Upload/download utilities
- ✅ Signed URL generation
- ✅ File organization helpers

## 📁 Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/    # NextAuth API routes
│   │   ├── layout.tsx                  # Root layout
│   │   ├── page.tsx                    # Home page (redirects to login)
│   │   └── globals.css                 # Global styles
│   ├── components/
│   │   └── Providers.tsx               # Session provider
│   ├── lib/
│   │   ├── db.ts                       # Postgres.js connection
│   │   ├── db-helpers.ts               # Database query helpers
│   │   ├── auth.ts                     # NextAuth configuration
│   │   └── s3.ts                       # AWS S3 utilities
│   ├── types/
│   │   └── next-auth.d.ts              # NextAuth type extensions
│   └── middleware.ts                   # Route protection
├── public/                              # Static assets
├── .env.example                         # Environment template
├── package.json                         # Dependencies
├── tsconfig.json                        # TypeScript config
├── tailwind.config.ts                   # Tailwind config
├── next.config.mjs                      # Next.js config
├── MIGRATION_GUIDE.md                   # Complete migration instructions
├── AWS_S3_SETUP.md                      # S3 configuration guide
├── DEPLOYMENT_GUIDE.md                  # Production deployment guide
└── README.md                            # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Run from project root
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Your AWS RDS Database (ALREADY SET UP ✓)
DATABASE_URL=postgresql://postgres:$Sim#159>?@simulation-1.ct8i4ag04imz.us-east-2.rds.amazonaws.com:5432/simulation_db

# Generate NextAuth secret:
# openssl rand -base64 32
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000

# AWS S3 Credentials (YOU NEED TO SET UP)
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET_NAME=soft-skills-videos
```

### 3. Set up AWS S3

Follow the complete guide in `AWS_S3_SETUP.md`:

```bash
# Quick setup
aws s3 mb s3://soft-skills-videos --region us-east-2
# Then configure CORS and bucket policy (see full guide)
```

### 4. Migrate Database Schema

Run all Supabase migrations against your AWS RDS:

```bash
cd ..
psql "postgresql://postgres:\$Sim#159>?@simulation-1.ct8i4ag04imz.us-east-2.rds.amazonaws.com:5432/simulation_db" -f supabase/migrations/[migration-file].sql
```

Or use the helper script:

```bash
for migration in supabase/migrations/*.sql; do
  psql "$DATABASE_URL" -f "$migration"
done
```

### 5. Start Development Server

```bash
# Run from project root
npm run dev
```

Visit http://localhost:3000

## 📚 Documentation

### Complete Guides

1. **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Full migration instructions
   - Environment setup
   - Database migration
   - Component porting guide
   - API route creation
   - Troubleshooting

2. **[AWS_S3_SETUP.md](./AWS_S3_SETUP.md)** - S3 configuration
   - Bucket creation
   - CORS configuration
   - IAM permissions
   - CloudFront CDN setup
   - Security best practices
   - Cost optimization

3. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment
   - Vercel deployment
   - AWS Amplify setup
   - Docker + EC2 deployment
   - ECS Fargate deployment
   - Monitoring and logging
   - CI/CD pipelines

## 🔐 Security Features

- ✅ Password hashing (bcryptjs)
- ✅ JWT-based sessions
- ✅ Account lockout after failed attempts
- ✅ SQL injection protection (parameterized queries)
- ✅ CSRF protection (Next.js built-in)
- ✅ XSS protection (React sanitization)
- ✅ Secure HTTP headers
- ✅ Environment variable isolation

## 🗄️ Database

### Connection Details

- **Host**: `simulation-1.ct8i4ag04imz.us-east-2.rds.amazonaws.com`
- **Port**: `5432` (default PostgreSQL)
- **Database**: `simulation_db`
- **User**: `postgres`
- **Password**: `$Sim#159>?` (⚠️ Contains special characters - must be escaped in .env)

### Available Helper Functions

Located in `src/lib/db-helpers.ts`:

```typescript
// User Management
getUserByEmail(email: string)
getUserById(id: string)
updateLastLogin(userId: string)
incrementFailedLogins(userId: string)

// Simulations
getSimulationsByCategory(categoryId?: string)
getSimulationById(simulationId: string)
getScenariosBySimulation(simulationId: string)

// Instances & Responses
createSimulationInstance(data)
updateSimulationInstance(instanceId, data)
saveLearnerResponse(data)

// Metadata
getCategories()
getCompetencies()
```

## 🎨 Styling

- **Framework**: Tailwind CSS 3.4
- **Font**: Inter (Google Fonts)
- **Icons**: Lucide React (already configured in original app)
- **Components**: Port from `/src/components/` in original app

## 🔄 Migration Status

### ✅ Completed
- [x] Project structure
- [x] Database connection
- [x] Authentication system
- [x] S3 integration
- [x] Middleware
- [x] Type definitions
- [x] Documentation

### 📋 Todo (Your Next Steps)
- [ ] Port types from `src/types/index.ts`
- [ ] Create API routes for all operations
- [ ] Port React components
- [ ] Port authentication pages (Login, ResetPassword)
- [ ] Port dashboard pages
- [ ] Port simulation player
- [ ] Port admin panel
- [ ] Test thoroughly
- [ ] Deploy to production

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 🚢 Deployment

### Recommended: Vercel (Easiest)

```bash
npm i -g vercel
# Run from project root
vercel
```

See full guide in `DEPLOYMENT_GUIDE.md` for:
- Vercel deployment
- AWS Amplify
- Docker + EC2
- ECS Fargate

## 📊 Monitoring

### Health Check

The app includes a health check endpoint:

```
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test connection directly
psql "postgresql://postgres:\$Sim#159>?@simulation-1.ct8i4ag04imz.us-east-2.rds.amazonaws.com:5432/simulation_db" -c "SELECT 1"
```

### NextAuth Session Issues

Generate new secret:
```bash
openssl rand -base64 32
```

### S3 Upload Failures

Check:
1. AWS credentials in `.env.local`
2. Bucket policy allows uploads
3. CORS configured correctly
4. IAM user has `s3:PutObject` permission

## 📞 Support

### Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Postgres.js GitHub](https://github.com/porsager/postgres)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)

### Common Issues

See `MIGRATION_GUIDE.md` → Troubleshooting section

## 🔐 Environment Variables Reference

```env
# Database (Required)
DATABASE_URL=postgresql://...
DB_HOST=simulation-1.ct8i4ag04imz.us-east-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=simulation_db
DB_USER=postgres
DB_PASSWORD=$Sim#159>?

# NextAuth (Required)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-32-char-secret

# AWS S3 (Required for file uploads)
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET_NAME=soft-skills-videos
AWS_S3_PUBLIC_URL=https://...

# App (Required)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 📝 License

[Your License Here]

## 👥 Contributors

[Your Team]

---

## 🎯 Next Steps

1. **Read MIGRATION_GUIDE.md** - Understand the migration process
2. **Set up environment** - Configure `.env.local`
3. **Configure AWS S3** - Follow AWS_S3_SETUP.md
4. **Migrate schema** - Run database migrations
5. **Port components** - Migrate React components from original app
6. **Create API routes** - Build backend endpoints
7. **Test locally** - Verify everything works
8. **Deploy** - Follow DEPLOYMENT_GUIDE.md

---

**Questions?** Check the documentation files or open an issue.
