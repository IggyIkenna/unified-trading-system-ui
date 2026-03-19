#!/usr/bin/env bash
#
# setup-dev-project.sh — Create or validate a GCP dev project for Unified Trading System
#
# Creates a new GCP project (or validates existing), links billing, enables APIs,
# copies IAM/service accounts from source, runs setup-buckets.py, and creates
# empty Secret Manager secrets. Idempotent — safe to run multiple times.
#
# Usage:
#   ./setup-dev-project.sh <new_project_id> [source_project_id]
#
# Example:
#   ./setup-dev-project.sh my-dev-project $GCP_PROJECT_ID
#
# Prerequisites: gcloud CLI, authenticated with permissions to create projects
#

set -euo pipefail

# --- Parse arguments ---
NEW_PROJECT_ID="${1:?Usage: $0 <new_project_id> [source_project_id]}"
SOURCE_PROJECT_ID="${2:?Usage: $0 <new_project_id> <source_project_id>}"

# APIs to enable (same as prod)
REQUIRED_APIS=(
  cloudbuild.googleapis.com
  run.googleapis.com
  storage.googleapis.com
  secretmanager.googleapis.com
  pubsub.googleapis.com
  cloudresourcemanager.googleapis.com
  artifactregistry.googleapis.com
  container.googleapis.com
)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=============================================="
echo "Unified Trading System — Dev Project Setup"
echo "=============================================="
echo "New project:   $NEW_PROJECT_ID"
echo "Source project: $SOURCE_PROJECT_ID"
echo "=============================================="
echo

# --- Step 1: Create or validate GCP project ---
echo "[1/8] Creating or validating GCP project..."
if gcloud projects describe "$NEW_PROJECT_ID" &>/dev/null; then
  echo "  Project $NEW_PROJECT_ID already exists."
else
  echo "  Creating project $NEW_PROJECT_ID..."
  gcloud projects create "$NEW_PROJECT_ID" --name="UTS Dev ($NEW_PROJECT_ID)"
  echo "  Project created."
fi

# --- Step 2: Link billing account ---
echo
echo "[2/8] Linking billing account..."
BILLING_ACCOUNTS=$(gcloud billing accounts list --format="value(name)" 2>/dev/null | head -1)
if [ -n "$BILLING_ACCOUNTS" ]; then
  if gcloud billing projects describe "$NEW_PROJECT_ID" &>/dev/null; then
    echo "  Billing already linked."
  else
    gcloud billing projects link "$NEW_PROJECT_ID" --billing-account="$BILLING_ACCOUNTS"
    echo "  Billing linked."
  fi
else
  echo "  WARNING: No billing accounts found. You may need to link manually."
fi

# --- Step 3: Enable APIs ---
echo
echo "[3/8] Enabling required APIs..."
for api in "${REQUIRED_APIS[@]}"; do
  if gcloud services list --project="$NEW_PROJECT_ID" --enabled --filter="name:$api" --format="value(name)" 2>/dev/null | grep -q .; then
    echo "  $api — already enabled"
  else
    echo "  $api — enabling..."
    gcloud services enable "$api" --project="$NEW_PROJECT_ID"
  fi
done

# --- Step 4: Create matching service accounts (before IAM so bindings resolve) ---
echo
echo "[4/8] Creating matching service accounts..."
# Get service accounts from source
SA_LIST=$(gcloud iam service-accounts list --project="$SOURCE_PROJECT_ID" --format="value(email)" 2>/dev/null || true)
for sa_email in $SA_LIST; do
  sa_name=$(echo "$sa_email" | cut -d'@' -f1)
  if gcloud iam service-accounts describe "${sa_name}@${NEW_PROJECT_ID}.iam.gserviceaccount.com" --project="$NEW_PROJECT_ID" &>/dev/null; then
    echo "  $sa_name — already exists"
  else
    echo "  Creating $sa_name..."
    gcloud iam service-accounts create "$sa_name" \
      --project="$NEW_PROJECT_ID" \
      --display-name="$sa_name" 2>/dev/null || echo "    (may need manual creation)"
  fi
done

# --- Step 5: Copy IAM policy from source (replace project references) ---
echo
echo "[5/8] Copying IAM policy from source project..."
echo "  Exporting IAM policy from $SOURCE_PROJECT_ID..."
gcloud projects get-iam-policy "$SOURCE_PROJECT_ID" --format=json > /tmp/iam-source.json 2>/dev/null || {
  echo "  WARNING: Could not export IAM policy. Ensure you have resourcemanager.projects.getIamPolicy on source."
}

if [ -f /tmp/iam-source.json ]; then
  # Replace source project ID with new project ID in bindings
  sed "s/$SOURCE_PROJECT_ID/$NEW_PROJECT_ID/g" /tmp/iam-source.json > /tmp/iam-new.json
  echo "  Applying IAM policy to $NEW_PROJECT_ID..."
  gcloud projects set-iam-policy "$NEW_PROJECT_ID" /tmp/iam-new.json 2>/dev/null || {
    echo "  WARNING: Could not apply full IAM policy. You may need to add bindings manually."
  }
  rm -f /tmp/iam-source.json /tmp/iam-new.json
fi

# --- Step 6: Run setup-buckets.py with new project ID ---
echo
echo "[6/8] Running setup-buckets.py..."
echo "  Bucket naming uses project ID suffix for global uniqueness."
cd "$DEPLOYMENT_ROOT"
GCP_PROJECT_ID="$NEW_PROJECT_ID" python3 scripts/setup-buckets.py --cloud gcp --include-test --project-id "$NEW_PROJECT_ID" || {
  echo "  WARNING: setup-buckets.py had issues. Check configs and try again."
}

# --- Step 7: Copy Secret Manager secret names (create empty placeholders) ---
echo
echo "[7/8] Creating Secret Manager secrets (copy structure from source)..."
SECRET_LIST=$(gcloud secrets list --project="$SOURCE_PROJECT_ID" --format="value(name)" 2>/dev/null || true)
for secret_name in $SECRET_LIST; do
  if gcloud secrets describe "$secret_name" --project="$NEW_PROJECT_ID" &>/dev/null; then
    echo "  $secret_name — already exists"
  else
    echo "  Creating empty secret: $secret_name (fill value manually)"
    if gcloud secrets create "$secret_name" --project="$NEW_PROJECT_ID" --replication-policy=automatic 2>/dev/null; then
      echo -n "PLACEHOLDER_FILL_ME" | gcloud secrets versions add "$secret_name" --project="$NEW_PROJECT_ID" --data-file=- 2>/dev/null || true
    fi
    echo "    To add value: echo -n 'value' | gcloud secrets versions add $secret_name --project=$NEW_PROJECT_ID --data-file=-"
  fi
done
echo "  NOTE: Fill secret values manually for production use."

# --- Step 8: Output .env additions ---
echo
echo "[8/8] Output .env additions"
echo "=============================================="
echo "Add to your .env file:"
echo
echo "GCP_PROJECT_ID_DEV=$NEW_PROJECT_ID"
echo
echo "=============================================="
echo "Dev project setup complete."
