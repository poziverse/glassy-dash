# Database Migration Guide - January 26, 2026

## Overview

Yes! You can restore users and notes from your old database. The GlassKeep application has a complete backup/restore system that makes this easy.

---

## Method 1: Using Built-in Restore System (Recommended)

### Step 1: Prepare Your Old Database

1. **Locate your old database file** (saved from the deleted site)
   - Should be named: `notes.db` or similar
   - Verify it's a valid SQLite database

2. **Place it in the backup directory:**
   ```bash
   cd glassy-dash/GLASSYDASH
   mkdir -p data/backups
   
   # Copy your old database to backups directory
   cp /path/to/your/old/notes.db data/backups/notes-old-backup.db
   ```

### Step 2: Restore the Database

```bash
cd glassy-dash/GLASSYDASH/server

# Run restore command
node migrations/backup.js restore ../data/backups/notes-old-backup.db
```

**What this does:**
- Creates automatic pre-restore backup of current database
- Validates the old database file
- Restores all users and notes
- Logs restoration details

### Step 3: Verify Restoration

```bash
# Check database integrity
sqlite3 ../data/notes.db "PRAGMA integrity_check;"

# Verify users exist
sqlite3 ../data/notes.db "SELECT COUNT(*) FROM users;"

# Verify notes exist
sqlite3 ../data/notes.db "SELECT COUNT(*) FROM notes;"

# List all users
sqlite3 ../data/notes.db "SELECT id, username, email FROM users;"
```

### Step 4: Restart Application

```bash
cd glassy-dash/GLASSYDASH
npm run dev
```

**Note:** The application will start automatically and load the restored database.

---

## Method 2: Direct Database Replacement (Quick)

If you prefer to manually replace the database:

```bash
# 1. Stop the application if running

# 2. Backup current database (optional but recommended)
cd glassy-dash/GLASSYDASH/data
cp notes.db notes.db.before-migration

# 3. Replace with your old database
cp /path/to/your/old/notes.db notes.db

# 4. Verify database
sqlite3 notes.db "PRAGMA integrity_check;"

# 5. Start application
cd ..
npm run dev
```

---

## Method 3: Merging Databases (Advanced)

If you want to merge old data with new data (e.g., keep new users but add old notes):

```bash
# 1. Install SQLite merge tool
npm install -g sqlite3

# 2. Export data from old database
sqlite3 data/backups/notes-old-backup.db <<EOF
.mode json
.once old_users.json
SELECT * FROM users;

.mode json
.once old_notes.json
SELECT * FROM notes;
EOF

# 3. Import into new database (you'll need to update IDs to avoid conflicts)
# This requires careful handling of primary keys and foreign keys
# Consider using the full restore instead for simplicity
```

**Recommendation:** Use Method 1 or 2 for simplicity and data integrity.

---

## What Gets Restored

When you restore the old database, you'll get:

### Users Table
- ✅ All user accounts
- ✅ Email addresses
- ✅ Password hashes (users can log in with old credentials)
- ✅ Admin status
- ✅ Creation timestamps

### Notes Table
- ✅ All notes (text and checklist types)
- ✅ Note titles and content
- ✅ Tags
- ✅ Images (base64 encoded in database)
- ✅ Colors and pinning
- ✅ Position/ordering
- ✅ Timestamps
- ✅ Soft-deleted notes (trash)

### Related Tables
- ✅ Checklist items
- ✅ Note collaborators
- ✅ User settings
- ✅ Note views

---

## Schema Compatibility Check

Your old database should work if it was from:

### Compatible Versions
- ✅ Version 4 (current schema with soft delete)
- ✅ Version 3 (collaboration features)
- ✅ Version 2 (with indexes)
- ✅ Version 1 (initial schema)

### Automatic Migration
If your old database is from an earlier version, the migration system will automatically upgrade it to the current schema (Version 4) when you start the application.

```bash
# Migrations run automatically on startup
# You can also run manually:
cd glassy-dash/GLASSYDASH/server
npm run migrate
```

---

## Troubleshooting

### Issue: "Database file not found"

**Solution:**
```bash
# Check if database exists
ls -lh data/backups/

# Verify file permissions
chmod 644 data/backups/notes-old-backup.db
```

### Issue: "Invalid backup file: not a valid SQLite database"

**Solution:**
```bash
# Verify database integrity
sqlite3 data/backups/notes-old-backup.db "PRAGMA integrity_check;"

# Check file type
file data/backups/notes-old-backup.db
```

### Issue: "Foreign key constraint failed" on startup

**Solution:** This means your old database has orphaned records. Run:
```bash
sqlite3 data/notes.db "PRAGMA foreign_keys=OFF;"
# Then restart the application
```

### Issue: Users can't log in after restoration

**Cause:** Password hashing algorithm changed between versions

**Solution:** Users will need to reset their passwords:
```bash
# Admin can reset passwords via admin panel
# Or users can use "forgot password" feature if implemented
```

---

## Data Validation Checklist

After restoration, verify:

- [ ] Users can log in with old credentials
- [ ] All notes are visible
- [ ] Note content is intact
- [ ] Images in notes display correctly
- [ ] Checklists work properly
- [ ] Tags are preserved
- [ ] Collaboration features work
- [ ] User settings are applied

---

## Backup Current Database Before Migration

**Always backup before making changes:**

```bash
cd glassy-dash/GLASSYDASH/server
npm run db:backup
```

This creates: `data/backups/notes-YYYY-MM-DDTHH-mm-ss.db`

---

## Alternative: Export/Import (Partial Migration)

If you only want to restore specific data:

### Export from Old Database

```bash
sqlite3 data/backups/notes-old-backup.db <<EOF
.mode csv
.headers on
.output notes_export.csv
SELECT * FROM notes;

.mode csv
.headers on
.output users_export.csv
SELECT * FROM users;
EOF
```

### Import to New Database

```bash
# You'll need to create a custom import script
# Or use SQLite import tools
sqlite3 data/notes.db ".import notes_export.csv notes"
```

---

## Best Practices

### 1. Test Restoration First
```bash
# Restore to a test environment first
# Verify everything works
# Then restore to production
```

### 2. Keep Multiple Backups
```bash
# Keep several backup versions
# In case one is corrupted
```

### 3. Document the Process
```bash
# Note which backup you restored from
# Document any issues encountered
# Keep for future reference
```

### 4. Verify Users
```bash
# Have users test login
# Verify their data is intact
# Address any issues promptly
```

---

## Quick Reference Commands

```bash
# List available backups
cd glassy-dash/GLASSYDASH/server
node migrations/backup.js list

# Restore from backup
node migrations/backup.js restore ../data/backups/notes-old-backup.db

# Create backup
node migrations/backup.js create

# Check database
sqlite3 ../data/notes.db "SELECT COUNT(*) FROM users;"

# Verify schema
sqlite3 ../data/notes.db ".schema"
```

---

## Support

If you encounter issues:

1. Check the documentation: `docs/DATABASE_SCHEMA.md`
2. Review the backup script: `server/migrations/backup.js`
3. Check database integrity: `PRAGMA integrity_check;`
4. Examine server logs for error messages

---

## Summary

✅ **Yes, you can restore your old database**
✅ **Built-in restore system available**
✅ **Automatic schema migration**
✅ **All users and notes will be restored**
✅ **Simple process with validation**

**Recommended Method:** Use the built-in restore system (Method 1)

**Estimated Time:** 5-10 minutes

**Complexity:** Low

**Risk:** Low (automatic pre-restore backup created)