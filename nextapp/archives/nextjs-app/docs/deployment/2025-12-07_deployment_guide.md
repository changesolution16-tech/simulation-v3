# Deployment Guide - AWS Infrastructure

## Complete Production Deployment Guide

### Prerequisites

- AWS Account with appropriate permissions
- AWS RDS PostgreSQL instance running (✓ Already have: `simulation-1.ct8i4ag04imz.us-east-2.rds.amazonaws.com`)
- AWS S3 bucket configured
- Domain name (optional but recommended)

## Deployment Options

### Option 1: Vercel (Easiest - Recommended for Quick Deploy)

#### Advantages
- Zero DevOps configuration
- Automatic HTTPS
- Global CDN
- Preview deployments for PRs
- Environment variable management
- Free tier available

#### Setup

1. **Install Vercel CLI**:

```bash
npm install -g vercel
```

2. **Login to Vercel**:

```bash
vercel login
```

3. **Deploy**:

```bash
cd nextjs-app
vercel
```

4. **Configure Environment Variables**:

Go to Vercel Dashboard → Project Settings → Environment Variables

Add:
```
DATABASE_URL=postgresql://postgres:$Sim#159>?@simulation-1.ct8i4ag04imz.us-east-2.rds.amazonaws.com:5432/simulation_db
DB_HOST=simulation-1.ct8i4ag04imz.us-east-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=simulation_db
DB_USER=postgres
DB_PASSWORD=$Sim#159>?
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET_NAME=soft-skills-videos
AWS_S3_PUBLIC_URL=https://soft-skills-videos.s3.us-east-2.amazonaws.com
```

5. **Deploy to Production**:

```bash
vercel --prod
```

#### Custom Domain

In Vercel Dashboard:
1. Go to **Domains**
2. Add your domain
3. Configure DNS (Vercel provides instructions)

---

### Option 2: AWS Amplify (AWS-Native Solution)

#### Advantages
- Integrated with AWS ecosystem
- Built-in CI/CD
- Easy monitoring
- Works well with RDS/S3

#### Setup

1. **Go to AWS Amplify Console**: https://console.aws.amazon.com/amplify/

2. **New App** → **Host Web App**

3. **Connect Repository**:
   - Choose GitHub/GitLab/Bitbucket
   - Select repository
   - Select branch (main/production)

4. **Build Settings**:

Amplify should auto-detect Next.js. Verify `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd nextjs-app
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: nextjs-app/.next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

5. **Environment Variables**:

Add in Amplify Console → Environment Variables:

```
DATABASE_URL
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
NEXTAUTH_URL
NEXTAUTH_SECRET
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET_NAME
AWS_S3_PUBLIC_URL
```

6. **Deploy**: Amplify automatically deploys on git push

#### Custom Domain

1. Go to **Domain Management**
2. Add domain
3. Configure DNS records (Amplify provides instructions)

---

### Option 3: AWS EC2 + Docker (Full Control)

#### Advantages
- Complete control
- Can optimize costs
- Custom infrastructure
- Supports complex requirements

#### Setup

1. **Create Dockerfile**:

Create `/nextjs-app/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

2. **Update next.config.mjs**:

```javascript
const nextConfig = {
  output: 'standalone', // Important for Docker
  // ... rest of config
};
```

3. **Build Docker Image**:

```bash
cd nextjs-app
docker build -t soft-skills-app .
```

4. **Test Locally**:

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="your-connection-string" \
  -e NEXTAUTH_SECRET="your-secret" \
  soft-skills-app
```

5. **Push to ECR (Elastic Container Registry)**:

```bash
# Create ECR repository
aws ecr create-repository --repository-name soft-skills-app --region us-east-2

# Login to ECR
aws ecr get-login-password --region us-east-2 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-2.amazonaws.com

# Tag image
docker tag soft-skills-app:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-2.amazonaws.com/soft-skills-app:latest

# Push
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-2.amazonaws.com/soft-skills-app:latest
```

6. **Launch EC2 Instance**:

```bash
# Create security group
aws ec2 create-security-group \
  --group-name soft-skills-sg \
  --description "Security group for soft skills app" \
  --vpc-id YOUR_VPC_ID

# Allow HTTP/HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id YOUR_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id YOUR_SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Launch instance (t3.medium recommended)
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids YOUR_SG_ID \
  --user-data file://user-data.sh
```

7. **User Data Script** (`user-data.sh`):

```bash
#!/bin/bash
yum update -y
amazon-linux-extras install docker -y
service docker start
usermod -a -G docker ec2-user

# Install docker-compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Pull and run container
aws ecr get-login-password --region us-east-2 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-2.amazonaws.com

docker pull YOUR_ACCOUNT_ID.dkr.ecr.us-east-2.amazonaws.com/soft-skills-app:latest

docker run -d \
  --name soft-skills-app \
  --restart unless-stopped \
  -p 80:3000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-2.amazonaws.com/soft-skills-app:latest
```

8. **Set up Application Load Balancer**:

```bash
# Create load balancer
aws elbv2 create-load-balancer \
  --name soft-skills-alb \
  --subnets YOUR_SUBNET_1 YOUR_SUBNET_2 \
  --security-groups YOUR_SG_ID

# Create target group
aws elbv2 create-target-group \
  --name soft-skills-targets \
  --protocol HTTP \
  --port 80 \
  --vpc-id YOUR_VPC_ID \
  --health-check-path /api/health

# Register targets
aws elbv2 register-targets \
  --target-group-arn YOUR_TG_ARN \
  --targets Id=YOUR_INSTANCE_ID
```

---

### Option 4: AWS ECS Fargate (Serverless Containers)

#### Advantages
- No server management
- Auto-scaling
- Pay only for what you use
- High availability

#### Setup

1. **Create ECS Cluster**:

```bash
aws ecs create-cluster --cluster-name soft-skills-cluster --region us-east-2
```

2. **Create Task Definition**:

Create `task-definition.json`:

```json
{
  "family": "soft-skills-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "soft-skills-container",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-2.amazonaws.com/soft-skills-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-2:YOUR_ACCOUNT_ID:secret:db-url"
        },
        {
          "name": "NEXTAUTH_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-2:YOUR_ACCOUNT_ID:secret:nextauth-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/soft-skills-app",
          "awslogs-region": "us-east-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

3. **Create Service**:

```bash
aws ecs create-service \
  --cluster soft-skills-cluster \
  --service-name soft-skills-service \
  --task-definition soft-skills-app \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[YOUR_SUBNET_1,YOUR_SUBNET_2],securityGroups=[YOUR_SG_ID],assignPublicIp=ENABLED}"
```

---

## Database Security

### 1. Configure RDS Security Group

Your RDS instance should only accept connections from your app:

```bash
# Get your app's security group ID
APP_SG_ID="sg-xxxxx"

# Update RDS security group
aws ec2 authorize-security-group-ingress \
  --group-id YOUR_RDS_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $APP_SG_ID
```

### 2. Use SSL Connection

Update database connection string:

```typescript
// In src/lib/db.ts
const sql = postgres(process.env.DATABASE_URL, {
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./rds-ca-2019-root.pem').toString(),
  },
});
```

Download RDS CA certificate:

```bash
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O rds-ca-2019-root.pem
```

### 3. Rotate Database Password

```bash
# Generate new password
NEW_PASSWORD=$(openssl rand -base64 32)

# Update RDS
aws rds modify-db-instance \
  --db-instance-identifier simulation-1 \
  --master-user-password "$NEW_PASSWORD" \
  --apply-immediately

# Update environment variables in deployment platform
```

---

## Monitoring & Logging

### CloudWatch Setup

1. **Create Log Group**:

```bash
aws logs create-log-group --log-group-name /soft-skills/app
```

2. **Enable Application Logging**:

```typescript
// Add to your app
import winston from 'winston';
import CloudWatchTransport from 'winston-cloudwatch';

const logger = winston.createLogger({
  transports: [
    new CloudWatchTransport({
      logGroupName: '/soft-skills/app',
      logStreamName: 'application-logs',
      awsRegion: 'us-east-2',
    }),
  ],
});
```

### Application Insights

Install New Relic, Datadog, or use AWS X-Ray:

```typescript
// Add to next.config.mjs
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
};
```

Create `instrumentation.ts`:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const sdk = new NodeSDK({
      // X-Ray configuration
    });
    sdk.start();
  }
}
```

---

## Performance Optimization

### 1. Enable Next.js Caching

```typescript
// In page/route
export const revalidate = 60; // Revalidate every 60 seconds
```

### 2. Database Connection Pooling

Already configured in `src/lib/db.ts`:

```typescript
max: 10, // Maximum 10 connections
idle_timeout: 20, // Release idle connections after 20s
```

### 3. Enable CloudFront CDN

See AWS_S3_SETUP.md for CloudFront configuration.

### 4. Optimize Images

Use Next.js Image component:

```typescript
import Image from 'next/image';

<Image
  src="/path/to/image.jpg"
  width={800}
  height={600}
  alt="Description"
/>
```

---

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd nextjs-app
          npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build

      - name: Deploy to Vercel
        run: |
          npm i -g vercel
          vercel --token ${{ secrets.VERCEL_TOKEN }} --prod
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Health Checks

### Create Health Check Endpoint

`/app/api/health/route.ts`:

```typescript
import { healthCheck } from '@/lib/db';

export async function GET() {
  const dbHealthy = await healthCheck();

  if (!dbHealthy) {
    return Response.json(
      { status: 'unhealthy', database: 'down' },
      { status: 503 }
    );
  }

  return Response.json({
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
}
```

---

## Backup Strategy

### 1. RDS Automated Backups

```bash
aws rds modify-db-instance \
  --db-instance-identifier simulation-1 \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --apply-immediately
```

### 2. Manual Snapshot

```bash
aws rds create-db-snapshot \
  --db-instance-identifier simulation-1 \
  --db-snapshot-identifier simulation-1-snapshot-$(date +%Y%m%d)
```

### 3. S3 Backup

Enable versioning and cross-region replication (see AWS_S3_SETUP.md)

---

## Production Checklist

### Infrastructure
- [ ] RDS security group configured
- [ ] SSL enabled for database
- [ ] S3 bucket configured with CORS
- [ ] IAM roles properly configured
- [ ] Secrets stored in AWS Secrets Manager

### Application
- [ ] Environment variables set
- [ ] NEXTAUTH_SECRET generated
- [ ] Error tracking enabled
- [ ] Logging configured
- [ ] Health check endpoint working

### Security
- [ ] HTTPS enabled
- [ ] Database password rotated
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] CORS properly configured

### Monitoring
- [ ] CloudWatch alarms set up
- [ ] Log aggregation configured
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring enabled

### Backup & Recovery
- [ ] Automated database backups enabled
- [ ] S3 versioning enabled
- [ ] Disaster recovery plan documented
- [ ] Backup restoration tested

---

## Estimated Costs (Monthly)

### AWS Services
- **RDS db.t3.medium**: ~$60/month
- **EC2 t3.medium** (if used): ~$30/month
- **S3 Storage** (100 GB): ~$2.30/month
- **S3 Data Transfer**: Variable
- **Application Load Balancer**: ~$16/month

### Vercel
- **Free Tier**: $0
- **Pro**: $20/month
- **Enterprise**: Custom pricing

### Total Estimated Cost
- **Vercel + AWS**: $80-$100/month
- **Full AWS Stack**: $110-$150/month

---

## Support Resources

- **AWS Support**: https://aws.amazon.com/support/
- **Vercel Support**: https://vercel.com/support
- **Next.js Docs**: https://nextjs.org/docs
