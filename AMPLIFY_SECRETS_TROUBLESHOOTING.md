# Amplify Secrets Troubleshooting Guide

## Updated Script

The `setup-env.js` script has been updated with comprehensive debugging to help identify why secrets aren't being detected.

## What to Check in Build Logs

When you deploy to Amplify, look for the section that says `=== Amplify Secrets Debug ===` in the build logs. This will show you:

1. **Total environment variables available**
2. **All environment variable names** (this is the most important part)
3. **Which variables were found** and through which method

## Possible Scenarios

### Scenario 1: No Variables Found

If you see:
```
Found secret-related variables: None found
❌ Error: No secrets found in any format.
```

**Solution:** Your secrets aren't being exposed as environment variables. Check:
- Go to Amplify Console → Your App → Environment variables
- Make sure variables are added there (not just in Secrets Manager)
- Variables should be plain text in Amplify's environment variables section

### Scenario 2: Variables with Different Names

If you see variables in the "All env var names" list but they have different names than expected (e.g., `_DATABASE_URL` or `APP_DATABASE_URL`), the script will now capture them under "Found additional variable".

### Scenario 3: AWS_APP_* Prefix

If Amplify is using the Gen 2 pattern, variables might be prefixed with `AWS_APP_`. The script will automatically detect and strip this prefix.

### Scenario 4: Secrets vs Environment Variables

**Important:** In AWS Amplify, there's a difference between:

1. **Environment Variables** (App settings → Environment variables)
   - Plain text
   - Accessible during build
   - **This is what you need for this app**

2. **AWS Secrets Manager Secrets**
   - Encrypted
   - Requires special IAM permissions
   - Only accessible at runtime, not during build

**For this app to work, you need to add your secrets as Environment Variables in Amplify Console, not in AWS Secrets Manager.**

## How to Add Environment Variables in Amplify

1. Go to AWS Amplify Console
2. Select your app
3. Go to **App settings → Environment variables**
4. Click **Manage variables**
5. Add each variable one by one:
   - `DATABASE_URL` = `your-database-url`
   - `NEXTAUTH_SECRET` = `your-nextauth-secret`
   - `NEXTAUTH_URL` = `your-app-url`
   - etc.
6. Save changes
7. Redeploy your app

## Required Variables

The following variables are **required** for the app to work:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NEXTAUTH_URL` - Your app's URL

The following are **recommended**:

- `AWS_REGION` - AWS region for S3
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_S3_BUCKET_NAME` - S3 bucket name
- `NEXT_PUBLIC_APP_URL` - Your app's public URL

## Debugging Steps

1. **Check the build logs** for the debug output
2. **Look at "All env var names"** - this shows exactly what Amplify is providing
3. **Compare with required variables** - see what's missing
4. **Check the "Variables written" section** - see what actually made it to the .env file
5. **If DATABASE_URL is missing**, the script will specifically warn you

## Alternative: Use Amplify Gen 2 Backend

If you're using Amplify Gen 2 with a backend configuration, you can define secrets in your `amplify/backend.ts` file:

```typescript
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  // your backend config
});

// Add secrets
backend.addOutput({
  custom: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  }
});
```

But this still requires the environment variables to be set in the Amplify Console first.
