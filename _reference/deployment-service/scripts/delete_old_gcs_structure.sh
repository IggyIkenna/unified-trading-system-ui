#!/bin/bash
# DELETE Old GCS Structure (Nested Folders)
# Run AFTER regenerating all data with new flat structure
#
# WARNING: This DELETES data! Only run when:
# 1. New structure is fully populated
# 2. All services updated to use new structure
# 3. Data validated in new location

set -e

PROJECT="${GCP_PROJECT_ID:?GCP_PROJECT_ID required}"
CATEGORIES=("cefi" "tradfi" "defi")

echo "========================================="
echo "DELETE OLD GCS STRUCTURE (NESTED FOLDERS)"
echo "========================================="
echo
echo "This will delete the nested folder structure:"
echo "  by_date/day={date}/feature_group={group}/timeframe={tf}/{inst}.parquet"
echo
echo "New structure (already generated) should be:"
echo "  by_date/day={date}/{instrument}.parquet"
echo "  (with feature_group, timeframe as data columns)"
echo
echo "⚠️  WARNING: This is IRREVERSIBLE!"
echo
read -p "Type 'DELETE' to confirm: " confirm

if [ "$confirm" != "DELETE" ]; then
    echo "Aborted"
    exit 1
fi

echo
echo "Starting deletion..."

for CATEGORY in "${CATEGORIES[@]}"; do
    BUCKET="features-delta-one-${CATEGORY}-${PROJECT}"

    echo
    echo "Processing ${BUCKET}..."

    # Check if bucket exists
    if ! gsutil ls gs://${BUCKET}/ > /dev/null 2>&1; then
        echo "  Bucket not found, skipping"
        continue
    fi

    # List all day folders with nested structure
    # Pattern: by_date/day=*/feature_group=*
    # This identifies old structure (has feature_group subfolder)

    echo "  Finding old structure folders..."
    OLD_FOLDERS=$(gsutil ls -r gs://${BUCKET}/by_date/ | grep -E "feature_group-|feature_group=" | grep "/$" | sort -u)

    if [ -z "$OLD_FOLDERS" ]; then
        echo "  No old structure found"
        continue
    fi

    COUNT=$(echo "$OLD_FOLDERS" | wc -l)
    echo "  Found $COUNT old structure folders"

    # Safety check: Verify new structure exists
    echo "  Verifying new structure exists..."
    NEW_FILES=$(gsutil ls gs://${BUCKET}/by_date/day=2023-01-01/*.parquet 2>/dev/null | wc -l)

    if [ "$NEW_FILES" -eq 0 ]; then
        echo "  ⚠️  WARNING: No files in new structure!"
        echo "  Aborting deletion for safety"
        continue
    fi

    echo "  ✅ New structure verified (${NEW_FILES} files in sample day)"

    # Delete old structure
    echo "  Deleting old structure..."
    for FOLDER in $OLD_FOLDERS; do
        echo "    Deleting $FOLDER"
        gsutil -m rm -r "$FOLDER" 2>&1 | grep -v "No URLs matched" || true
    done

    echo "  ✅ ${BUCKET} cleanup complete"
done

echo
echo "========================================="
echo "✅ OLD STRUCTURE DELETED"
echo "========================================="
echo
echo "Verification:"
echo "  gsutil ls gs://features-delta-one-cefi-${PROJECT}/by_date/day=2023-01-01/"
echo "  Should show: *.parquet files (flat)"
echo "  Should NOT show: feature_group-* or feature_group=* folders"
