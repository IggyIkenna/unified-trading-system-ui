#!/bin/bash
# GCS Reorganization Script - Move files to venue-based structure
# Uses gsutil -m mv for fast GCS-to-GCS operations (no local I/O)
#
# Current structure: data_type-X/{instrument_type}/{file}.parquet
# Target structure:  data_type-X/{instrument_type}/{venue}/{file}.parquet
#
# Usage: ./reorganize_gcs_by_venue.sh [--dry-run]

set -e

DRY_RUN=""
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN="echo [DRY-RUN] "
    echo "=== DRY RUN MODE - No files will be moved ==="
fi

BUCKET="gs://market-data-tick-tradfi-${GCP_PROJECT_ID:?GCP_PROJECT_ID required}"
BASE_PREFIX="raw_tick_data/by_date"

# Track progress
TOTAL_MOVED=0
TOTAL_SKIPPED=0

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to extract venue from instrument_key
# Format: VENUE:TYPE:SYMBOL-USD (e.g., NYSE:EQUITY:AAPL-USD)
extract_venue() {
    local filename="$1"
    # Remove .parquet extension
    local base="${filename%.parquet}"
    # Extract first part before colon
    echo "$base" | cut -d':' -f1
}

# Reorganize equities/etf files
reorganize_equities() {
    local date_folder="$1"
    local data_type="$2"
    local inst_type="$3"  # equities or etf

    local prefix="${BUCKET}/${BASE_PREFIX}/${date_folder}/data_type-${data_type}/${inst_type}/"

    # List files (not folders)
    local files=$(gsutil ls "${prefix}*.parquet" 2>/dev/null || true)

    if [[ -z "$files" ]]; then
        return
    fi

    for file in $files; do
        local filename=$(basename "$file")
        local venue=$(extract_venue "$filename")

        if [[ -z "$venue" || "$venue" == "UNKNOWN" ]]; then
            log "SKIP: Cannot determine venue for $filename"
            ((TOTAL_SKIPPED++))
            continue
        fi

        local new_path="${prefix}${venue}/${filename}"

        # Check if already in venue folder (skip if path contains venue twice)
        if [[ "$file" == *"/${venue}/"* ]]; then
            continue
        fi

        log "MOVE: $filename -> ${venue}/"
        ${DRY_RUN}gsutil mv "$file" "$new_path"
        ((TOTAL_MOVED++))
    done
}

# Reorganize futures_chain files
# Format: underlying.parquet -> {venue}/underlying.parquet
# Need to determine venue from instrument definitions or parent folder
reorganize_futures() {
    local date_folder="$1"
    local data_type="$2"

    local prefix="${BUCKET}/${BASE_PREFIX}/${date_folder}/data_type-${data_type}/futures_chain/"

    # List files at root level (not in subfolders)
    local files=$(gsutil ls "${prefix}*.parquet" 2>/dev/null || true)

    if [[ -z "$files" ]]; then
        return
    fi

    # For futures, we need to map underlying to venue
    # Common mappings:
    # CME: ES, NQ, RTY, YM, GC (gold), SI (silver), CL (crude), etc.
    # ICE: BRENT, GASOIL, etc.
    # CBOE: VIX

    for file in $files; do
        local filename=$(basename "$file")
        local underlying="${filename%.parquet}"

        # Determine venue based on underlying symbol
        local venue=""
        case "$underlying" in
            # CME products
            ES|NQ|RTY|YM|MES|MNQ|M2K|MYM) venue="CME" ;;
            GC|SI|HG|PL|PA|GOLD|SILVER|COPPER|PLATINUM|PALLADIUM) venue="CME" ;;
            CL|NG|RB|HO|CRUDE|NATGAS|GASOLINE|HEATINGOIL) venue="CME" ;;
            ZB|ZN|ZF|ZT|ZQ|SR3|GE) venue="CME" ;;  # Interest rates
            ZC|ZS|ZW|ZM|ZL|CORN|SOYBEAN|WHEAT|SOYMEAL|SOYOIL) venue="CME" ;;  # Ags
            LE|HE|GF) venue="CME" ;;  # Livestock
            6A|6B|6C|6E|6J|6M|6N|6S|AUD|GBP|CAD|EUR|JPY|MXN|NZD|CHF|BRL) venue="CME" ;;  # FX
            DOW|SPX|NDX|RUSSELL) venue="CME" ;;

            # ICE products
            BRENT|GASOIL|CC|KC|CT|SB|OJ|COCOA|COFFEE|COTTON|SUGAR|ORANGEJUICE) venue="ICE" ;;
            DOLLARINDEX|DX) venue="ICE" ;;

            # CBOE products
            VIX|VX) venue="CBOE" ;;

            *)
                log "WARN: Unknown venue for underlying $underlying, defaulting to CME"
                venue="CME"
                ;;
        esac

        local new_path="${prefix}${venue}/${filename}"

        log "MOVE: futures_chain/$filename -> futures_chain/${venue}/"
        ${DRY_RUN}gsutil mv "$file" "$new_path"
        ((TOTAL_MOVED++))
    done
}

# Reorganize options_chain files
reorganize_options() {
    local date_folder="$1"
    local data_type="$2"

    local prefix="${BUCKET}/${BASE_PREFIX}/${date_folder}/data_type-${data_type}/options_chain/"

    # List files at root level
    local files=$(gsutil ls "${prefix}*.parquet" 2>/dev/null || true)

    if [[ -z "$files" ]]; then
        return
    fi

    for file in $files; do
        local filename=$(basename "$file")
        local underlying="${filename%.parquet}"

        # Options venue determination - similar to futures but includes equity options
        local venue=""
        case "$underlying" in
            # Index options typically CBOE
            SPX|SPY|QQQ|IWM|DIA|VIX) venue="CBOE" ;;

            # Futures options -> CME
            ES|NQ|CL|GC|ZB|ZN) venue="CME" ;;

            # Equity options -> default to CBOE (most US equity options)
            *) venue="CBOE" ;;
        esac

        local new_path="${prefix}${venue}/${filename}"

        log "MOVE: options_chain/$filename -> options_chain/${venue}/"
        ${DRY_RUN}gsutil mv "$file" "$new_path"
        ((TOTAL_MOVED++))
    done
}

# Main execution
log "=== Starting GCS Reorganization ==="
log "Bucket: $BUCKET"

# Get list of date folders
log "Scanning date folders..."
DATE_FOLDERS=$(gsutil ls "${BUCKET}/${BASE_PREFIX}/" | grep "/day-" | sed 's|.*/day-|day-|' | sed 's|/$||' || true)

if [[ -z "$DATE_FOLDERS" ]]; then
    log "No date folders found"
    exit 0
fi

FOLDER_COUNT=$(echo "$DATE_FOLDERS" | wc -l | tr -d ' ')
log "Found $FOLDER_COUNT date folders to process"

CURRENT=0
for date_folder in $DATE_FOLDERS; do
    ((CURRENT++))
    log "[$CURRENT/$FOLDER_COUNT] Processing $date_folder..."

    # Get data types for this date
    DATA_TYPES=$(gsutil ls "${BUCKET}/${BASE_PREFIX}/${date_folder}/" 2>/dev/null | grep "/data_type-" | sed 's|.*/data_type-||' | sed 's|/$||' || true)

    for data_type in $DATA_TYPES; do
        # Reorganize each instrument type
        reorganize_equities "$date_folder" "$data_type" "equities"
        reorganize_equities "$date_folder" "$data_type" "etf"
        reorganize_futures "$date_folder" "$data_type"
        reorganize_options "$date_folder" "$data_type"
    done
done

log "=== Reorganization Complete ==="
log "Total files moved: $TOTAL_MOVED"
log "Total files skipped: $TOTAL_SKIPPED"
