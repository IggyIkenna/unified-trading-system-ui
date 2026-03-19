"""
Sports betting utility scripts.

Migrated from sports-betting-services-previous to deployment-service.
These scripts handle league configuration verification, CSV corrections,
round definitions, weather lookups, arbitrage reporting, and feature auditing.

All I/O has been adapted to use GCS Parquet reads via google.cloud.storage
and UnifiedCloudConfig for configuration.
"""
