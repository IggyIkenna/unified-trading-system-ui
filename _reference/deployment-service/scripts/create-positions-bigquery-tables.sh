#!/bin/bash
# Create BigQuery external tables for positions data
#
# Run AFTER position-balance-monitor-service has written data to GCS.
# Path: gs://positions-store-{project_id}/by_date/day={date}/account={account_key}/snapshot_type={snapshot_type}/
#
# Usage:
#   GCP_PROJECT_ID=your-project ./create-positions-bigquery-tables.sh

set -e

PROJECT="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
LOCATION="${GCS_REGION:-asia-northeast1}"
BUCKET="positions-store-${PROJECT}"
DATASET="positions_data"

echo "========================================="
echo "BigQuery Positions External Tables"
echo "========================================="
echo "Project:  $PROJECT"
echo "Location: $LOCATION"
echo "Bucket:   gs://$BUCKET"
echo "Dataset:  $DATASET"
echo "========================================="
echo

# Check bucket exists
if ! gsutil ls "gs://${BUCKET}/" &>/dev/null; then
    echo "ERROR: Bucket gs://${BUCKET} not found. Create it first:"
    echo "  cd deployment-service"
    echo "  GCP_PROJECT_ID=$PROJECT python scripts/setup-buckets.py --cloud gcp --service position-balance-monitor-service"
    exit 1
fi

echo "Creating dataset and external table..."
python3 << EOFPY
from google.cloud import bigquery

client = bigquery.Client(project="${PROJECT}", location="${LOCATION}")

# Create dataset
dataset_id = "${DATASET}"
try:
    client.create_dataset(dataset_id, exists_ok=True)
    print(f"✅ Dataset: {dataset_id}")
except Exception as e:
    print(f"⚠️  Dataset: {e}")

# External table for positions (Hive partitioning: day, account_key, snapshot_type)
table_id = f"{dataset_id}.positions"
schema = [
    bigquery.SchemaField("client_id", "STRING"),
    bigquery.SchemaField("strategy_id", "STRING"),
    bigquery.SchemaField("venue", "STRING"),
    bigquery.SchemaField("instrument", "STRING"),
    bigquery.SchemaField("quantity", "NUMERIC"),
    bigquery.SchemaField("avg_price", "NUMERIC"),
    bigquery.SchemaField("realized_pnl", "NUMERIC"),
    bigquery.SchemaField("unrealized_pnl", "NUMERIC"),
    bigquery.SchemaField("position_value", "NUMERIC"),
    bigquery.SchemaField("last_updated", "TIMESTAMP"),
    bigquery.SchemaField("fill_count", "INT64"),
    bigquery.SchemaField("account_type", "STRING"),
    bigquery.SchemaField("account_key", "STRING"),
    bigquery.SchemaField("snapshot_timestamp", "TIMESTAMP"),
    bigquery.SchemaField("date", "DATE"),
]

external_config = bigquery.ExternalConfig("PARQUET")
# Hive path: by_date/day={date}/account={key}/snapshot_type={type}/positions.parquet
external_config.source_uris = ["gs://${BUCKET}/by_date/*/*/*/*.parquet"]
external_config.autodetect = True

table = bigquery.Table(table_id, schema=schema)
table.external_data_configuration = external_config

try:
    client.create_table(table, exists_ok=True)
    print(f"✅ External table: {table_id}")
except Exception as e:
    print(f"⚠️  Table: {e}")

print("\n✅ Positions BigQuery setup complete!")
print(f"   Query: SELECT * FROM \`{dataset_id}.positions\` LIMIT 10")
EOFPY

echo
echo "========================================="
echo "✅ Done"
echo "========================================="
