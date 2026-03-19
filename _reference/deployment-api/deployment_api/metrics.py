"""Prometheus metrics for deployment-api."""

from prometheus_client import Counter, Histogram

RECORDS_PROCESSED = Counter(
    "deployment_api_records_processed_total",
    "Total number of deployment API requests processed",
    ["status"],  # labels: success / error
)

PROCESSING_LATENCY = Histogram(
    "deployment_api_processing_latency_seconds",
    "Deployment API request processing latency in seconds",
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)
