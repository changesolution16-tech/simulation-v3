#!/bin/bash

# This script helps convert sql.query() calls to postgres template literals
# Note: This is a helper to identify patterns, manual review still needed

echo "Files with sql.query patterns:"
grep -r "sql\.query" src/app/api/ --include="*.ts" -l

echo ""
echo "Count of sql.query occurrences:"
grep -r "sql\.query" src/app/api/ --include="*.ts" | wc -l

echo ""
echo "Pattern examples:"
grep -r "sql\.query" src/app/api/ --include="*.ts" -n | head -20
