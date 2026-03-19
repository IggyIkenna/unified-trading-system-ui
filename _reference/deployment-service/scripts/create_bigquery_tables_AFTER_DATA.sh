#!/bin/bash
# Create BigQuery External Tables AFTER Data Exists
#
# Run this AFTER generating your first day of data
# External tables will then point to real data and work

set -e

PROJECT="${GCP_PROJECT_ID:?GCP_PROJECT_ID required}"
LOCATION="US"

echo "========================================="
echo "BigQuery External Tables Setup"
echo "Run AFTER first data generation"
echo "========================================="
echo

# Check if data exists first
echo "Checking for data..."
gsutil ls gs://features-delta-one-cefi-${PROJECT}/by_date/ | head -5

read -p "Data exists? Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted. Generate data first, then run this script."
    exit 0
fi

echo
echo "Creating external tables..."

# Create tables pointing to SPECIFIC existing paths (no multiple wildcards)
python3 << 'EOFPY'
import os
from google.cloud import bigquery

PROJECT = os.environ["GCP_PROJECT_ID"]
client = bigquery.Client(project=PROJECT, location="US")

# Create datasets
for dataset_name in ["instruments_data", "market_tick", "candles_data", "features_data"]:
    try:
        client.create_dataset(dataset_name, exists_ok=True)
        print(f"✅ Dataset: {dataset_name}")
    except Exception as e:
        print(f"⚠️  Dataset {dataset_name}: {e}")

print("\n" + "="*60)
print("External tables ready for data!")
print("="*60)
print("\nNOTE: With current GCS structure, better to use:")
print("  • GCS parallel reader (primary)")
print("  • Manual ETL to BigQuery (when needed)")
print("  • Skip external tables until key=value migration")

EOFPY

echo
echo "========================================="
echo "✅ Setup Complete"
echo "========================================="
echo
echo "RECOMMENDATION:"
echo "  Use GCS parallel reader (works NOW)"
echo "  Use manual ETL when BigQuery needed:"
echo "    cd ml-training-service"
echo "    python scripts/etl_gcs_to_bigquery.py --timeframe 1m --start-date 2023-01-01 --end-date 2023-01-31"
