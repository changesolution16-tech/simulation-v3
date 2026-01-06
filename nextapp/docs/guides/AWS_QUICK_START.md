# AWS PostgreSQL 16 - Quick Start

## 🚀 5-Minute Setup

### 1. Create RDS Instance (AWS Console)
```
RDS → Create Database
- Engine: PostgreSQL 16.x
- Template: Free tier or Production
- Instance: db.t3.micro (dev) or db.t3.small (prod)
- Storage: 20 GB
- Public access: Yes (for setup)
- Initial database: softskills_db
```

**Save your endpoint**: `xxxxxxxxxxxx.us-east-1.rds.amazonaws.com`

### 2. Import Database
```bash
# Download file: aws-postgres-complete-backup.sql

# Connect and import
psql -h YOUR-ENDPOINT.rds.amazonaws.com \
     -U postgres \
     -d softskills_db \
     -f aws-postgres-complete-backup.sql

# Verify
psql -h YOUR-ENDPOINT.rds.amazonaws.com -U postgres -d softskills_db
softskills_db=> \dt
# Should show 23 tables
```

### 3. Update Application .env
```bash
DATABASE_URL=postgresql://postgres:PASSWORD@YOUR-ENDPOINT.rds.amazonaws.com:5432/softskills_db
```

### 4. Deploy Application
```bash
npm install
npm run build
# Deploy to EC2, Amplify, or Elastic Beanstalk
```

## ✅ Done!

---

## 📋 What's Included

**File**: `aws-postgres-complete-backup.sql` (19 KB)

**Contains**:
- ✅ 23 tables (all production-ready)
- ✅ Custom types and enums
- ✅ Indexes for performance
- ✅ Foreign key constraints
- ✅ Auto-update triggers
- ✅ Sample data (branding settings)

**Compatible with**:
- PostgreSQL 16.x (AWS RDS)
- PostgreSQL 15.x
- PostgreSQL 14.x

---

## 🔍 Verification

After import, run:
```sql
-- Count tables (expect 23)
SELECT count(*) FROM pg_tables WHERE schemaname = 'public';

-- List all tables
\dt

-- Check data
SELECT * FROM branding_settings;
```

---

## 🆘 Troubleshooting

### Can't connect?
1. Check security group allows port 5432
2. Use public access for initial setup
3. Verify endpoint address

### Import fails?
1. Ensure PostgreSQL 16.x
2. Check you have CREATE permissions
3. Database must be empty or use fresh database

### Need help?
See full guide: `AWS_DEPLOYMENT_GUIDE.md`

---

## 📦 Files

1. **aws-postgres-complete-backup.sql** - Database setup
2. **AWS_DEPLOYMENT_GUIDE.md** - Complete guide
3. **AWS_QUICK_START.md** - This file

---

**Time**: 5-10 minutes
**Cost**: ~$15-30/month (t3.micro/small)
**Status**: ✅ Production Ready
