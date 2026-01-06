# Database Connection Pooling Fixed

## Problem
Multiple database connections were being created on each SQL query, leading to connection pool exhaustion and CONNECT_TIMEOUT errors, causing redirects to `/_error` after login.

## Root Causes
1. **Incorrect DATABASE_URL credentials**: Had placeholder values instead of actual credentials
2. **Redundant connection parameters**: Passing both `DATABASE_URL` and individual connection parameters (host, port, etc.)
3. **Eager initialization**: Connection pool was created immediately when the module was imported
4. **Multiple Next.js workers**: During build, Next.js spawns multiple processes, each creating its own connection pool
5. **Missing redirect callback**: NextAuth had no redirect logic, causing infinite loops

## Solution Implemented

### 0. Fixed DATABASE_URL Credentials
Updated `.env` with correct credentials and URL-encoded special characters in password:

```bash
# Before
DATABASE_URL=postgresql://user:password@...

# After (with URL-encoded password: $Sim#159>?)
DATABASE_URL=postgresql://postgres:%24Sim%23159%3E%3F@...
```

Special characters encoding:
- `$` → `%24`
- `#` → `%23`
- `>` → `%3E`
- `?` → `%3F`

### 1. Lazy Connection Initialization
Using a Proxy pattern, connections are only created when the first query is executed, not when the module is imported:

```typescript
const sql = new Proxy({} as ReturnType<typeof postgres>, {
  get(target, prop) {
    const connection = getConnection();
    return connection[prop];
  }
});
```

### 2. Simplified Configuration
Removed redundant connection parameters - now only using `DATABASE_URL`:

```typescript
global.__db = postgres(process.env.DATABASE_URL, {
  max: 3,                    // Max 3 connections per pool
  idle_timeout: 10,          // Close idle connections after 10s
  max_lifetime: 60 * 30,     // Recycle connections after 30min
  connect_timeout: 30,       // 30s connection timeout
  ssl: 'require',
});
```

### 3. Global Singleton Pattern
Proper global caching ensures one connection pool per Node.js process:

```typescript
declare global {
  var __db: ReturnType<typeof postgres> | undefined;
}

function getConnection() {
  if (global.__db) {
    return global.__db;  // Reuse existing
  }
  global.__db = postgres(...);  // Create new
  return global.__db;
}
```

### 4. Enhanced Error Handling
- 15-second timeout on branding API queries
- Default values returned on database errors
- Better error logging with connection details

### 5. NextAuth Redirect Fix
Added redirect callback to prevent infinite redirect loops:

```typescript
async redirect({ url, baseUrl }) {
  if (url.startsWith('/')) return `${baseUrl}${url}`;
  return `${baseUrl}/dashboard`;
}
```

## Monitoring Tools

### Check Active Connections
```bash
node check-connections.mjs
```

This will show:
- All active database connections
- Which application owns each connection
- Connection state and queries

### Test Connection
```bash
node test-db-connection.mjs
```

Verifies database connectivity and shows connection time.

## Expected Behavior

### During Build
- No connections created during static page generation
- Connections only created if dynamic routes query the database

### During Runtime
- One connection pool per Node.js process (typically 1 in dev, multiple in production)
- Max 3 connections per pool
- Connection reuse across requests
- Idle connections automatically closed after 10 seconds

## Logs to Watch For

✅ Good:
```
🔌 Creating database connection pool (process id: 12345)
✅ Database connection pool created
```

❌ Bad (should not see multiple of these):
```
🔌 Creating database connection pool (process id: 12345)
🔌 Creating database connection pool (process id: 12345)
🔌 Creating database connection pool (process id: 12345)
```

## Next Steps

1. Start the dev server: `npm run dev`
2. Login and navigate around
3. Watch the logs - you should see only ONE "Creating database connection pool" message
4. Run `node check-connections.mjs` to verify max 3 connections per process

## If Issues Persist

1. **RDS Security Groups**: Ensure inbound rules allow port 5432 from your server IP
2. **VPC Configuration**: Verify RDS is publicly accessible or in same VPC
3. **Network ACLs**: Check subnet ACLs aren't blocking connections
4. **Connection Limits**: Verify RDS instance max_connections setting
