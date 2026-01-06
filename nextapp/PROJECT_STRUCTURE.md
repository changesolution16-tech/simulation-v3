# Project Structure

Complete overview of the organized repository structure.

## 📊 Directory Tree

```
soft-skills-training-platform/
├── README.md                          ← Start here!
├── PROJECT_STRUCTURE.md               ← This file
│
├── 🚀 src/                            ← **ACTIVE DEVELOPMENT**
│   ├── README.md                      ← Quick start guide
│   ├── MIGRATION_GUIDE.md             ← Complete migration instructions
│   ├── AWS_S3_SETUP.md               ← S3 configuration guide
│   ├── DEPLOYMENT_GUIDE.md            ← Deployment options
│   ├── CODE_MIGRATION_PATTERNS.md     ← Code examples
│   ├── BUILD_NOTES.md                 ← Build configuration
│   ├── IMPLEMENTATION_SUMMARY.md      ← What's been built
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── .env.example
│   ├── quick-start.sh
│   │
│   └── src/
│       ├── app/                       ← Next.js App Router
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── globals.css
│       │   └── api/
│       │       └── auth/[...nextauth]/
│       │
│       ├── components/                ← React components
│       │   └── Providers.tsx
│       │
│       ├── lib/                       ← Core utilities
│       │   ├── db.ts                  ← PostgreSQL connection
│       │   ├── db-helpers.ts          ← Database queries
│       │   ├── auth.ts                ← NextAuth config
│       │   └── s3.ts                  ← AWS S3 utilities
│       │
│       ├── types/                     ← TypeScript types
│       │   └── next-auth.d.ts
│       │
│       └── middleware.ts              ← Route protection
│
├── 📁 src/                            ← Legacy Vite/React app
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/                    ← React components to migrate
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── learner/
│   │   ├── simulation/
│   │   ├── teacher/
│   │   ├── ui/
│   │   └── video/
│   │
│   ├── contexts/                      ← React contexts
│   ├── hooks/                         ← Custom hooks
│   ├── lib/                          ← Utilities (Supabase-based)
│   ├── store/                        ← Zustand state management
│   ├── types/                        ← TypeScript types
│   └── translations/                 ← i18n files
│
├── 📚 docs/                          ← Organized documentation
│   ├── README.md                      ← Documentation index
│   │
│   ├── fixes/                         ← Bug fixes (~30 files)
│   │   ├── *FIX*.md
│   │   ├── *FIXED*.md
│   │   └── ...
│   │
│   ├── features/                      ← Feature docs (~20 files)
│   │   ├── *IMPLEMENTATION*.md
│   │   ├── *INTEGRATION*.md
│   │   └── ...
│   │
│   ├── deployment/                    ← Deployment guides (~10 files)
│   │   ├── *DEPLOYMENT*.md
│   │   ├── *DEPLOY*.md
│   │   └── ...
│   │
│   ├── guides/                        ← User guides (~25 files)
│   │   ├── *GUIDE*.md
│   │   ├── *SETUP*.md
│   │   ├── *QUICK*.md
│   │   └── ...
│   │
│   ├── implementation/                ← Implementation summaries (~20 files)
│   │   ├── *SUMMARY*.md
│   │   ├── *COMPLETE*.md
│   │   └── ...
│   │
│   └── database/                      ← Database docs (~10 files)
│       ├── *DATABASE*.md
│       ├── *BACKUP*.md
│       └── ...
│
├── 🛠️ scripts/                       ← Utility scripts
│   ├── README.md                      ← Scripts index
│   │
│   ├── database/                      ← Database utilities (~25 scripts)
│   │   ├── create-*.mjs
│   │   ├── seed-*.mjs
│   │   ├── populate-*.mjs
│   │   ├── backfill-*.mjs
│   │   └── update-*.mjs
│   │
│   ├── diagnostics/                   ← Diagnostic tools (~20 scripts)
│   │   ├── check-*.mjs
│   │   └── diagnose-*.mjs
│   │
│   ├── testing/                       ← Test utilities (~15 scripts)
│   │   ├── test-*.mjs
│   │   ├── validate-*.mjs
│   │   └── verify-*.mjs
│   │
│   └── migration/                     ← Migration utilities (~15 scripts)
│       ├── import-*.mjs
│       ├── export-*.mjs
│       └── apply-*.mjs
│
├── 💾 backups/                        ← SQL backups
│   ├── README.md                      ← Backup guide
│   ├── complete-database-backup-*.sql
│   ├── database-schema-complete.sql
│   └── ...
│
├── 📦 archives/                       ← Historical artifacts
│   ├── README.md                      ← Archive index
│   ├── migration-package/
│   ├── soft-skills-training-migration-package.tar.gz
│   └── MIGRATION_PACKAGE_SUMMARY.txt
│
├── 🗄️ supabase/                      ← Database migrations
│   ├── migrations/
│   │   └── *.sql                      ← 200+ migration files
│   └── functions/                     ← Edge functions
│
├── 📄 Configuration Files
│   ├── package.json                   ← Legacy app dependencies
│   ├── vite.config.ts                 ← Vite configuration
│   ├── tsconfig.json                  ← TypeScript config
│   ├── tailwind.config.js             ← Tailwind CSS
│   ├── eslint.config.js               ← ESLint
│   ├── netlify.toml                   ← Netlify config
│   ├── vercel.json                    ← Vercel config
│   ├── .env.example                   ← Environment template
│   └── .gitignore
│
└── 📋 Root Documentation
    ├── README.md                      ← Main project README
    └── PROJECT_STRUCTURE.md           ← This file
```

## 🎯 Quick Navigation

### For New Developers

```
1. Read:    ./README.md
2. Read:    ./README.md
3. Run:     npm install
4. Start:   npm run dev
```

### For Bug Fixes

```
1. Search:  ./docs/fixes/
2. Check:   ./docs/guides/*TROUBLESHOOTING.md
3. Run:     ./scripts/diagnostics/check-*.mjs
```

### For Feature Development

```
1. Review:  ./docs/features/
2. Check:   ./docs/implementation/
3. Test:    ./scripts/testing/test-*.mjs
```

### For Deployment

```
1. Read:    ./docs/deployment/
2. Check:   ./docs/deployment/
3. Backup:  ./backups/
```

## 📊 Statistics

| Category | Count | Location |
|----------|-------|----------|
| Documentation Files | 120+ | `/docs/` |
| Utility Scripts | 75+ | `/scripts/` |
| Database Migrations | 200+ | `/supabase/migrations/` |
| React Components | 60+ | `/src/components/` |
| SQL Backups | 10+ | `/backups/` |

## 🔍 Finding Files

### By File Type

**Documentation (*.md):**
```bash
find docs/ -name "*.md"
```

**Scripts (*.mjs, *.js):**
```bash
find scripts/ -name "*.mjs" -o -name "*.js"
```

**SQL Files (*.sql):**
```bash
find backups/ supabase/ -name "*.sql"
```

**React Components (*.tsx):**
```bash
find src/ -name "*.tsx"
```

### By Topic

**Authentication:**
- `/docs/fixes/*LOGIN*.md`
- `/docs/fixes/*SESSION*.md`
- `/src/components/auth/`
- `/src/lib/auth.ts`

**Database:**
- `/docs/database/`
- `/scripts/database/`
- `/backups/`
- `/supabase/migrations/`

**Videos:**
- `/docs/features/*VIDEO*.md`
- `/src/components/video/`
- `/scripts/database/backfill-video-*.mjs`

**Testing:**
- `/scripts/testing/`
- `/scripts/diagnostics/`

## 🚦 Status Legend

- 🚀 **Active Development** - Use for new work
- 📁 **Legacy** - Reference only, migrate from
- 📚 **Documentation** - Read-only reference
- 🛠️ **Utilities** - Run as needed
- 💾 **Backups** - Restore as needed
- 📦 **Archive** - Historical reference

## 🔗 Key Links

| Resource | Location |
|----------|----------|
| **Main README** | [`./README.md`](./README.md) |
| **Next.js App** | [`./src/`](./src/) |
| **Migration Docs** | [`./docs/migration/`](./docs/migration/) |
| **Documentation** | [`./docs/`](./docs/) |
| **Scripts** | [`./scripts/`](./scripts/) |
| **Backups** | [`./backups/`](./backups/) |

## 📝 Naming Conventions

### Documentation
- `*FIX*.md` - Bug fix documentation
- `*IMPLEMENTATION*.md` - Feature implementation
- `*GUIDE*.md` - User guides
- `*SUMMARY*.md` - High-level summaries
- `*QUICK*.md` - Quick reference guides

### Scripts
- `create-*.mjs` - Create resources
- `check-*.mjs` - Check status (read-only)
- `diagnose-*.mjs` - Diagnose issues (read-only)
- `test-*.mjs` - Test functionality (read-only)
- `update-*.mjs` - Update resources (modifies data)
- `populate-*.mjs` - Populate data (modifies data)
- `backfill-*.mjs` - Backfill data (modifies data)

### Database Files
- `*-backup-*.sql` - Backup files
- `*-schema-*.sql` - Schema only
- `*.sql` (in migrations) - Migration files

## 🎓 Best Practices

### When Adding New Files

1. **Documentation** → `/docs/[category]/`
2. **Scripts** → `/scripts/[category]/`
3. **Backups** → `/backups/`
4. **Components** → `/src/components/`
5. **Utilities** → `/src/lib/`

### When Deprecating Files

1. Move to `/archives/`
2. Update references
3. Document in archive README
4. Keep for historical reference

---

**📂 This structure keeps everything organized and easy to find!**
