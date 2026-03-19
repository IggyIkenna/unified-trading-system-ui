"""Prometheus metrics for deployment-service."""

from prometheus_client import Counter, Histogram

RECORDS_PROCESSED = Counter(
    "deployment_service_records_processed_total",
    "Total records processed",
    ["status"],  # labels: success / error
)

PROCESSING_LATENCY = Histogram(
    "deployment_service_processing_latency_seconds",
    "Processing latency",
    buckets=[0.1, 0.5, 1.0, 2.5, 5.0, 10.0],
)
