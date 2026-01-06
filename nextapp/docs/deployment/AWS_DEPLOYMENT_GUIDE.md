# AWS Deployment Guide - PostgreSQL 16

## Quick Start (30 minutes)

### Prerequisites
- AWS account with RDS access
- PostgreSQL client (psql)
- Application source code

---

## Step 1: Create AWS RDS PostgreSQL 16 Instance (10 min)

### Via AWS Console:

1. **Go to RDS Dashboard**
   ```
   https://console.aws.amazon.com/rds/
   ```

2. **Create Database**
   - Click "Create database"
   - Engine: **PostgreSQL**
   - Version: **PostgreSQL 16.x**
   - Template: **Production** or **Dev/Test**

3. **Settings**
   ```
   DB instance identifier: softskills-db
   Master username: postgres
   Master password: [create strong password]
   ```

4. **Instance Configuration**
   ```
   DB instance class: db.t3.micro (free tier) or db.t3.small
   Storage: 20 GB SSD (gp3)
   Storage autoscaling: Enable (max 100 GB)
   ```

5. **Connectivity**
   ```
   VPC: Default or your VPC
   Public access: Yes (for initial setup)
   VPC security group: Create new or use existing
   ```

6. **Database Options**
   ```
   Initial database name: softskills_db
   Port: 5432
   Parameter group: default.postgres16
   ```

7. **Create Database** (wait 5-10 minutes)

8. **Note Your Endpoint**
   ```
   Example: softskills-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com
   ```

---

## Step 2: Configure Security Group (5 min)

1. **Go to EC2 → Security Groups**

2. **Find your RDS security group**

3. **Add Inbound Rule**
   ```
   Type: PostgreSQL
   Protocol: TCP
   Port: 5432
   Source:
     - Your IP (for setup): [Your IP]/32
     - Your App Server: [EC2 Security Group]
   ```

4. **Save rules**

---

## Step 3: Import Database (5 min)

### Option A: Using psql (Recommended)

```bash
# Connect to your AWS RDS instance
psql -h softskills-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d softskills_db

# Run the setup script
\i aws-postgres-complete-backup.sql

# Verify
SELECT count(*) FROM pg_tables WHERE schemaname = 'public';
-- Expected: 23 tables

\q
```

### Option B: Using pgAdmin

1. Open pgAdmin
2. Create new server connection:
   ```
   Host: softskills-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com
   Port: 5432
   Database: softskills_db
   Username: postgres
   Password: [your password]
   ```
3. Right-click database → Query Tool
4. Open file: `aws-postgres-complete-backup.sql`
5. Execute (F5)

---

## Step 4: Configure Application (5 min)

### Update .env file:

```bash
# AWS RDS PostgreSQL Connection
VITE_SUPABASE_URL=https://your-app-domain.com/api
DATABASE_URL=postgresql://postgres:[password]@softskills-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com:5432/softskills_db

# Note: You'll need to implement your own authentication
# Supabase-specific auth needs to be replaced with:
# - JWT authentication
# - AWS Cognito
# - Or custom auth solution
```

### Database Connection String Format:
```
postgresql://[username]:[password]@[endpoint]:5432/[database]
```

**Example**:
```
postgresql://postgres:MyStrongPass123@softskills-db.abc123.us-east-1.rds.amazonaws.com:5432/softskills_db
```

---

## Step 5: Create Application User (Security Best Practice)

```sql
-- Connect as postgres user
psql -h [your-endpoint] -U postgres -d softskills_db

-- Create application user
CREATE USER app_user WITH PASSWORD 'your-app-password-here';

-- Grant permissions
GRANT CONNECT ON DATABASE softskills_db TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL PRIVILEGES ON SEQUENCES TO app_user;
```

**Update your connection string**:
```
postgresql://app_user:your-app-password-here@[endpoint]:5432/softskills_db
```

---

## Step 6: Deploy Application to AWS

### Option A: AWS Elastic Beanstalk (Easiest)

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js-18 softskills-app --region us-east-1

# Create environment
eb create softskills-prod

# Set environment variables
eb setenv DATABASE_URL="postgresql://app_user:password@endpoint:5432/softskills_db"

# Deploy
eb deploy
```

### Option B: AWS EC2 (More Control)

1. **Launch EC2 Instance**
   - AMI: Amazon Linux 2023 or Ubuntu 22.04
   - Instance type: t3.small or larger
   - Security group: Allow HTTP (80), HTTPS (443), SSH (22)

2. **Install Node.js**
   ```bash
   # Amazon Linux 2023
   sudo dnf install nodejs npm -y

   # Ubuntu
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Deploy Application**
   ```bash
   # Upload your code
   scp -r ./project ec2-user@your-ec2-ip:~/

   # SSH into instance
   ssh ec2-user@your-ec2-ip

   # Install dependencies
   cd project
   npm install

   # Set environment variables
   export DATABASE_URL="postgresql://..."

   # Build
   npm run build

   # Install serve
   npm install -g serve

   # Run (or use PM2 for production)
   serve -s dist -l 3000
   ```

4. **Setup Nginx (Recommended)**
   ```bash
   sudo yum install nginx -y  # or apt-get on Ubuntu

   # Configure Nginx (see nginx config below)
   sudo nano /etc/nginx/conf.d/softskills.conf

   # Start Nginx
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

### Option C: AWS Amplify (Frontend Only)

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure
amplify configure

# Initialize
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

---

## Step 7: Setup SSL Certificate (Production)

### Using AWS Certificate Manager (ACM)

1. **Request Certificate**
   ```
   ACM → Request certificate
   Domain: yourdomain.com, www.yourdomain.com
   Validation: DNS or Email
   ```

2. **Validate Domain** (add DNS records or click email link)

3. **Attach to Load Balancer**
   ```
   EC2 → Load Balancers → Add HTTPS listener
   Certificate: Choose your ACM certificate
   ```

---

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificate (if not using ALB)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /home/ec2-user/project/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if you have backend)
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Database Connection Examples

### Node.js (PostgreSQL client)

```javascript
import pg from 'pg';

const pool = new pg.Pool({
  host: 'softskills-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'softskills_db',
  user: 'app_user',
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
```

### Using Environment Variables

```javascript
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
```

---

## Monitoring and Maintenance

### Enable CloudWatch Monitoring

1. **RDS Console → Your Database → Monitoring**
2. Enable Enhanced Monitoring
3. Set up CloudWatch Alarms:
   - CPU Utilization > 80%
   - Free Storage < 10 GB
   - Database Connections > 90%

### Automated Backups

1. **RDS Console → Your Database → Maintenance & backups**
2. Configure:
   ```
   Automated backups: Enabled
   Backup retention: 7-30 days
   Backup window: Choose off-peak time
   ```

### Create Manual Snapshots

```bash
aws rds create-db-snapshot \
    --db-instance-identifier softskills-db \
    --db-snapshot-identifier softskills-backup-$(date +%Y%m%d)
```

---

## Cost Optimization

### RDS Instance Sizing
- **Development**: db.t3.micro ($15/month)
- **Small Production**: db.t3.small ($30/month)
- **Medium Production**: db.t3.medium ($60/month)

### EC2 Instance Sizing
- **Small App**: t3.small ($15/month)
- **Medium App**: t3.medium ($30/month)

### Use Reserved Instances (1-year commitment = 40% savings)

---

## Troubleshooting

### Cannot Connect to Database

**Check Security Group**:
```bash
# Test connection
telnet softskills-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com 5432
```

**Check VPC and Subnets**:
- Ensure RDS and EC2 are in same VPC
- Check route tables

### SSL Connection Issues

```javascript
// Disable SSL verification (not recommended for production)
ssl: { rejectUnauthorized: false }

// Or provide AWS RDS certificate
ssl: {
  ca: fs.readFileSync('/path/to/rds-ca-2019-root.pem')
}
```

### Performance Issues

1. **Check Indexes**:
   ```sql
   SELECT schemaname, tablename, indexname
   FROM pg_indexes
   WHERE schemaname = 'public';
   ```

2. **Monitor Slow Queries**:
   ```sql
   -- Enable pg_stat_statements
   CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

   -- View slow queries
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

---

## Files Included

1. **aws-postgres-complete-backup.sql** (Required)
   - Complete schema for PostgreSQL 16
   - All table definitions
   - Indexes and constraints
   - Functions and triggers
   - Initial data (branding settings)

2. **AWS_DEPLOYMENT_GUIDE.md** (This file)
   - Step-by-step deployment instructions
   - Configuration examples
   - Troubleshooting guide

---

## Support Checklist

After deployment, verify:

- [ ] RDS instance is running
- [ ] Security group allows connections
- [ ] Database has 23 tables
- [ ] Application can connect to database
- [ ] SSL certificate is configured
- [ ] Backups are enabled
- [ ] CloudWatch monitoring is active
- [ ] Domain points to application
- [ ] HTTPS is working

---

## Quick Reference Commands

```bash
# Connect to database
psql -h [endpoint] -U app_user -d softskills_db

# Check tables
\dt

# Check database size
SELECT pg_size_pretty(pg_database_size('softskills_db'));

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Backup database
pg_dump -h [endpoint] -U postgres -d softskills_db > backup.sql

# Restore database
psql -h [endpoint] -U postgres -d softskills_db < backup.sql
```

---

**Status**: ✅ Ready for AWS Deployment
**PostgreSQL Version**: 16.x
**Estimated Setup Time**: 30 minutes
**Monthly Cost Estimate**: $45-$150 (depending on instance sizes)
