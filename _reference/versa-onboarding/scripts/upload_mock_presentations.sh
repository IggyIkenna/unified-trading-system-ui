#!/usr/bin/env bash
set -euo pipefail

BUCKET="${PRESENTATIONS_BUCKET:-central-element-323112.appspot.com}"
PREFIX="${PRESENTATIONS_PREFIX:-presentations/}"

echo "Uploading mock presentations to gs://${BUCKET}/${PREFIX}demo/"
gsutil cp mock-presentations/*.html "gs://${BUCKET}/${PREFIX}demo/"
echo "Done."
