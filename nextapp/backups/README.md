# Database Backups

SQL backup files and database exports.

## 📁 Contents

This folder contains:
- Complete database schema backups
- Full data exports
- Historical snapshots
- AWS PostgreSQL exports

## 🗄️ Backup Files

### Complete Backups
- `complete-database-backup-*.sql` - Full database backup with data
- `database-schema-complete.sql` - Schema only (no data)
- `full-database-backup-validated.sql` - Validated complete backup

### Partial Backups
- `aws-postgres-complete-backup.sql` - AWS RDS specific backup
- `database-backup-*.sql` - Timestamped backups

### Special Purpose
- `apply-spanish-translations.sql` - Spanish translation data
- `fix-security-audit-view.sql` - Security fix SQL

## 🔄 Using Backups

### Restore Complete Database

```bash
# PostgreSQL
psql -U postgres -d database_name < backups/complete-database-backup.sql

# Or with connection string
psql "postgresql://user:pass@host:5432/db" < backups/complete-database-backup.sql
```

### Restore Schema Only

```bash
psql -U postgres -d database_name < backups/database-schema-complete.sql
```

### Apply Specific Changes

```bash
psql -U postgres -d database_name < backups/fix-security-audit-view.sql
```

## ⚠️ Important Notes

### Before Restoring

1. **Backup current data** before restoring
2. **Test in development** first
3. **Check PostgreSQL version** compatibility
4. **Verify disk space** availability

### Backup Best Practices

1. **Regular backups:** Daily for production
2. **Multiple locations:** Store backups in different locations
3. **Test restores:** Periodically test restoration process
4. **Document changes:** Note what changed since last backup

### File Naming Convention

```
[type]-[description]-[timestamp].sql

Examples:
- complete-database-backup-2025-11-20.sql
- database-schema-complete.sql
- aws-postgres-complete-backup.sql
```

## 📊 Backup Schedule

**Recommended:**
- **Production:** Daily automated backups
- **Development:** Before major changes
- **After migrations:** Immediately after applying migrations
- **Before deployments:** Right before deploying

## 🔐 Security

- ⚠️ Backup files contain **sensitive data**
- Never commit backups to public repositories
- Encrypt backups for long-term storage
- Restrict access to backup files
- Use secure transfer methods

## 🔗 Related

- **Main README:** [`../README.md`](../README.md)
- **Database Scripts:** [`../scripts/database/`](../scripts/database/)
- **Database Docs:** [`../docs/database/`](../docs/database/)

## 📝 Backup Metadata

Create a backup log for tracking:

```
Date: 2025-12-07
Database: soft-skills-training
Size: 15MB
Type: Complete (schema + data)
Source: Production
Notes: Backup before migration to AWS RDS
```

---

**💾 Remember:** Regular backups are your insurance policy against data loss!
