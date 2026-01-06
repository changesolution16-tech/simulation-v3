# Utility Scripts

Collection of utility scripts for database operations, testing, diagnostics, and migration.

## 📁 Directory Structure

### `/database/` - Database Utilities
Scripts for database operations:
- `create-*.mjs` - Create database objects
- `seed-*.mjs` - Seed data
- `populate-*.mjs` - Populate tables
- `backfill-*.mjs` - Backfill missing data
- `update-*.mjs` - Update records

**Common Scripts:**
- `create-judith-admin.mjs` - Create admin user
- `seed-database.mjs` - Seed initial data
- `populate-spanish-translations.mjs` - Add Spanish translations
- `backfill-video-library-references.mjs` - Backfill video references

### `/diagnostics/` - Diagnostic Tools
Scripts to check system status:
- `check-*.mjs` - System checks
- `diagnose-*.mjs` - Issue diagnosis

**Common Scripts:**
- `check-all-tables.mjs` - Verify all tables
- `check-scenario-data.mjs` - Check scenario integrity
- `diagnose-assessment-metrics.mjs` - Diagnose metrics issues
- `diagnose-bravin-scores.mjs` - Check Bravin scoring

### `/testing/` - Test Utilities
Scripts for testing functionality:
- `test-*.mjs` - Test specific features
- `validate-*.mjs` - Validate data
- `verify-*.mjs` - Verify configuration

**Common Scripts:**
- `test-competency-calculations.mjs` - Test competency math
- `test-metric-recording.mjs` - Test metrics tracking
- `validate-demo-simulation.mjs` - Validate demo data
- `verify-bravin-tables.mjs` - Check Bravin tables

### `/migration/` - Migration Utilities
Scripts for data migration:
- `import-*.mjs` - Import data
- `export-*.mjs` - Export data
- `apply-*.mjs` - Apply migrations

**Common Scripts:**
- `import-scenarios-to-database.mjs` - Import scenarios
- `apply-migration.js` - Apply database migration
- `apply-translation-migration.mjs` - Migrate translations

## 🚀 Usage

### Running Scripts

Most scripts are Node.js modules that can be run directly:

```bash
# From project root
node scripts/database/seed-database.mjs

# Or with full path
node /path/to/script.mjs
```

### Environment Variables

Scripts that connect to the database require:

```bash
# Option 1: Use .env file
cp .env.example .env
# Edit .env with your credentials

# Option 2: Set environment variables
export VITE_SUPABASE_URL="your-url"
export VITE_SUPABASE_ANON_KEY="your-key"
```

### Common Workflows

**Initial Setup:**
```bash
node scripts/database/seed-database.mjs
node scripts/database/create-judith-admin.mjs
```

**Add Translations:**
```bash
node scripts/database/populate-spanish-translations.mjs
```

**Diagnostic Check:**
```bash
node scripts/diagnostics/check-all-tables.mjs
node scripts/diagnostics/check-scenario-data.mjs
```

**Testing:**
```bash
node scripts/testing/test-competency-calculations.mjs
node scripts/testing/validate-demo-simulation.mjs
```

**Data Migration:**
```bash
node scripts/migration/import-scenarios-to-database.mjs
```

## 🔧 Script Categories

### By Purpose

**Setup & Initialization:**
- `seed-*.mjs`
- `create-*.mjs`
- `populate-*.mjs`

**Maintenance:**
- `update-*.mjs`
- `backfill-*.mjs`

**Troubleshooting:**
- `check-*.mjs`
- `diagnose-*.mjs`
- `verify-*.mjs`

**Quality Assurance:**
- `test-*.mjs`
- `validate-*.mjs`

**Data Operations:**
- `import-*.mjs`
- `export-*.mjs`
- `apply-*.mjs`

## ⚠️ Important Notes

### Safety

1. **Backup First:** Always backup data before running modification scripts
2. **Test Environment:** Test scripts in development before production
3. **Review Code:** Review script contents before running
4. **Check Permissions:** Ensure proper database permissions

### Database Scripts

Scripts in `/database/` **modify data**. Use caution:
- ✅ Safe: `check-*.mjs`, `verify-*.mjs`, `test-*.mjs`
- ⚠️ Caution: `update-*.mjs`, `populate-*.mjs`, `backfill-*.mjs`
- 🚨 Destructive: `seed-database.mjs` (on existing data)

### Testing Scripts

Scripts in `/testing/` are **read-only** and safe to run anytime.

### Diagnostic Scripts

Scripts in `/diagnostics/` are **read-only** and provide system insights.

## 📋 Quick Reference

### Database Health
```bash
node scripts/diagnostics/check-all-tables.mjs
node scripts/diagnostics/check-schema.mjs
```

### User Management
```bash
node scripts/database/create-judith-admin.mjs
node scripts/database/update-admin-email.mjs
```

### Scenario Management
```bash
node scripts/diagnostics/check-scenario-data.mjs
node scripts/migration/import-scenarios-to-database.mjs
node scripts/testing/validate-demo-simulation.mjs
```

### Metrics & Scoring
```bash
node scripts/diagnostics/diagnose-bravin-scores.mjs
node scripts/testing/test-metric-recording.mjs
node scripts/testing/test-scoring.mjs
```

### Video System
```bash
node scripts/diagnostics/check-video-library-connections.mjs
node scripts/database/backfill-video-library-references.mjs
```

### Translations
```bash
node scripts/database/populate-spanish-translations.mjs
node scripts/diagnostics/check-translations.mjs
```

## 🔗 Related Resources

- **Main README:** [`../README.md`](../README.md)
- **Documentation:** [`../docs/`](../docs/)
- **Next.js App:** [`../nextjs-app/`](../nextjs-app/)
- **Backups:** [`../backups/`](../backups/)

## 📊 Script Stats

Total Scripts: **75+**
- Database utilities: ~25
- Diagnostic tools: ~20
- Testing scripts: ~15
- Migration utilities: ~15

---

**💡 Tip:** Always run diagnostic scripts before and after running database modification scripts to verify changes.
