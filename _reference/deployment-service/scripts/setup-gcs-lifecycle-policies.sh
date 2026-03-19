#!/bin/bash
# Setup GCS Lifecycle Policies for Cost Optimization
# 
# Automatically transitions objects between storage classes:
# - 7 days: STANDARD → NEARLINE ($0.023 → $0.013 per GB/month)
# - 30 days: NEARLINE → COLDLINE ($0.013 → $0.007 per GB/month)
# - 365 days: COLDLINE → ARCHIVE ($0.007 → $0.0025 per GB/month)

set -e

PROJECT="${GCP_PROJECT_ID:?GCP_PROJECT_ID required}"

echo "========================================="
echo "GCS Lifecycle Policy Setup"
echo "Project: $PROJECT"
echo "========================================="
echo

# Define lifecycle policy
LIFECYCLE_JSON=$(cat <<'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "NEARLINE"
        },
        "condition": {
          "age": 7,
          "matchesStorageClass": ["STANDARD"]
        }
      },
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "COLDLINE"
        },
        "condition": {
          "age": 30,
          "matchesStorageClass": ["NEARLINE"]
        }
      },
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "ARCHIVE"
        },
        "condition": {
          "age": 365,
          "matchesStorageClass": ["COLDLINE"]
        }
      }
    ]
  }
}
EOF
)

# Save to temp file
TEMP_FILE="/tmp/gcs-lifecycle-policy-$$.json"
echo "$LIFECYCLE_JSON" > "$TEMP_FILE"

echo "Lifecycle Policy:"
echo "  7 days: STANDARD → NEARLINE (-43% cost)"
echo "  30 days: NEARLINE → COLDLINE (-46% cost from Nearline)"
echo "  365 days: COLDLINE → ARCHIVE (-64% cost from Coldline)"
echo

# List of buckets to apply policy to
BUCKETS=(
  # Instruments (rarely accessed after generation)
  "instruments-store-cefi-${PROJECT}"
  "instruments-store-tradfi-${PROJECT}"
  "instruments-store-defi-${PROJECT}"
  
  # Market tick data (rarely accessed after features generation)
  "market-data-tick-cefi-${PROJECT}"
  "market-data-tick-tradfi-${PROJECT}"
  "market-data-tick-defi-${PROJECT}"
  
  # Processed candles (rarely accessed after features generation)
  "market-data-candles-cefi-${PROJECT}"
  "market-data-candles-tradfi-${PROJECT}"
  "market-data-candles-defi-${PROJECT}"
  
  # Features (frequently accessed during ML training)
  # Consider more conservative policy: 30d→NEARLINE, 90d→COLDLINE
  "features-delta-one-cefi-${PROJECT}"
  "features-delta-one-tradfi-${PROJECT}"
  "features-delta-one-defi-${PROJECT}"
  "features-calendar-${PROJECT}"
  
  # ML artifacts (rarely accessed after training)
  "ml-training-artifacts-${PROJECT}"
  "ml-models-store-${PROJECT}"
  
  # ML predictions (accessed by strategy service)
  # Consider keeping in STANDARD longer: 14d→NEARLINE, 60d→COLDLINE
  "ml-predictions-store-${PROJECT}"
)

# Apply policy to each bucket
for BUCKET in "${BUCKETS[@]}"; do
  echo "Processing: gs://${BUCKET}"
  
  # Check if bucket exists
  if ! gsutil ls "gs://${BUCKET}" &>/dev/null; then
    echo "  ⚠️  Bucket does not exist, skipping"
    continue
  fi
  
  # Apply lifecycle policy
  if gsutil lifecycle set "$TEMP_FILE" "gs://${BUCKET}"; then
    echo "  ✅ Lifecycle policy applied"
  else
    echo "  ❌ Failed to apply policy"
  fi
  
  # Verify
  echo "  Current policy:"
  gsutil lifecycle get "gs://${BUCKET}" 2>&1 | grep -E "(age|storageClass)" | sed 's/^/    /'
  echo
done

# Cleanup
rm "$TEMP_FILE"

echo "========================================="
echo "✅ Lifecycle Policies Applied"
echo "========================================="
echo
echo "Cost Savings Estimate (MVP: BTC + SPY, 6 years):"
echo "  Year 1: ~\$50/year (7-day transition)"
echo "  Year 2+: ~\$800/year (30-day to Coldline)"
echo "  Long-term: ~\$1,500/year (365-day to Archive)"
echo
echo "To verify policies:"
echo "  gsutil lifecycle get gs://features-delta-one-cefi-${PROJECT}"
echo
echo "To check object storage classes:"
echo "  gsutil ls -L gs://features-delta-one-cefi-${PROJECT}/by_date/day=2023-01-01/ | grep 'Storage class'"
echo
echo "Note: Transitions happen automatically based on object age."
echo "      Objects won't transition immediately - it takes 24-48 hours after age threshold."
