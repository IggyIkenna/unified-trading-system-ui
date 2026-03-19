#!/usr/bin/env bash
#
# cleanup-untagged-images.sh — Delete untagged images from GCP Artifact Registry
#
# Images pushed by CI/CD accumulate untagged layers over time, consuming storage quota.
# This script deletes all untagged (sha256-only) images older than N days.
# Tagged images (latest, v1.2.3, commit SHAs) are always preserved.
#
# Usage:
#   GCP_PROJECT_ID=central-element-323112 ./cleanup-untagged-images.sh [options]
#
# Options:
#   --location REGION       AR location (default: asia-northeast1)
#   --repo NAME             AR repository name (default: all repos listed)
#   --days-old N            Only delete images older than N days (default: 7)
#   --dry-run               List what would be deleted without deleting
#   --keep-count N          Always keep N most recent untagged images per service (default: 2)
#

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project)}"
LOCATION="${AR_LOCATION:-asia-northeast1}"
REPO_FILTER=""
DAYS_OLD=7
DRY_RUN=false
KEEP_COUNT=2

while [[ $# -gt 0 ]]; do
    case "$1" in
        --location) LOCATION="$2"; shift 2 ;;
        --repo) REPO_FILTER="$2"; shift 2 ;;
        --days-old) DAYS_OLD="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        --keep-count) KEEP_COUNT="$2"; shift 2 ;;
        *) shift ;;
    esac
done

echo "================================================="
echo "Artifact Registry — Untagged Image Cleanup"
echo "================================================="
echo "Project:    $PROJECT_ID"
echo "Location:   $LOCATION"
echo "Repo:       ${REPO_FILTER:-<all>}"
echo "Days old:   $DAYS_OLD"
echo "Keep count: $KEEP_COUNT (most recent untagged per image)"
echo "Dry-run:    $DRY_RUN"
echo "================================================="
echo

gcloud config set project "$PROJECT_ID" --quiet

# ---------------------------------------------------------------------------
# List repos
# ---------------------------------------------------------------------------
if [[ -n "$REPO_FILTER" ]]; then
    REPOS=("$REPO_FILTER")
else
    REPOS=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && REPOS+=("$line")
    done < <(
        gcloud artifacts repositories list \
            --project="$PROJECT_ID" \
            --location="$LOCATION" \
            --format="value(name)" 2>/dev/null | \
            sed 's|.*/repositories/||'
    )
fi

if [[ ${#REPOS[@]} -eq 0 ]]; then
    echo "No Artifact Registry repositories found in $LOCATION"
    exit 0
fi

echo "Found ${#REPOS[@]} repository(ies): ${REPOS[*]}"
echo

total_deleted=0
total_freed_mb=0
total_errors=0

# ---------------------------------------------------------------------------
for repo in "${REPOS[@]}"; do
    echo "--- Repo: $repo ---"

    # List all images in the repo
    images=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && images+=("$line")
    done < <(
        gcloud artifacts docker images list "${LOCATION}-docker.pkg.dev/${PROJECT_ID}/${repo}" \
            --project="$PROJECT_ID" \
            --format="value(package)" 2>/dev/null | sort -u
    )

    if [[ ${#images[@]} -eq 0 ]]; then
        echo "  No images found"
        continue
    fi

    for image in "${images[@]}"; do
        # List untagged versions (digest only, no tags)
        untagged=()
        while IFS= read -r line; do
            [[ -n "$line" ]] && untagged+=("$line")
        done < <(
            gcloud artifacts docker images list "$image" \
                --project="$PROJECT_ID" \
                --include-tags \
                --format="csv[no-heading](version,tags,createTime)" 2>/dev/null | \
            awk -F',' '$2 == "" { print $1 "," $NF }' | \
            sort -t',' -k2 -r  # newest first
        )

        if [[ ${#untagged[@]} -eq 0 ]]; then
            echo "  $(basename "$image"): no untagged images"
            continue
        fi

        echo "  $(basename "$image"): ${#untagged[@]} untagged image(s)"

        kept=0
        cutoff_epoch=$(date -d "$DAYS_OLD days ago" +%s 2>/dev/null || \
                       python3 -c "import time; print(int(time.time()) - $DAYS_OLD * 86400)")

        for entry in "${untagged[@]}"; do
            digest=$(echo "$entry" | cut -d',' -f1)
            create_time=$(echo "$entry" | cut -d',' -f2)

            # Parse create time to epoch
            img_epoch=$(python3 -c "
import dateutil.parser, calendar
try:
    dt = dateutil.parser.parse('$create_time')
    print(calendar.timegm(dt.timetuple()))
except Exception:
    print(0)
" 2>/dev/null || echo 0)

            # Keep the N most recent
            if [[ "$kept" -lt "$KEEP_COUNT" ]]; then
                echo "    [KEEP] $digest (keep-count: $((kept+1))/$KEEP_COUNT)"
                ((kept++)) || true
                continue
            fi

            # Keep if newer than cutoff
            if [[ "$img_epoch" -gt "$cutoff_epoch" ]]; then
                echo "    [KEEP] $digest (newer than ${DAYS_OLD}d)"
                continue
            fi

            if [[ "$DRY_RUN" == "true" ]]; then
                echo "    [DRY]  Would delete: $image@$digest (created: $create_time)"
                ((total_deleted++)) || true
            else
                echo "    [DELETE] $image@$digest"
                if gcloud artifacts docker images delete "${image}@${digest}" \
                        --project="$PROJECT_ID" \
                        --delete-tags \
                        --quiet 2>&1; then
                    ((total_deleted++)) || true
                else
                    echo "    [ERROR] Failed to delete $digest"
                    ((total_errors++)) || true
                fi
            fi
        done
    done
    echo
done

echo "================================================="
echo "Summary"
echo "================================================="
echo "Images deleted/would-delete: $total_deleted"
echo "Errors: $total_errors"
echo ""
if [[ "$DRY_RUN" == "true" ]]; then
    echo "Dry-run complete. Re-run without --dry-run to delete."
fi
