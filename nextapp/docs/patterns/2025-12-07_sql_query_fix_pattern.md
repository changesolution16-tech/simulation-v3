# SQL Query Fix Pattern

## Problem
The newly created API routes use `sql.query()` which doesn't exist in the postgres library.
The postgres library uses template literals instead.

## Solution Pattern

### Before (WRONG):
```typescript
const result = await sql.query(
  'SELECT * FROM table WHERE id = $1',
  [id]
);
return result.rows;
```

### After (CORRECT):
```typescript
const result = await sql`
  SELECT * FROM table WHERE id = ${id}
`;
return result;  // Note: result IS the array, not result.rows
```

### Dynamic Queries with Conditions:
```typescript
// Before (WRONG)
let query = 'SELECT * FROM table WHERE 1=1';
const params = [];
if (filter) {
  query += ' AND column = $1';
  params.push(filter);
}
const result = await sql.query(query, params);

// After (CORRECT)
const result = await sql`
  SELECT * FROM table
  WHERE 1=1
    ${filter ? sql`AND column = ${filter}` : sql``}
`;
```

### Dynamic Updates:
```typescript
// For dynamic UPDATE with multiple fields
const updates = { field1: value1, field2: value2 };
const result = await sql`
  UPDATE table
  SET ${sql(updates)}
  WHERE id = ${id}
  RETURNING *
`;
```

## Files That Need Fixing

All these files in `src/app/api/` need the sql.query -> template literal conversion:

1. ✅ `/users/route.ts` - FIXED
2. ✅ `/users/[id]/route.ts` - FIXED
3. ✅ `/competencies/route.ts` - FIXED
4. `/competencies/[id]/route.ts` - NEEDS FIX
5. `/competencies/learner/[learnerId]/route.ts` - NEEDS FIX
6. `/assignments/route.ts` - NEEDS FIX
7. `/assignments/[id]/route.ts` - NEEDS FIX
8. `/cohorts/route.ts` - NEEDS FIX
9. `/cohorts/[id]/route.ts` - NEEDS FIX
10. `/cohorts/[id]/members/route.ts` - NEEDS FIX

## Quick Fix Steps

For each file:
1. Find all `sql.query(...)` calls
2. Convert to template literal: `sql\`...\``
3. Replace `$1, $2, $3` with `${param1}, ${param2}, ${param3}`
4. Change `result.rows` to just `result`
5. Change `result.rows[0]` to `result[0]`
6. Change `result.rows.length` to `result.length`
