# Soft Skills Training Platform

**Production ready in January 2026**

This is a comprehensive soft skills training platform built with Next.js, featuring interactive video-based simulations, competency tracking, and real-time feedback.

## Features

- Interactive video-based learning simulations
- Competency and metrics tracking
- Multi-language support (English & Spanish)
- Role-based access (Admin, Instructor, Learner)
- AWS S3 video storage integration
- Comprehensive analytics dashboard
- Bravin metrics integration
- Real-time progress tracking

## Database & Authentication Architecture

**IMPORTANT:** This application uses **AWS RDS PostgreSQL** for data persistence, NOT Supabase.

### Key Points:

- **Database:** AWS RDS PostgreSQL (not Supabase)
- **Authentication Table:** The `profiles` table handles all authentication
- **No Separate Auth Schema:** There is no `auth.users` table - all user data is in the `profiles` table
- **Password Hashing:** Uses bcrypt for password hashing
- **Session Management:** NextAuth.js with JWT strategy

### Authentication Flow:

1. User credentials are validated against the `profiles` table
2. Password is verified using bcrypt comparison
3. JWT token is issued via NextAuth.js
4. All user queries use the `profiles` table directly

### Profile Table Key Fields:

- `id` - UUID (auto-generated)
- `email` - User email (unique)
- `password_hash` - Bcrypt hashed password
- `full_name` - User's full name
- `username` - Generated from email
- `role` - User role (admin, instructor, learner)
- `is_active` - Account status
- `failed_login_attempts` - Security tracking
- `account_locked_until` - Temporary lock timestamp

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=your_database_url
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# AWS S3 Configuration
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_S3_PUBLIC_URL=your_s3_public_url

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Build

To create a production build:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## Project Structure

- `/src/app` - Next.js app router pages and API routes
- `/src/components` - React components
- `/src/contexts` - React context providers
- `/src/hooks` - Custom React hooks
- `/src/lib` - Utility functions and helpers
- `/src/translations` - Multi-language support files
- `/src/types` - TypeScript type definitions

## Documentation

Additional documentation can be found in the `/nextapp/docs` directory:

- Feature implementation guides
- Deployment guides
- Troubleshooting guides
- Database migration documentation

## Tech Stack

- Next.js 14
- TypeScript
- PostgreSQL
- NextAuth.js
- AWS S3
- Tailwind CSS
- React Query
- Framer Motion

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

## License

All rights reserved.
