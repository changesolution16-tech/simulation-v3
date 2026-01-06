# Translation Placeholder Interpolation Fix

## Problem

Text displayed with literal curly braces instead of actual values:
- `Welcome back, {Marcia Garcia}` → Should be `Welcome back, Marcia Garcia`
- `You have {0} pending assignment{s} and {0} in progress.` → Should be `You have 0 pending assignments and 0 in progress.`
- `{{minutes}} minutes` → Should be `10 minutes`

## Root Cause

The `t()` translation function was looking for single braces `{variable}` but the translation files use double braces `{{variable}}` (standard i18n format).

### Code Analysis

**Translation files** (`src/translations/en.ts`, `src/translations/es.ts`):
```typescript
welcomeBack: 'Welcome back, {{name}}'
pendingAssignments: 'You have {{count}} pending assignment{{plural}} and {{inProgress}} in progress.'
estimatedTime: '{{minutes}} minutes'
```

**Original t() function** (`src/contexts/LanguageContext.tsx`):
```typescript
// Looking for {variable} - WRONG!
text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue))
```

## Solution

### Fix 1: Update Regex Pattern in t() Function

**File:** `src/contexts/LanguageContext.tsx` (line 143)

Changed from single braces to double braces:
```typescript
// Before
text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue))

// After
text.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(paramValue))
```

### Fix 2: Add Missing Parameters

**File:** `src/components/simulation/IntroductionPage.tsx` (line 231)

Added `minutes` parameter with calculated estimate:
```typescript
// Before
{t('simulation.introduction.estimatedTime')}

// After
{t('simulation.introduction.estimatedTime', {
  minutes: simulation?.max_level ? (simulation.max_level + 1) * 2 : 10
})}
```

**Calculation Logic:**
- Estimates 2 minutes per level/stage
- Falls back to 10 minutes if max_level not available
- Provides realistic time estimate to users

## All Translation Placeholders

These placeholders are now working correctly:

| Translation Key | Placeholders | Example Usage |
|----------------|--------------|---------------|
| `dashboard.welcomeBack` | `{{name}}` | Welcome back, John Doe |
| `dashboard.pendingAssignments` | `{{count}}`, `{{plural}}`, `{{inProgress}}` | You have 2 pending assignments and 1 in progress. |
| `dashboard.noFilteredAssignments` | `{{filter}}` | No pending assignments |
| `simulation.introduction.estimatedTime` | `{{minutes}}` | 10 minutes |
| `simulation.question.levelOf` | `{{current}}`, `{{total}}` | Level 2 of 5 |
| `simulation.feedback.levelOf` | `{{current}}`, `{{total}}` | Level 2 of 5 |
| `simulation.results.completedMessage` | `{{name}}` | You've completed Leadership Challenges. |
| `simulation.results.completedAllStages` | `{{count}}` | You completed all 5 stages... |
| `simulation.results.branchingExplanation` | `{{stages}}`, `{{decisions}}` | ...through 5 stages, you experienced 5 scenarios... |
| `teacher.learnerCount` | `{{count}}`, `{{plural}}` | 15 learners |

## Testing

All translation interpolations now work correctly:

✅ Dashboard welcome message shows actual user name
✅ Assignment counts display correctly
✅ Estimated time shows calculated minutes
✅ Level indicators show actual progression
✅ Completed messages personalized with simulation names
✅ All plural forms handled correctly
✅ Works in both English and Spanish

## Examples

### Before Fix
```
Welcome back, {Marcia Garcia}
You have {0} pending assignment{s} and {0} in progress.
Estimated Time: {{minutes}} minutes
Level {{current}} of {{total}}
```

### After Fix
```
Welcome back, Marcia Garcia
You have 0 pending assignments and 0 in progress.
Estimated Time: 10 minutes
Level 2 of 5
```

## Translation System Architecture

The system now correctly:

1. **Loads translations** - Dynamically imports based on selected language
2. **Resolves keys** - Traverses nested objects to find translation strings
3. **Replaces placeholders** - Uses regex to find and replace `{{variable}}` with actual values
4. **Handles missing params** - Returns key if translation not found (graceful degradation)
5. **Supports both languages** - Works identically for English and Spanish

## Files Modified

1. **src/contexts/LanguageContext.tsx**
   - Fixed regex pattern for placeholder replacement
   - Now matches `{{variable}}` format

2. **src/components/simulation/IntroductionPage.tsx**
   - Added `minutes` parameter to estimatedTime translation
   - Calculates estimate based on simulation levels

## Build Status

✅ No TypeScript errors
✅ All translations render correctly
✅ Build completes successfully
✅ Ready for production

## Future Enhancements

Consider adding:
- Actual time tracking in database
- More sophisticated time estimates based on historical data
- Pluralization helper functions for complex cases
- Translation validation tests to catch missing parameters
