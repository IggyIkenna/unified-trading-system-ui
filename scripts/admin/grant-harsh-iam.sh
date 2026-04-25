#!/usr/bin/env bash
# Grants harshkantariya@odum-research.com the IAM roles he needs across prod
# (central-element-323112) and staging (odum-staging).
#
# The .com identity didn't exist when this was written — Harsh needs to log
# into Google Workspace at least once with harshkantariya@odum-research.com
# (admin.google.com may also need to provision him), then this script can
# run cleanly.
#
# Prod roles mirror what harshkantariya.work@gmail.com already has on
# central-element-323112 (the personal Gmail he's been using until now).
# After this script runs successfully, you can remove the Gmail bindings
# manually if you want a single canonical identity.
#
# Constraint from operator: harsh is a Firebase admin on STAGING ONLY,
# never on prod. Prod gets the operational roles he needs to deploy /
# inspect / debug, but no firebase.admin.

set -euo pipefail

USER_EMAIL="user:harshkantariya@odum-research.com"

PROD_ROLES=(
  roles/artifactregistry.reader
  roles/bigquery.dataEditor
  roles/bigquery.jobUser
  roles/bigquery.user
  roles/browser
  roles/cloudbuild.builds.viewer
  roles/compute.instanceAdmin
  roles/compute.instanceAdmin.v1
  roles/logging.viewer
  roles/run.admin
  roles/secretmanager.secretAccessor
  roles/storage.admin
  roles/storage.objectAdmin
  roles/viewer
)

STAGING_ROLES=(
  roles/firebase.admin
)

echo "=== Granting prod roles on central-element-323112 ==="
for role in "${PROD_ROLES[@]}"; do
  echo "  + $role"
  gcloud projects add-iam-policy-binding central-element-323112 \
    --member="$USER_EMAIL" \
    --role="$role" \
    --condition=None \
    --quiet > /dev/null
done

echo
echo "=== Granting staging roles on odum-staging ==="
for role in "${STAGING_ROLES[@]}"; do
  echo "  + $role"
  gcloud projects add-iam-policy-binding odum-staging \
    --member="$USER_EMAIL" \
    --role="$role" \
    --condition=None \
    --quiet > /dev/null
done

echo
echo "=== Done. Verify with: ==="
echo "  gcloud projects get-iam-policy central-element-323112 --flatten='bindings[].members' --format='value(bindings.role)' --filter='bindings.members:harshkantariya@odum-research.com'"
echo "  gcloud projects get-iam-policy odum-staging --flatten='bindings[].members' --format='value(bindings.role)' --filter='bindings.members:harshkantariya@odum-research.com'"
