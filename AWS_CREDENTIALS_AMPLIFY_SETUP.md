# AWS Credentials Setup for Amplify

## Overview

AWS credentials (`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`) are now configured in the `.env` file and will be automatically detected by `setup-env.js` during Amplify builds.

## Local .env Configuration

The `.env` file now includes:

```env
# AWS S3 Configuration
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=AKIAWAKSRPYDH5BTYQ4X
AWS_SECRET_ACCESS_KEY=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
AWS_S3_BUCKET_NAME=soft-skills-videos
AWS_S3_PUBLIC_URL=https://soft-skills-videos.s3.us-east-2.amazonaws.com
```

## Amplify Console Setup

### Important: Store AWS Credentials as Secrets

AWS Amplify **does not allow** adding `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as plain environment variables for security reasons. They must be stored as secrets.

### How to Configure in Amplify Console

1. **Navigate to Secrets**:
   - Open AWS Amplify Console
   - Select your app
   - Go to **App settings** → **Environment variables**
   - Look for the "Secrets" section (separate from environment variables)

2. **Add AWS Credentials as Secrets**:
   ```
   Name: AWS_ACCESS_KEY_ID
   Value: AKIAWAKSRPYDH5BTYQ4X

   Name: AWS_SECRET_ACCESS_KEY
   Value: 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
   ```

3. **Add Other Variables as Environment Variables**:
   - `AWS_REGION` = `us-east-2`
   - `AWS_S3_BUCKET_NAME` = `soft-skills-videos`
   - `AWS_S3_PUBLIC_URL` = `https://soft-skills-videos.s3.us-east-2.amazonaws.com`
   - Plus all other variables (DATABASE_URL, NEXTAUTH_SECRET, etc.)

## How setup-env.js Handles This

The `setup-env.js` script:

1. **Reads `.env` file** and detects that `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are needed

2. **Searches Amplify environment** in multiple locations:
   - Direct environment variables (for AWS_REGION, etc.)
   - Secrets (for AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY)
   - AWS_APP_* prefixed variables
   - JSON secrets format

3. **Writes found variables** to `.env` during build

4. **Reports status**:
   ```
   ✓ AWS_REGION = us-east-2
   ✓ AWS_ACCESS_KEY_ID = AKIAWAKSRPYDH5BT...
   ✓ AWS_SECRET_ACCESS_KEY = TGEY09MsDRObncjvRX...
   ✓ AWS_S3_BUCKET_NAME = soft-skills-videos
   ✓ AWS_S3_PUBLIC_URL = https://soft-skills...
   ```

## Verification

After deploying to Amplify, check the build logs for:

```
=== Amplify Secrets Debug ===
Running in Amplify: Yes
Total environment variables: [number]
Found 18 variables in local .env file: DATABASE_URL, DB_HOST, ...
Total Amplify env variables: [number]
Found direct variable: AWS_REGION
Found direct variable: AWS_ACCESS_KEY_ID
Found direct variable: AWS_SECRET_ACCESS_KEY
...

✅ Successfully created .env file
📝 Variables written: 18 of 18 expected
📋 Variables found:
   ✓ AWS_REGION = us-east-2
   ✓ AWS_ACCESS_KEY_ID = AKIAWAKSRPYDH5BT...
   ✓ AWS_SECRET_ACCESS_KEY = TGEY09MsDRObncjvRX...
   ...

✅ All critical variables present
```

## Troubleshooting

### If AWS credentials are not found:

1. **Verify secrets are configured**:
   - Check Amplify Console → App settings → Environment variables
   - Ensure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are in the Secrets section

2. **Check build logs**:
   - Look for the "=== Amplify Secrets Debug ===" section
   - Check if variables are listed in "Variables found" or "Missing variables"

3. **Verify IAM permissions**:
   - Ensure Amplify service role has permission to access secrets
   - Check that the credentials are valid and have S3 access

### Common Issues

- **"Missing variables: AWS_ACCESS_KEY_ID"**: Secret not configured in Amplify Console
- **"Missing variables: AWS_SECRET_ACCESS_KEY"**: Secret not configured in Amplify Console
- **S3 access denied**: Credentials are correct but lack S3 permissions
- **Invalid credentials**: Credentials are expired or incorrect

## Security Best Practices

1. **Never commit actual credentials** to git (they're in .env which should be in .gitignore)
2. **Use IAM roles** when possible instead of access keys
3. **Rotate credentials regularly**
4. **Use least-privilege** IAM policies (only S3 access needed)
5. **Monitor access** through AWS CloudTrail

## Testing Locally

The credentials in your local `.env` file will be used during local development:

```bash
# Test local setup
node setup-env.js
# Output: Not running in Amplify environment. Skipping env setup.

# Build locally
npm run build
# Uses credentials from local .env file
```

## Complete Variable List

Total of 18 variables expected:

**Database**:
- DATABASE_URL
- DB_HOST
- DB_PORT
- DB_NAME
- DB_USER
- DB_PASSWORD

**Authentication**:
- NEXTAUTH_URL
- NEXTAUTH_SECRET

**AWS S3**:
- AWS_REGION
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_S3_BUCKET_NAME
- AWS_S3_PUBLIC_URL

**Application**:
- NEXT_PUBLIC_APP_URL
- NODE_ENV
- DISABLE_NATIVE_SWC

**Supabase**:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
