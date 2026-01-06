#!/bin/bash

# Quick Start Script for Next.js Migration
# This script helps you set up the development environment quickly

set -e

echo "🚀 Soft Skills Training Platform - Quick Start"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Check Node version
echo "📋 Step 1: Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18+ is required. You have Node.js $(node -v)"
    echo "   Please upgrade Node.js: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js version OK: $(node -v)"
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed (skipping)"
fi
echo ""

# Step 3: Check environment file
echo "⚙️  Step 3: Checking environment configuration..."
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Copying from .env.example..."
    cp .env.example .env.local
    echo "📝 Please edit .env.local with your credentials:"
    echo "   - DATABASE_URL (AWS RDS)"
    echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
    echo "   - AWS credentials"
    echo ""
    echo "Press Enter when you've configured .env.local..."
    read -r
else
    echo "✅ .env.local found"
fi
echo ""

# Step 4: Check database connection
echo "🗄️  Step 4: Testing database connection..."
if command -v psql &> /dev/null; then
    echo "Testing connection to AWS RDS..."
    # Note: Password contains special chars, so we need to prompt for it
    echo "Please enter your database password when prompted..."
    if psql "postgresql://postgres@simulation-1.ct8i4ag04imz.us-east-2.rds.amazonaws.com:5432/simulation_db" -c "SELECT 1" &> /dev/null; then
        echo "✅ Database connection successful"
    else
        echo "⚠️  Could not connect to database. Please verify:"
        echo "   - Database credentials in .env.local"
        echo "   - AWS RDS security group allows your IP"
        echo "   - Database is running"
    fi
else
    echo "⚠️  psql not found. Skipping database connection test."
    echo "   Install PostgreSQL client to test connection:"
    echo "   - macOS: brew install postgresql"
    echo "   - Ubuntu: sudo apt-get install postgresql-client"
fi
echo ""

# Step 5: Check AWS CLI
echo "☁️  Step 5: Checking AWS configuration..."
if command -v aws &> /dev/null; then
    if aws sts get-caller-identity &> /dev/null; then
        echo "✅ AWS CLI configured"
    else
        echo "⚠️  AWS CLI not configured. Run: aws configure"
    fi
else
    echo "⚠️  AWS CLI not installed. Install from: https://aws.amazon.com/cli/"
fi
echo ""

# Step 6: Build test
echo "🔨 Step 6: Testing build..."
if npm run build &> /dev/null; then
    echo "✅ Build successful"
else
    echo "⚠️  Build failed. Check for TypeScript errors:"
    npm run build
fi
echo ""

# Summary
echo "=============================================="
echo "✅ Quick Start Complete!"
echo ""
echo "📚 Next Steps:"
echo ""
echo "1. Start development server:"
echo "   npm run dev"
echo ""
echo "2. Open browser:"
echo "   http://localhost:3000"
echo ""
echo "3. Review documentation:"
echo "   - README.md - Quick start guide"
echo "   - MIGRATION_GUIDE.md - Full migration instructions"
echo "   - AWS_S3_SETUP.md - S3 configuration"
echo "   - DEPLOYMENT_GUIDE.md - Production deployment"
echo ""
echo "4. Set up AWS S3:"
echo "   aws s3 mb s3://soft-skills-videos --region us-east-2"
echo "   (See AWS_S3_SETUP.md for complete instructions)"
echo ""
echo "5. Migrate database schema:"
echo "   (See MIGRATION_GUIDE.md Step 3)"
echo ""
echo "=============================================="
echo ""
echo "Need help? Check the documentation files or visit:"
echo "- Next.js: https://nextjs.org/docs"
echo "- NextAuth: https://next-auth.js.org/"
echo "- Postgres.js: https://github.com/porsager/postgres"
echo ""
echo "Happy coding! 🚀"
