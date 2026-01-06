#!/bin/bash

# Batch fix SQL queries in API routes
# This script converts sql.query() calls to postgres template literals

FILES=(
  "src/app/api/competencies/[id]/route.ts"
  "src/app/api/competencies/learner/[learnerId]/route.ts"
  "src/app/api/assignments/route.ts"
  "src/app/api/assignments/[id]/route.ts"
  "src/app/api/cohorts/route.ts"
  "src/app/api/cohorts/[id]/route.ts"
  "src/app/api/cohorts/[id]/members/route.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    # Replace result.rows with result
    sed -i 's/result\.rows\[0\]/result[0]/g' "$file"
    sed -i 's/result\.rows\.length/result.length/g' "$file"
    sed -i 's/result\.rows/result/g' "$file"

    # Note: sql.query() to template literal conversion requires manual intervention
    # due to the complexity of parameter substitution
    echo "✓ Partial fix applied to $file"
    echo "  Manual review needed for sql.query() -> template literal conversion"
  else
    echo "✗ File not found: $file"
  fi
done

echo ""
echo "Remaining sql.query occurrences:"
grep -r "sql\.query" src/app/api/ --include="*.ts" -l 2>/dev/null || echo "None found"
