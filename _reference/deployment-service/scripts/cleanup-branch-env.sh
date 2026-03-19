#!/usr/bin/env bash
#
# cleanup-branch-env.sh — Clean up branch-specific GCP resources when a feature branch is deleted
#
# Deletes Cloud Run services tagged with the branch, branch-specific VMs,
# optionally Artifact Registry images, and the UTDv3 feature branch (if it exists).
#
# Usage:
#   ./cleanup-branch-env.sh <branch_name> <project_id> [--delete-images] [--force]
#
# Example:
#   ./cleanup-branch-env.sh feat-new-instrument my-dev-project --force
#
# Options:
#   --delete-images  Also delete branch-tagged images from Artifact Registry
#   --force           Skip confirmation prompt
#

set -euo pipefail

# --- Parse arguments ---
BRANCH_NAME=""
PROJECT_ID=""
DELETE_IMAGES=false
FORCE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --delete-images)
      DELETE_IMAGES=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    -*)
      echo "Unknown option: $1"
      exit 1
      ;;
    *)
      if [ -z "$BRANCH_NAME" ]; then
        BRANCH_NAME="$1"
      elif [ -z "$PROJECT_ID" ]; then
        PROJECT_ID="$1"
      fi
      shift
      ;;
  esac
done

if [ -z "$BRANCH_NAME" ] || [ -z "$PROJECT_ID" ]; then
  echo "Usage: $0 <branch_name> <project_id> [--delete-images] [--force]"
  echo "Example: $0 feat-new-instrument GCP_PROJECT_ID_DEV --force"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CLEANED=()

echo "=============================================="
echo "Branch Environment Cleanup"
echo "=============================================="
echo "Branch:   $BRANCH_NAME"
echo "Project:  $PROJECT_ID"
echo "=============================================="

# --- Confirmation (unless --force) ---
if [ "$FORCE" != "true" ]; then
  echo
  read -r -p "Proceed with cleanup? [y/N] " response
  if [[ ! "$response" =~ ^[yY]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

echo

# --- Step 1: Delete Cloud Run services tagged with this branch ---
echo "[1/5] Deleting Cloud Run services tagged with branch..."
SERVICES=$(gcloud run services list --project="$PROJECT_ID" --region=asia-northeast1 --format="value(metadata.name)" 2>/dev/null || true)
for svc in $SERVICES; do
  # Check if service has label or name contains branch
  if [[ "$svc" == *"$BRANCH_NAME"* ]]; then
    echo "  Deleting: $svc"
    gcloud run services delete "$svc" --project="$PROJECT_ID" --region=asia-northeast1 --quiet 2>/dev/null && CLEANED+=("Cloud Run: $svc") || true
  fi
done
# Also check other common regions
for region in us-central1 europe-west1; do
  REGION_SERVICES=$(gcloud run services list --project="$PROJECT_ID" --region="$region" --format="value(metadata.name)" 2>/dev/null || true)
  for svc in $REGION_SERVICES; do
    if [[ "$svc" == *"$BRANCH_NAME"* ]]; then
      echo "  Deleting: $svc ($region)"
      gcloud run services delete "$svc" --project="$PROJECT_ID" --region="$region" --quiet 2>/dev/null && CLEANED+=("Cloud Run: $svc") || true
    fi
  done
done
echo "  Done."

# --- Step 2: Delete branch-specific VMs (if named with branch) ---
echo
echo "[2/5] Deleting branch-specific VMs..."
ZONES=$(gcloud compute zones list --project="$PROJECT_ID" --format="value(name)" 2>/dev/null || true)
for zone in $ZONES; do
  INSTANCES=$(gcloud compute instances list --project="$PROJECT_ID" --zones="$zone" --filter="name~$BRANCH_NAME" --format="value(name)" 2>/dev/null || true)
  for inst in $INSTANCES; do
    echo "  Deleting VM: $inst ($zone)"
    gcloud compute instances delete "$inst" --project="$PROJECT_ID" --zone="$zone" --quiet 2>/dev/null && CLEANED+=("VM: $inst") || true
  done
done
echo "  Done."

# --- Step 3: Optionally delete branch images from Artifact Registry ---
if [ "$DELETE_IMAGES" = "true" ]; then
  echo
  echo "[3/5] Deleting branch images from Artifact Registry..."
  REPOS=$(gcloud artifacts repositories list --project="$PROJECT_ID" --format="value(name)" 2>/dev/null || true)
  for repo in $REPOS; do
    LOCATION=$(gcloud artifacts repositories describe "$repo" --project="$PROJECT_ID" --format="value(location)" 2>/dev/null || true)
    IMAGES=$(gcloud artifacts docker images list "${LOCATION}-docker.pkg.dev/${PROJECT_ID}/${repo}" --include-tags --format="value(package)" 2>/dev/null || true)
    for img in $IMAGES; do
      if [[ "$img" == *"$BRANCH_NAME"* ]] || [[ "$img" == *"${BRANCH_NAME//-/_}"* ]]; then
        echo "  Deleting image: $img"
        gcloud artifacts docker images delete "$img" --quiet 2>/dev/null && CLEANED+=("Image: $img") || true
      fi
    done
  done
  echo "  Done."
else
  echo
  echo "[3/5] Skipping Artifact Registry (use --delete-images to include)"
fi

# --- Step 4: Delete UTDv3 feature branch (if it exists) ---
echo
echo "[4/5] Deleting UTDv3 feature branch (if exists)..."
if git -C "$DEPLOYMENT_ROOT" rev-parse --verify "origin/$BRANCH_NAME" &>/dev/null; then
  echo "  Deleting branch: $BRANCH_NAME"
  git -C "$DEPLOYMENT_ROOT" push origin --delete "$BRANCH_NAME" 2>/dev/null && CLEANED+=("Branch: $BRANCH_NAME") || echo "  (push may require auth)"
else
  echo "  Branch $BRANCH_NAME does not exist or already deleted."
fi
echo "  Done."

# --- Step 5: Summary ---
echo
echo "[5/5] Summary"
echo "=============================================="
if [ ${#CLEANED[@]} -eq 0 ]; then
  echo "No resources cleaned up (or none matched)."
else
  echo "Cleaned up:"
  for item in "${CLEANED[@]}"; do
    echo "  - $item"
  done
fi
echo "=============================================="
echo "Cleanup complete."
