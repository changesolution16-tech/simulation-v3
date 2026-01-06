# Critical Deployment Steps - MUST READ

## ⚠️ IMMEDIATE ACTIONS REQUIRED

### 1. Rotate Supabase Credentials (CRITICAL - DO FIRST)
Your Supabase credentials are currently exposed in the repository history.

**Steps:**
1. Go to Supabase Dashboard: https://app.supabase.com
2. Navigate to Project Settings > API
3. Click "Generate new anon key" or "Reset project API keys"
4. Update your `.env` file with new credentials:
   ```
   VITE_SUPABASE_URL=<your-url>
   VITE_SUPABASE_ANON_KEY=<new-anon-key>
   ```
5. Update production environment variables immediately
6. Consider rotating the service role key as well

**Why this is critical:**
Anyone with repository access can use the old credentials to access your database.

---

### 2. Run Database Migrations
Apply the new security migrations to your database.

**Steps:**
```bash
# Connect to your Supabase project
npx supabase link --project-ref <your-project-ref>

# Apply migrations
npx supabase db push
```

**Or manually via Supabase Dashboard:**
1. Go to SQL Editor in Supabase Dashboard
2. Run these migrations in order:
   - `20251031010000_fix_security_performance_issues.sql`
   - `20251031020000_optimize_rls_policies.sql`
   - `20251031050000_comprehensive_security_hardening.sql`

---

### 3. Test LTI Integration
The JWT verification now requires proper JWKS configuration.

**Required for each LTI deployment:**
```sql
-- Ensure jwks_url is set in lti_deployments table
UPDATE lti_deployments
SET jwks_url = 'https://your-lms.edu/.well-known/jwks.json'
WHERE issuer = 'https://your-lms.edu';
```

**Test checklist:**
- [ ] LTI launch with valid token succeeds
- [ ] LTI launch with forged token fails
- [ ] LTI launch with expired token fails
- [ ] User creation/mapping works correctly

---

### 4. Configure Security Headers
Add these headers to your deployment platform (Vercel, Netlify, etc.).

**For Vercel (vercel.json):**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        }
      ]
    }
  ]
}
```

---

### 5. Update Environment Variables
Ensure all production environments have the correct variables.

**Required Variables:**
```bash
VITE_SUPABASE_URL=<your-new-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-new-anon-key>
```

**Verify they're set:**
- Development: `.env` file (never commit!)
- Staging: Platform environment variables
- Production: Platform environment variables

---

## Post-Deployment Verification

### Test Authentication
```bash
# 1. Valid login should work
# 2. Invalid credentials should fail with clear message
# 3. 6th failed attempt should trigger rate limit
# 4. Rate limit message should show time remaining
```

### Test LTI Launches
```bash
# 1. Launch from LMS should work
# 2. Check browser console for any JWT errors
# 3. Verify user is created/logged in
# 4. Verify course context is synced
```

### Monitor Errors
Check your application logs for:
- `[JWT Verification]` errors
- `[LTI]` errors
- `[SecureStorage]` errors
- Rate limit blocks

---

## Rollback Plan

If issues occur after deployment:

**Quick Rollback:**
1. Revert to previous deployment
2. Restore old Supabase keys temporarily
3. Investigate issues
4. Re-deploy when fixed

**Database Rollback:**
```sql
-- If needed, drop the security constraints
-- (Not recommended - fix issues instead)
```

---

## Security Monitoring

### Set Up Alerts
Monitor these metrics:
- Failed login attempts > 10/hour
- Rate limit blocks > 5/hour
- JWT verification failures
- Inactive account login attempts

### Regular Checks
- [ ] Weekly: Review failed authentication logs
- [ ] Monthly: Check for unusual access patterns
- [ ] Quarterly: Rotate Supabase credentials
- [ ] Yearly: Full security audit

---

## Getting Help

### If LTI Authentication Fails
1. Check Supabase logs for JWT errors
2. Verify `jwks_url` is correctly set
3. Test JWKS endpoint is accessible
4. Verify LTI platform is sending RS256 tokens

### If Rate Limiting is Too Strict
Adjust in `src/lib/rateLimiter.ts`:
```typescript
const RATE_LIMIT_CONFIG = {
  maxAttempts: 10,        // Increase from 5
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 5 * 60 * 1000,  // Reduce to 5 minutes
};
```

### If Users Get Locked Out
Reset rate limit in browser console:
```javascript
sessionStorage.clear();
```

Or server-side:
```sql
DELETE FROM auth_rate_limits WHERE identifier = 'user@example.com';
```

---

## Success Criteria

Deployment is successful when:
- ✅ All users can log in normally
- ✅ LTI launches work from LMS
- ✅ Rate limiting blocks after 5 attempts
- ✅ No JWT verification errors in logs
- ✅ Old Supabase credentials are revoked
- ✅ Security headers are present in responses

---

## Timeline

**Immediate (Within 1 hour):**
- Rotate Supabase credentials
- Deploy new code
- Run database migrations

**Same Day:**
- Test all authentication flows
- Monitor error logs
- Verify security headers

**Within 1 Week:**
- Review security monitoring
- Gather user feedback
- Address any issues

---

## Questions?

Review these documents:
1. `SECURITY_IMPLEMENTATION_SUMMARY.md` - Detailed security changes
2. Migration files in `supabase/migrations/`
3. Security modules in `src/lib/`

**Remember:** Security is not a one-time task. Regular monitoring and updates are essential.
