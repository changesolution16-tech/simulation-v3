# Quick Reference Guide

## 🎯 Where to Find Everything

### 🚀 Starting Development
```
Location: /
Read:     README.md
Action:   npm install && npm run dev
```

### 📚 Looking for Documentation
```
All docs:    /docs/
Bug fixes:   /docs/fixes/
Features:    /docs/features/
Deployment:  /docs/deployment/
Guides:      /docs/guides/
```

### 🛠️ Running Scripts
```
All scripts:  /scripts/
Database:     /scripts/database/
Diagnostics:  /scripts/diagnostics/
Testing:      /scripts/testing/
Migration:    /scripts/migration/
```

### 💾 Database Backups
```
Location: /backups/
Restore:  psql < backups/[filename].sql
```

### 📦 Archives
```
Location: /archives/
Purpose:  Historical reference only
```

## 📖 Essential Reading

| Priority | Document | Purpose |
|----------|----------|---------|
| 🔴 **MUST READ** | [`README.md`](./README.md) | Start here! |
| 🔴 **MUST READ** | [`README.md`](./README.md) | Quick start |
| 🟡 **Recommended** | [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) | Full structure |
| 🟡 **Recommended** | [`docs/migration/`](./docs/migration/) | Migration guides |
| 🟢 **Reference** | [`CLEANUP_SUMMARY.md`](./CLEANUP_SUMMARY.md) | What was organized |

## 🔧 Common Tasks

### Start Development
```bash
# Already at root level
npm install
cp .env.example .env.local
# Edit .env.local
npm run dev
```

### Find Documentation
```bash
# Search by topic
find docs/ -iname "*session*"
find docs/ -iname "*bravin*"

# List categories
ls docs/
```

### Run Diagnostics
```bash
# Check database
node scripts/diagnostics/check-all-tables.mjs

# Check scenarios
node scripts/diagnostics/check-scenario-data.mjs

# Check auth
node scripts/diagnostics/check-auth-and-data.mjs
```

### Database Operations
```bash
# Seed database
node scripts/database/seed-database.mjs

# Backup database
pg_dump database_name > backups/backup-$(date +%Y%m%d).sql

# Restore database
psql database_name < backups/backup-file.sql
```

## 📂 Directory Map

```
Root
├── 🚀 src/             → Next.js application (START HERE)
├── 📁 src/             → Legacy React app (reference only)
├── 📚 docs/            → All documentation (121 files)
├── 🛠️ scripts/         → Utility scripts (67 files)
├── 💾 backups/         → SQL backups (8 files)
├── 📦 archives/        → Historical materials
├── 🗄️ supabase/        → Database migrations
└── 📄 Config files     → package.json, vite.config.ts, etc.
```

## 🎨 File Naming Patterns

### Documentation
- `*FIX*.md` → Bug fixes
- `*FEATURE*.md` → Features
- `*GUIDE*.md` → Guides
- `*SUMMARY*.md` → Summaries
- `*QUICK*.md` → Quick refs

### Scripts
- `create-*.mjs` → Create resources
- `check-*.mjs` → Check status
- `diagnose-*.mjs` → Diagnose issues
- `test-*.mjs` → Tests
- `update-*.mjs` → Updates

## 🔗 Quick Links

| Need | Go To |
|------|-------|
| Start dev | [`README.md`](./README.md) |
| Bug fix | [`docs/fixes/`](./docs/fixes/) |
| Feature info | [`docs/features/`](./docs/features/) |
| Deploy app | [`docs/deployment/`](./docs/deployment/) |
| Run script | [`scripts/README.md`](./scripts/README.md) |
| Restore DB | [`backups/README.md`](./backups/README.md) |

## 💡 Pro Tips

1. **Start development** from root with `npm run dev`
2. **Check** `/docs/` before asking questions
3. **Run diagnostics** before modifying database
4. **Backup** before major changes
5. **Read READMEs** in each folder for details

## 🆘 Help

### Can't Find Something?
1. Check `PROJECT_STRUCTURE.md` for full tree
2. Use `find` command to search
3. Check relevant folder README

### Need Documentation?
```bash
# List all docs
ls docs/*/*.md

# Search by keyword
grep -r "keyword" docs/
```

### Need a Script?
```bash
# List all scripts
ls scripts/*/*.mjs

# Find by name
find scripts/ -iname "*name*"
```

---

**📌 Bookmark this page for quick reference!**
