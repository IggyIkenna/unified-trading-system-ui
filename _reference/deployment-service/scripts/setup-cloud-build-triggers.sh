#!/usr/bin/env bash
# Phase 4: Artifact Registry Triggers – CLI setup
# Creates Cloud Build triggers for all libraries and services via gcloud.
# Run from deployment-service or workspace root.

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID required}"
REGION="${GCP_REGION:-asia-northeast1}"
CONNECTION="${CB_CONNECTION:-iggyikenna-github}"
GITHUB_OWNER="${GITHUB_OWNER:-IggyIkenna}"

# Ensure unified-libraries Python repo and build-metadata bucket exist (run once)
ensure_artifact_infra() {
  echo "=== Ensuring Artifact Registry and GCS infra ==="
  gcloud artifacts repositories describe unified-libraries --location="$REGION" --project="$PROJECT_ID" &>/dev/null || \
    gcloud artifacts repositories create unified-libraries \
      --repository-format=python \
      --location="$REGION" \
      --project="$PROJECT_ID" \
      --description="Unified Python libraries"
  gsutil ls "gs://${PROJECT_ID}-build-metadata/" &>/dev/null || \
    gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://${PROJECT_ID}-build-metadata/" 2>/dev/null || true
  echo "✓ Artifact Registry and GCS ready"
}

# Build order (Phase 4.1): libraries first, then services
# Tier 1–4: Libraries (must publish to Artifact Registry before dependent services)
LIBRARIES_ORDER=(
  unified-config-interface
  unified-events-interface
  unified-trading-library
  unified-domain-client
  unified-market-interface
  unified-trade-execution-interface
  execution-algo-library
)

# Tier 5–9: Services (depend on libraries from Artifact Registry)
SERVICES_ORDER=(
  instruments-service
  market-tick-data-handler
  market-data-processing-service
  execution-services
  strategy-service
  features-delta-one-service
  features-volatility-service
  features-onchain-service
  features-calendar-service
  ml-training-service
  ml-inference-service
)

# All repos that need triggers (libraries + services)
ALL_REPOS=("${LIBRARIES_ORDER[@]}" "${SERVICES_ORDER[@]}")

repo_uri() {
  echo "https://github.com/${GITHUB_OWNER}/${1}.git"
}

repo_resource() {
  echo "projects/${PROJECT_ID}/locations/${REGION}/connections/${CONNECTION}/repositories/${1}"
}

add_repo_if_missing() {
  local repo="$1"
  local uri
  uri=$(repo_uri "$repo")
  if gcloud builds repositories describe "$repo" \
    --connection="$CONNECTION" \
    --region="$REGION" \
    --project="$PROJECT_ID" 2>/dev/null; then
    echo "✓ Repository $repo already in connection"
    return 0
  fi
  echo "Adding repository $repo to connection..."
  if ! gcloud builds repositories create "$repo" \
    --remote-uri="$uri" \
    --connection="$CONNECTION" \
    --region="$REGION" \
    --project="$PROJECT_ID"; then
    echo "⚠ $repo: Repo may not exist or Cloud Build GitHub App lacks access. Add via GCP Console > Cloud Build > Repositories > Link repository"
    return 1
  fi
}

create_trigger_if_missing() {
  local repo="$1"
  local trigger_name="${repo}-build"
  local repo_res
  repo_res=$(repo_resource "$repo")
  if gcloud builds triggers describe "$trigger_name" \
    --region="$REGION" \
    --project="$PROJECT_ID" 2>/dev/null; then
    echo "✓ Trigger $trigger_name already exists"
    return 0
  fi
  # Repo must exist in connection first
  if ! gcloud builds repositories describe "$repo" \
    --connection="$CONNECTION" \
    --region="$REGION" \
    --project="$PROJECT_ID" 2>/dev/null; then
    echo "⚠ Skipping trigger $trigger_name (repo not in connection)"
    return 1
  fi
  echo "Creating trigger $trigger_name..."
  gcloud builds triggers create github \
    --name="$trigger_name" \
    --repository="$repo_res" \
    --branch-pattern="^main$" \
    --build-config="cloudbuild.yaml" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --description="Auto-publish ${repo} to Artifact Registry on main push"
}

run_build_ordered() {
  echo "Running builds in dependency order..."
  for repo in "${LIBRARIES_ORDER[@]}" "${SERVICES_ORDER[@]}"; do
    local trigger_name="${repo}-build"
    if ! gcloud builds triggers describe "$trigger_name" \
      --region="$REGION" \
      --project="$PROJECT_ID" 2>/dev/null; then
      echo "⚠ Skipping $repo (trigger not found)"
      continue
    fi
    echo "Running $trigger_name..."
    gcloud builds triggers run "$trigger_name" \
      --branch="main" \
      --region="$REGION" \
      --project="$PROJECT_ID" || true
    # Wait for build to complete before next (optional; remove for parallel)
    sleep 5
  done
}

cmd_setup() {
  ensure_artifact_infra
  echo ""
  echo "=== Adding missing repositories to connection ==="
  for repo in "${ALL_REPOS[@]}"; do
    add_repo_if_missing "$repo" || true
  done

  echo ""
  echo "=== Creating missing triggers ==="
  for repo in "${ALL_REPOS[@]}"; do
    create_trigger_if_missing "$repo" || true
  done

  echo ""
  echo "=== Listing triggers ==="
  gcloud builds triggers list --region="$REGION" --project="$PROJECT_ID" --format="table(name,description)"
}

cmd_run_ordered() {
  run_build_ordered
}

cmd_list() {
  gcloud builds triggers list --region="$REGION" --project="$PROJECT_ID" --format="table(name,description,repositoryEventConfig.repository)"
}

cmd_help() {
  cat <<EOF
Usage: $0 <command>

Commands:
  setup         Add missing repos to connection and create missing triggers
  run-ordered   Run all builds in dependency order (libraries first, then services)
  list          List existing triggers

Env vars:
  GCP_PROJECT_ID   (required, no default)
  GCP_REGION       (default: asia-northeast1)
  CB_CONNECTION    (default: iggyikenna-github)
  GITHUB_OWNER     (default: IggyIkenna)

Examples:
  $0 setup
  $0 run-ordered
  $0 list
EOF
}

case "${1:-help}" in
  setup) cmd_setup ;;
  run-ordered) run_build_ordered ;;
  list) cmd_list ;;
  help|--help|-h) cmd_help ;;
  *) echo "Unknown command: $1"; cmd_help; exit 1 ;;
esac
