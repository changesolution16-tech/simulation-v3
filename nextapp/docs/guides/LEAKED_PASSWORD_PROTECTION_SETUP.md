# Leaked Password Protection Setup Guide

## Quick Setup (5 Minutes)

### What This Does
Prevents users from using passwords that have been compromised in data breaches by integrating with the HaveIBeenPwned.org database.

### Requirements
- ✅ Supabase Pro Plan or higher
- ✅ Access to Supabase Dashboard

### Setup Steps

#### Step 1: Access Your Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project from the list

#### Step 2: Navigate to Authentication Settings
1. Click **"Authentication"** in the left sidebar
2. Click the **"Policies"** or **"Configuration"** tab
3. Look for the **"Password Protection"** or **"Password Security"** section

#### Step 3: Enable Leaked Password Protection
1. Find the **"Leaked password protection"** toggle
2. Switch it to **ON** (enabled)
3. Save changes if prompted

#### Step 4: Verify It's Working

**Test with a Known Compromised Password**:

```javascript
// This should fail with error
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123' // Known compromised password
});

// Expected error response:
// {
//   message: "Password has been leaked",
//   status: 422
// }
```

**Test with a Secure Password**:

```javascript
// This should succeed
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'X9k#mP2$nQ7@wL5!' // Strong, unique password
});

// Should succeed with no error
```

### Configuration Details

#### Dashboard Path Options
Depending on your Supabase version, you might find the setting in:

**Option 1** (Most Common):
```
Dashboard → Authentication → Configuration → Password Protection
```

**Option 2**:
```
Dashboard → Authentication → Policies → Security Settings
```

**Option 3**:
```
Dashboard → Settings → Authentication → Password Security
```

#### Additional Password Security Settings

While you're in the Password Protection section, consider enabling these settings:

1. **Minimum Password Length**: 12 characters (recommended)
   - Current minimum: 8 characters
   - OWASP recommendation: 12+ characters

2. **Password Complexity**: Enable all options
   - ✅ Lowercase letters
   - ✅ Uppercase letters
   - ✅ Numbers
   - ✅ Special symbols

3. **CAPTCHA Protection**: Enable for additional bot protection
   - Protects against brute force attacks
   - Configurable threshold

### How It Works

1. **Sign Up**: When a user creates an account, their password is checked against the HaveIBeenPwned database
2. **Password Hash Prefix**: Only the first 5 characters of the SHA-1 hash are sent (k-anonymity)
3. **Privacy-Preserving**: The full password is never sent to HaveIBeenPwned
4. **Real-Time Check**: Validation happens during the authentication flow
5. **No Performance Impact**: Async validation with minimal latency

### User Experience

#### When Enabled
- Users with compromised passwords see a clear error message
- They must choose a different, secure password
- No existing users are locked out (only affects new passwords)

#### Error Message Example
```
"This password has been found in a data breach.
Please choose a different password to keep your account secure."
```

### Pricing & Limits

- **Feature Availability**: Pro Plan and above
- **API Calls**: No additional charges
- **Rate Limiting**: Built into Supabase Auth
- **Uptime**: Depends on HaveIBeenPwned.org availability (99.9%+)

### Troubleshooting

#### Issue: Can't Find the Setting

**Solution 1**: Upgrade to Pro Plan
- Leaked password protection is a Pro feature
- Check your current plan in Dashboard → Settings → Billing

**Solution 2**: Check Dashboard Version
- Older dashboard versions may have different layouts
- Try searching for "password" in dashboard settings

**Solution 3**: Use Supabase CLI
```bash
# Alternative: Configure via CLI
supabase auth update --enable-signup
# Note: GUI is recommended for this setting
```

#### Issue: Setting Doesn't Appear to Work

**Check 1**: Clear Application Cache
```javascript
// Ensure you're using the latest Supabase client
import { createClient } from '@supabase/supabase-js'
// Version should be 2.39.7 or higher
```

**Check 2**: Verify Authentication Flow
- Ensure you're using `signUp()` not direct database inserts
- Password validation only works through Supabase Auth

**Check 3**: Test Connection
```bash
# Test HaveIBeenPwned API access
curl -I https://api.pwnedpasswords.com/range/21BD1
# Should return 200 OK
```

### API Reference

#### Client-Side Error Handling

```typescript
import { AuthError } from '@supabase/supabase-js'

async function handleSignUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) {
    if (error.message.includes('leaked')) {
      // Handle leaked password error
      return {
        success: false,
        message: 'This password has been compromised. Please choose a different one.'
      }
    }
    // Handle other errors
  }

  return { success: true, data }
}
```

#### Server-Side Validation

```typescript
// No server-side changes needed
// Supabase Auth handles validation automatically
// All requests through Supabase client are protected
```

### Best Practices

1. **User Communication**
   - Explain why their password was rejected
   - Provide guidance on creating strong passwords
   - Link to password strength checker

2. **Password Requirements**
   - Display requirements before user submits
   - Show real-time password strength indicator
   - Provide examples of strong passwords

3. **Error Messages**
   - Be clear about the issue
   - Don't expose security details
   - Offer actionable solutions

### Monitoring

#### Check Configuration Status

```sql
-- Query to verify Auth configuration
-- (Run in Supabase SQL Editor)
SELECT *
FROM auth.config
WHERE key = 'password_protection_enabled';
```

#### Monitor Failed Attempts

```sql
-- Check for leaked password rejections
SELECT
  email,
  created_at,
  error_code
FROM auth.audit_log_entries
WHERE error_code = 'password_leaked'
ORDER BY created_at DESC
LIMIT 100;
```

### Resources

- [Supabase Password Security Docs](https://supabase.com/docs/guides/auth/password-security)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)
- [OWASP Password Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Supabase Auth Features](https://supabase.com/blog/supabase-auth-identity-linking-hooks)

### Support

If you need help:
1. Check [Supabase Community](https://github.com/orgs/supabase/discussions)
2. Review [Auth Troubleshooting Guide](https://supabase.com/docs/guides/auth/troubleshooting)
3. Contact Supabase Support (Pro plan includes priority support)

---

**Status**: ⚠️ **Action Required** - This feature must be enabled manually in the Supabase Dashboard

**Impact**: High security improvement with minimal user friction

**Estimated Setup Time**: 5 minutes
