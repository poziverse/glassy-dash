#!/bin/bash

# ==========================================
# Database Restoration Script
# GlassKeep - Quick Database Migration
# ==========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==========================================
# Functions
# ==========================================

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ==========================================
# Main Script
# ==========================================

print_header "GlassKeep Database Restoration"

# Check if sqlite3 is installed
if ! command -v sqlite3 &> /dev/null; then
    print_error "sqlite3 is not installed"
    echo "Install with: sudo apt-get install sqlite3"
    exit 1
fi

print_success "sqlite3 is installed"

# Check directory
if [ ! -d "data" ]; then
    print_error "data directory not found"
    echo "Please run this script from the GLASSYDASH root directory"
    exit 1
fi

print_success "Working in correct directory"

# Backup current database
print_header "Backing Up Current Database"
BACKUP_DIR="data/backups"
mkdir -p "$BACKUP_DIR"

BACKUP_NAME="pre-migration-$(date +%Y-%m-%dT%H-%M-%S).db"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

if [ -f "data/notes.db" ]; then
    cp "data/notes.db" "$BACKUP_PATH"
    print_success "Current database backed up to: $BACKUP_NAME"
else
    print_warning "No current database found (new installation)"
fi

# Ask for old database path
print_header "Locate Old Database"
echo ""
echo "Please provide the path to your old database file"
echo "This should be a .db file from your previous GlassKeep installation"
echo ""

read -p "Old database path: " OLD_DB_PATH

# Validate old database exists
if [ ! -f "$OLD_DB_PATH" ]; then
    print_error "File not found: $OLD_DB_PATH"
    exit 1
fi

# Verify it's a valid SQLite database
print_header "Validating Old Database"
if ! sqlite3 "$OLD_DB_PATH" "PRAGMA integrity_check;" > /dev/null 2>&1; then
    print_error "Invalid SQLite database file"
    echo "Please verify: $OLD_DB_PATH"
    exit 1
fi

print_success "Old database is valid"

# Show database info
echo ""
echo "Old Database Information:"
sqlite3 "$OLD_DB_PATH" <<EOF
.mode column
.headers on
SELECT 
    'Users' as Table, 
    COUNT(*) as Count 
FROM users
UNION ALL
SELECT 'Notes', COUNT(*) FROM notes;
EOF

echo ""

# Confirm restoration
print_header "Confirm Restoration"
read -p "Do you want to restore this database? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo ""
    print_warning "Restoration cancelled"
    exit 0
fi

# Restore database
print_header "Restoring Database"
cp "$OLD_DB_PATH" "data/notes.db"

print_success "Database restored successfully"

# Run migrations
print_header "Running Database Migrations"
cd server
npm run migrate

cd ..

# Verify restoration
print_header "Verifying Restoration"
USER_COUNT=$(sqlite3 "data/notes.db" "SELECT COUNT(*) FROM users;")
NOTE_COUNT=$(sqlite3 "data/notes.db" "SELECT COUNT(*) FROM notes;")

echo ""
echo "Restored Database Statistics:"
echo "  Users: $USER_COUNT"
echo "  Notes: $NOTE_COUNT"
echo ""

print_success "Restoration complete!"

# Next steps
print_header "Next Steps"
echo ""
echo "1. Start the application:"
echo "   npm run dev"
echo ""
echo "2. Open browser and verify:"
echo "   - Users can log in with old credentials"
echo "   - All notes are visible"
echo "   - Note content is intact"
echo ""
echo "3. If any issues occur:"
echo "   - Check the backup at: $BACKUP_PATH"
echo "   - Review logs in: docs/DATABASE_MIGRATION_2026-01-26.md"
echo ""

print_success "All done!"