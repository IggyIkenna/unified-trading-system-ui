#!/bin/bash
# Create BigQuery External Tables for All Services
#
# BigQuery external table constraints:
#   - Source URIs support exactly ONE wildcard (*) total
#   - Use single-level wildcard matching with known file suffix
#   - For hive partitioning, source_uri_prefix indicates where partition keys start
#
# Tables will be empty until data is generated; schema is autodetected when data flows.
# Run with: GCP_PROJECT_ID=central-element-323112 bash scripts/create_bigquery_external_tables.sh

set -e

PROJECT="${GCP_PROJECT_ID:?GCP_PROJECT_ID required}"
LOCATION="US"

echo "========================================="
echo "Creating BigQuery External Tables"
echo "Project: $PROJECT"
echo "Location: $LOCATION"
echo "========================================="
echo

# Create datasets + external table with hive partitioning (single wildcard in source_uri)
create_external_table() {
    local dataset=$1
    local table=$2
    local uri=$3
    local hive_prefix=$4

    echo "Creating $dataset.$table..."
    bq mk --dataset --location=$LOCATION ${PROJECT}:${dataset} 2>/dev/null || echo "  Dataset exists"

    python3 << EOFPY
import warnings
warnings.filterwarnings("ignore")
from google.cloud import bigquery
client = bigquery.Client(project='$PROJECT', location='$LOCATION')
external_config = bigquery.ExternalConfig('PARQUET')
external_config.source_uris = ['$uri']
external_config.autodetect = True
external_config.hive_partitioning = bigquery.HivePartitioningOptions()
external_config.hive_partitioning.mode = 'AUTO'
external_config.hive_partitioning.source_uri_prefix = '$hive_prefix'
table = bigquery.Table('$PROJECT.$dataset.$table')
table.external_data_configuration = external_config
client.create_table(table, exists_ok=True)
print('  Created $dataset.$table')
EOFPY
}

# 1. Instruments (day=YYYY-MM-DD hive partition)
# Files: instrument_definitions/by_date/day=YYYY-MM-DD/instruments.parquet
create_external_table \
  "instruments_data" \
  "instruments_cefi_v2" \
  "gs://instruments-store-cefi-${PROJECT}/instrument_definitions/by_date/day=*/instruments.parquet" \
  "gs://instruments-store-cefi-${PROJECT}/instrument_definitions/by_date/"

# 2. Market-Tick raw tick data (day= hive partition)
# Files: raw_tick_data/by_date/day=YYYY-MM-DD/trades.parquet
create_external_table \
  "market_tick" \
  "trades_cefi_v2" \
  "gs://market-data-tick-cefi-${PROJECT}/raw_tick_data/by_date/day=*/trades.parquet" \
  "gs://market-data-tick-cefi-${PROJECT}/raw_tick_data/by_date/"

# 3. Market-Data-Processing processed candles (day= hive partition)
# MDP writes into market-data-tick-* bucket at processed_candles/ prefix
create_external_table \
  "candles_data" \
  "candles_cefi_v2" \
  "gs://market-data-tick-cefi-${PROJECT}/processed_candles/by_date/day=*/candles.parquet" \
  "gs://market-data-tick-cefi-${PROJECT}/processed_candles/by_date/"

# 4. Features-Delta-One (day= hive partition)
create_external_table \
  "features_data" \
  "features_delta_one_cefi_v2" \
  "gs://features-delta-one-cefi-${PROJECT}/by_date/day=*/features.parquet" \
  "gs://features-delta-one-cefi-${PROJECT}/by_date/"

# 5. Features-Calendar (day= hive partition)
# Files: calendar/by_date/day=YYYY-MM-DD/calendar.parquet
create_external_table \
  "features_data" \
  "features_calendar_v2" \
  "gs://features-calendar-${PROJECT}/calendar/by_date/day=*/calendar.parquet" \
  "gs://features-calendar-${PROJECT}/calendar/by_date/"

echo
echo "========================================="
echo "External Tables Created"
echo "========================================="
echo
echo "Tables point to future data paths (currently empty)."
echo "Schema auto-detected when first data is written."
echo
echo "Verify tables exist:"
echo "  bq ls ${PROJECT}:instruments_data"
echo "  bq ls ${PROJECT}:market_tick"
echo "  bq ls ${PROJECT}:candles_data"
echo "  bq ls ${PROJECT}:features_data"
echo
echo "Query when data exists:"
echo "  bq query 'SELECT COUNT(*), day FROM \`${PROJECT}.instruments_data.instruments_cefi_v2\` GROUP BY day'"
