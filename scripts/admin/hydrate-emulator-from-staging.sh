#!/usr/bin/env bash
# hydrate-emulator-from-staging.sh — pull a Firestore + Auth snapshot from
# the odum-staging GCP project and stage it for the local Firebase
# Emulator Suite to import on boot.
#
# Result: `.local-dev-cache/firestore-staging-snapshot/` (Firestore export)
#       + `.local-dev-cache/auth-staging-export.json`   (Auth users)
# both ignored by git.
#
# Run after a fresh seed of staging or any time you want local dev to
# reflect current staging shape. Then re-boot the emulator with the
# `--import` flag (firebase.json points at the cache dir by default).
#
# Why two formats: gcloud Firestore export uses LevelDB on GCS; the
# emulator can read it back with --import. Auth doesn't have a
# server-side export so we pull it via Admin SDK and dump JSON.
#
# SSOT: codex/14-playbooks/authentication/firebase-local.md
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UI_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CACHE_DIR="${UI_ROOT}/.local-dev-cache"
mkdir -p "$CACHE_DIR"

STAGING_PROJECT="odum-staging"
EXPORT_BUCKET="${EXPORT_BUCKET:-gs://odum-staging.firebasestorage.app/firestore-exports}"
SNAPSHOT_NAME="staging-snapshot-$(date -u +%Y%m%d-%H%M%S)"
SNAPSHOT_URI="${EXPORT_BUCKET}/${SNAPSHOT_NAME}"
LOCAL_FIRESTORE_DIR="${CACHE_DIR}/firestore-staging-snapshot"
AUTH_EXPORT_FILE="${CACHE_DIR}/auth-staging-export.json"

echo "=== hydrate-emulator-from-staging ==="
echo "  staging project : ${STAGING_PROJECT}"
echo "  GCS export uri  : ${SNAPSHOT_URI}"
echo "  local firestore : ${LOCAL_FIRESTORE_DIR}"
echo "  local auth      : ${AUTH_EXPORT_FILE}"
echo

if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud not on PATH. Install Google Cloud SDK." >&2
  exit 1
fi
if ! command -v gsutil >/dev/null 2>&1; then
  echo "ERROR: gsutil not on PATH. Install Google Cloud SDK." >&2
  exit 1
fi
if ! command -v firebase >/dev/null 2>&1; then
  echo "ERROR: firebase CLI not on PATH. Install via 'npm i -g firebase-tools' or use 'npx firebase'." >&2
  exit 1
fi

# 1. Firestore: trigger a managed export to GCS, then mirror locally.
echo "[1/3] Exporting Firestore from ${STAGING_PROJECT} → ${SNAPSHOT_URI}"
gcloud firestore export "${SNAPSHOT_URI}" --project="${STAGING_PROJECT}" --async 2>&1 | tee /tmp/firestore-export.out
OPERATION=$(awk '/operations\//{print $NF; exit}' /tmp/firestore-export.out || true)
if [[ -n "${OPERATION}" ]]; then
  echo "[1/3] Waiting on operation ${OPERATION}…"
  gcloud firestore operations wait "${OPERATION}" --project="${STAGING_PROJECT}"
fi

echo "[1/3] Downloading export to ${LOCAL_FIRESTORE_DIR}"
rm -rf "${LOCAL_FIRESTORE_DIR}"
mkdir -p "${LOCAL_FIRESTORE_DIR}"
gsutil -m cp -r "${SNAPSHOT_URI}/*" "${LOCAL_FIRESTORE_DIR}/"

# 2. Auth: dump users via firebase CLI (uses ADC).
echo "[2/3] Exporting Firebase Auth users from ${STAGING_PROJECT}"
firebase auth:export "${AUTH_EXPORT_FILE}" --project="${STAGING_PROJECT}"

# 3. Wire firebase.json so emulator boots with these on next start.
echo "[3/3] Done. To boot emulator with this data:"
echo
echo "    firebase emulators:start \\"
echo "      --only auth,firestore,storage \\"
echo "      --project=odum-local-dev \\"
echo "      --import=${LOCAL_FIRESTORE_DIR} \\"
echo "      --export-on-exit=${LOCAL_FIRESTORE_DIR}"
echo
echo "  Auth pool comes from: ${AUTH_EXPORT_FILE}"
echo "    firebase auth:import ${AUTH_EXPORT_FILE} --project=odum-local-dev"
echo "  (run that once; subsequent boots persist via export-on-exit if firebase.json"
echo "  declares emulators.auth.export-on-exit=true)"
echo
echo "Or just run: bash scripts/dev-tiers.sh --tier 0   (auto-imports the cache)"
