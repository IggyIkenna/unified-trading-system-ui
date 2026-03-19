#!/bin/bash
# Setup BigQuery External Tables + Materialized Views for Features
# Can test with existing 155 days of real GCS data

set -e

PROJECT="${GCP_PROJECT_ID:?GCP_PROJECT_ID required}"
DATASET="features_data"
REGION="asia-northeast1"
TIMEFRAMES=("15s" "1m" "5m" "15m" "1h" "4h" "24h")

echo "========================================="
echo "Setting up BigQuery Features Tables"
echo "Project: $PROJECT"
echo "Dataset: $DATASET"
echo "========================================="
echo

# Create dataset if not exists
bq mk --dataset --location=$REGION ${PROJECT}:${DATASET} 2>/dev/null || echo "Dataset already exists"

for TF in "${TIMEFRAMES[@]}"; do
  echo "Setting up ${TF}..."

  # 1. Create external table
  echo "  Creating external table: features_${TF}_external"

  # Use CUSTOM hive partitioning to extract day, feature_group from folder names
  # Structure: by_date/day=YYYY-MM-DD/feature_group={group}/timeframe={tf}/{inst}.parquet
  # BigQuery will:
  # - Extract day from folder name (becomes partition key)
  # - Extract feature_group (becomes queryable column)
  # - Read instrument_id from parquet (can cluster on this)
  cat > /tmp/external_def_${TF}.json <<EOFTABLE
{
  "sourceFormat": "PARQUET",
  "sourceUris": [
    "gs://features-delta-one-cefi-${PROJECT}/by_date/day=*/feature_group=*/timeframe=${TF}/*.parquet"
  ],
  "hivePartitioningOptions": {
    "mode": "CUSTOM",
    "sourceUriPrefix": "gs://features-delta-one-cefi-${PROJECT}/by_date/",
    "requirePartitionFilter": true
  },
  "autodetect": true
}
EOFTABLE

  bq mk --force --external_table_definition=/tmp/external_def_${TF}.json \
    ${PROJECT}:${DATASET}.features_${TF}_external 2>&1 | grep -v "already exists" || true

  # 2. Create materialized view (no auto-refresh - Cloud Function handles it)
  echo "  Creating materialized view: features_${TF}_mv"

  bq query --use_legacy_sql=false --format=none <<EOFQUERY
  CREATE OR REPLACE MATERIALIZED VIEW \`${PROJECT}.${DATASET}.features_${TF}_mv\`
  PARTITION BY DATE(timestamp)
  CLUSTER BY instrument_id, DATE(timestamp)
  AS SELECT * FROM \`${PROJECT}.${DATASET}.features_${TF}_external\`;
EOFQUERY

  echo "  ✅ ${TF} complete"
  echo
done

echo "========================================="
echo "✅ All external tables and MVs created"
echo "========================================="
echo
echo "Verifying data..."

# Test query on 1m (should show existing real data)
bq query --use_legacy_sql=false --format=pretty <<EOFQUERY
SELECT
  COUNT(*) as total_rows,
  MIN(DATE(timestamp)) as earliest_date,
  MAX(DATE(timestamp)) as latest_date
FROM \`${PROJECT}.${DATASET}.features_1m_mv\`
WHERE instrument_id = 'BINANCE-FUTURES:PERPETUAL:BTC-USDT';
EOFQUERY

echo
echo "Next step: Deploy Cloud Function for event-driven refresh"
echo "  cd features-delta-one-service/cloud_functions/refresh_bigquery_mv"
echo "  ./deploy.sh"
