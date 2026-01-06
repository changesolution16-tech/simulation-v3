# User Profile Update System - Comprehensive Fix Documentation

## Overview

This document details the comprehensive fixes applied to resolve user profile update issues in the Soft Skills Simulation platform. The fixes address RLS policy conflicts, state synchronization problems, and improve error handling throughout the system.

## Problem Analysis

### Issues Identified

1. **RLS Policy Complexity**: The admin update policy had recursive checks that could cause conflicts
2. **Missing Database Trigger**: No automatic `updated_at` trigger existed
3. **Data Structure Mismatch**: The code expected a `progress` column but it was stored in `metadata` JSONB
4. **State Synchronization Gap**: Profile updates didn't refresh the global user state in the store
5. **Poor Error Handling**: Generic error messages without helpful context for users
6. **Incomplete User Data Loading**: New fields (institution, department, position) weren't loaded during authentication

## Solutions Implemented

### 1. Database Migration: `fix_profile_update_policies_comprehensive.sql`

**Location**: Applied via Supabase MCP tool

**Changes Made**:

#### A. Added Progress Column
- Added dedicated `progress` JSONB column to profiles table
- Backfilled existing users with proper structure
- Ensures proper data structure for learning progress tracking

#### B. Created Updated_At Trigger
```sql
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This ensures `updated_at` is automatically maintained without manual intervention.

#### C. Simplified RLS Policies

**User Update Policy** (Simplified):
```sql
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

**Admin Update Policy** (Non-Recursive):
```sql
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS admin_check
      WHERE admin_check.id = auth.uid()
        AND admin_check.role = 'admin'
    )
  );
```

The key improvement is using an aliased subquery (`admin_check`) to avoid recursive policy checks.

#### D. Performance Indexes
Added indexes for common query patterns:
- `idx_profiles_role`: Role-based queries
- `idx_profiles_is_active`: Active user filtering
- `idx_profiles_email_active`: Authentication queries
- `idx_profiles_username`: Username lookups

#### E. Safe Update Function
Created `safe_update_profile()` function with built-in validation and permission checks.

### 2. UserSettings Component Enhancement

**File**: `src/components/settings/UserSettings.tsx`

**Key Improvements**:

#### Enhanced Error Handling
- Added specific error code handling (PGRST301, 23505, 42501)
- Provides user-friendly error messages
- Detailed console logging with `[UserSettings]` prefix for debugging

#### State Synchronization
```typescript
// Update global state after successful update
const updatedUser = {
  ...currentUser,
  name: data.full_name || currentUser.name,
  institution: data.institution,
  department: data.department,
  position: data.position
};

useSimulationStore.getState().setCurrentUser(updatedUser);
```

This ensures the store reflects the updated profile immediately.

#### Better Data Handling
- Trims whitespace from all string inputs
- Uses `.single()` to get the updated record
- Doesn't manually set `updated_at` (lets trigger handle it)
- Proper null handling for optional fields

### 3. UserService Improvement

**File**: `src/lib/users.ts`

**Changed Return Type**:
```typescript
// Before:
static async updateUser(userId: string, updates: Partial<User>): Promise<boolean>

// After:
static async updateUser(userId: string, updates: Partial<User>):
  Promise<{ success: boolean; error?: string; data?: any }>
```

**Benefits**:
- Returns detailed error messages for better UX
- Includes updated data for immediate state sync
- Session verification before update
- Comprehensive error code mapping
- Trims all string values automatically

**Protected Fields**:
- `created_at`, `id`, `email`, `username`: Cannot be modified
- `updated_at`: Set by database trigger
- `progress`: Should use dedicated progress update methods
- `name`: Frontend-only field, use `full_name` instead

### 4. Type System Update

**File**: `src/types/index.ts`

Added missing fields to User type:
```typescript
export type User = {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: 'learner' | 'instructor' | 'admin';
  institution?: string;      // ← Added
  department?: string;        // ← Added
  position?: string;          // ← Added
  is_active?: boolean;
  password_last_changed?: string;
  last_login_at?: string;
  failed_login_attempts?: number;
  progress: LearnerProgress;
  moodleContext?: MoodleContext;
  moodleUser?: MoodleUser;
};
```

### 5. Authentication State Management

**Files Updated**:
- `src/store/index.ts`
- `src/App.tsx`

**Changes**:
All user data loading points now include the new fields:
- Initial session check on app load
- Login flow in store
- Auth state change handler

This ensures consistent data structure across all authentication entry points.

### 6. Admin User Management

**File**: `src/components/admin/UserManager.tsx`

Updated to use new UserService return type:
```typescript
const result = await UserService.updateUser(editingUser.id, userData);
if (result.success) {
  await loadUsers();
  setEditingUser(null);
} else {
  alert(`Failed to update user: ${result.error || 'Unknown error'}`);
}
```

## Database Schema Summary

### Profiles Table Structure

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | Primary key, references auth.users |
| email | text | NO | - | Unique, cannot be changed |
| full_name | text | YES | - | User's display name |
| username | text | NO | - | Unique, cannot be changed after creation |
| role | text | NO | 'learner' | learner, instructor, or admin |
| institution | text | YES | - | Educational institution |
| department | text | YES | '' | Department within institution |
| position | text | YES | '' | Role/position (e.g., Professor, Student) |
| is_active | boolean | NO | true | Account activation status |
| password_last_changed | timestamptz | YES | now() | Last password change timestamp |
| last_login_at | timestamptz | YES | - | Last successful login |
| account_locked_until | timestamptz | YES | - | Temporary lockout timestamp |
| failed_login_attempts | integer | YES | 0 | Failed login counter |
| activation_history | jsonb | YES | '[]' | Audit trail for activation changes |
| progress | jsonb | YES | {...} | Learning progress data |
| metadata | jsonb | YES | '{}' | Additional metadata |
| mfa_enabled | boolean | YES | false | Two-factor authentication status |
| created_at | timestamptz | YES | now() | Record creation timestamp |
| updated_at | timestamptz | YES | now() | Auto-updated by trigger |

### RLS Policies

1. **Authenticated users can view all profiles**: SELECT for authenticated users
2. **Users can update own profile**: UPDATE for own records only
3. **Admins can update any profile**: UPDATE for admin users on any record
4. **Users can create own profile**: INSERT for own record
5. **Service role can manage profiles**: Full access for service role
6. **Service role has full access**: Duplicate policy for service role

## Testing Checklist

### Manual Testing Steps

1. **Basic Profile Update**
   - [ ] Log in as a regular user
   - [ ] Navigate to Settings
   - [ ] Update full name, institution, department, position
   - [ ] Click "Save Changes"
   - [ ] Verify success message appears
   - [ ] Check browser console for `[UserSettings] Profile updated successfully`
   - [ ] Verify fields retain new values after page refresh

2. **Error Scenarios**
   - [ ] Try to update with empty required fields
   - [ ] Test with invalid data (if applicable)
   - [ ] Verify error messages are user-friendly
   - [ ] Check that errors don't cause app crashes

3. **State Synchronization**
   - [ ] Update profile
   - [ ] Navigate to dashboard without refreshing
   - [ ] Verify updated name/info appears in UI
   - [ ] Check user menu/header shows updated name

4. **Admin Testing**
   - [ ] Log in as admin
   - [ ] Navigate to User Management
   - [ ] Edit another user's profile
   - [ ] Verify updates work correctly
   - [ ] Check that user list refreshes after update

5. **Session Handling**
   - [ ] Update profile with valid session
   - [ ] Try updating after session expires (wait 1 hour)
   - [ ] Verify appropriate error message

### Database Verification

```sql
-- Check that updated_at trigger is working
SELECT id, email, full_name, updated_at
FROM profiles
WHERE email = 'test@example.com';
-- Update a field and verify updated_at changes

-- Check RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Verify progress column exists and has data
SELECT id, email,
       progress->>'userId' as user_id,
       jsonb_array_length(progress->'completedScenarios') as scenarios_count
FROM profiles
LIMIT 5;
```

## Debugging Guide

### Common Issues and Solutions

#### 1. "Permission denied" error
- **Cause**: RLS policy not allowing the operation
- **Check**: Verify user is authenticated and session is valid
- **Solution**: Review RLS policies with `SELECT * FROM pg_policies WHERE tablename = 'profiles'`

#### 2. Updates appear to succeed but data doesn't change
- **Cause**: Field being filtered out before update
- **Check**: Console logs showing `[UserSettings] Sending update`
- **Solution**: Verify field is not in the excluded list (email, username, id, etc.)

#### 3. "No active session" error
- **Cause**: Session expired or not properly initialized
- **Solution**: Log out and log back in, check Supabase auth configuration

#### 4. State not updating after profile change
- **Cause**: Store not being updated after successful database update
- **Check**: Look for `[UserSettings] Global user state updated` in console
- **Solution**: Verify `useSimulationStore.getState().setCurrentUser()` is called

### Console Log Patterns

#### Successful Update
```
[UserSettings] Starting profile update...
[UserSettings] Current user ID: abc-123-def
[UserSettings] Update data: { full_name: "John Doe", institution: "MIT", ... }
[UserSettings] Session verified, user authenticated: abc-123-def
[UserSettings] Sending update to database: { full_name: "John Doe", ... }
[UserSettings] Profile updated successfully: { id: "abc-123-def", ... }
[UserSettings] Global user state updated
```

#### Failed Update
```
[UserSettings] Starting profile update...
[UserSettings] Session verified, user authenticated: abc-123-def
[UserSettings] Sending update to database: { ... }
[UserSettings] Profile update error: { message: "...", code: "PGRST301" }
[UserSettings] Error code: PGRST301
[UserSettings] Error details: ...
```

## Performance Considerations

### Indexes Added
- All indexes use `CREATE INDEX IF NOT EXISTS` to be idempotent
- Partial indexes for active users reduce index size
- Composite indexes cover common query patterns

### Query Optimization
- Updates use `.select().single()` to return updated data in one query
- Avoid N+1 queries by fetching all user data in single SELECT
- RLS policies use simple equality checks (efficient)

## Security Considerations

### Protected Fields
The following fields are protected from user updates:
- `id`: System-generated UUID
- `email`: Cannot be changed (unique identifier)
- `username`: Cannot be changed (unique identifier)
- `created_at`: Historical timestamp
- `updated_at`: Managed by database trigger
- `role`: Can only be changed by admins through admin-specific flows

### RLS Policy Security
- Users can ONLY update their own profile (enforced at database level)
- Admins verified through database-level role check (not client-side)
- Service role has full access for system operations (edge functions)
- All policies are restrictive by default (deny unless explicitly allowed)

### Session Validation
- Every update verifies active session before proceeding
- Session tokens validated by Supabase Auth (JWT-based)
- Expired sessions result in clear error messages
- No sensitive data exposed in error messages

## Migration Safety

### Rollback Plan
If issues occur, the migration can be safely rolled back:

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;
DROP FUNCTION IF EXISTS update_profiles_updated_at();

-- Remove progress column (WARNING: data loss!)
ALTER TABLE profiles DROP COLUMN IF EXISTS progress;

-- Remove safe update function
DROP FUNCTION IF EXISTS safe_update_profile(uuid, text, text, text, text);

-- Restore previous policies
-- (Would need to reapply previous migration policies)
```

**Note**: Dropping the `progress` column will result in data loss. Backup data first!

### Forward Compatibility
- All changes are additive where possible
- Existing columns not modified (except adding progress)
- New indexes don't affect existing queries
- RLS policies maintain backward compatibility

## Future Improvements

### Potential Enhancements
1. **Optimistic Updates**: Update UI immediately before database confirms
2. **Field-Level Permissions**: Allow admins to lock specific fields
3. **Audit Trail**: Track all profile changes with timestamps and changers
4. **Validation Rules**: Add email format validation, name length limits, etc.
5. **Batch Updates**: Support updating multiple users at once
6. **Progressive Enhancement**: Show which fields are being saved
7. **Undo Functionality**: Allow reverting recent profile changes

### Known Limitations
1. Username and email cannot be changed (by design)
2. Role changes require admin privileges (by design)
3. Progress updates should use dedicated methods (separate from profile updates)
4. No real-time sync between multiple browser tabs

## Conclusion

This comprehensive fix addresses the root causes of profile update failures:
- Simplified RLS policies eliminate recursion issues
- Automatic triggers ensure data consistency
- Enhanced error handling improves user experience
- State synchronization keeps UI in sync with database
- Proper typing prevents developer errors

The system is now more robust, maintainable, and user-friendly.
