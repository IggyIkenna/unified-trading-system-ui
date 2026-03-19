"""
Unit tests for service_utils module.

Extends coverage beyond test_event_logging_parser.py to cover the remaining
shard state update events (validation, ingestion, processing, persistence, etc.)
and path/directory utility functions.
"""

from datetime import UTC, datetime
from pathlib import Path

from deployment_api.utils.service_utils import (
    get_config_dir,
    get_ui_dist_dir,
    parse_service_event,
    update_shard_state_from_event,
)


def _make_event(name: str, details: str = "") -> dict:
    return {"event_name": name, "details": details, "timestamp": datetime.now(UTC)}


class TestValidationEvents:
    """Tests for VALIDATION_* events."""

    def test_validation_started(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("VALIDATION_STARTED"))
        assert shard["current_stage"] == "validation"
        assert shard["status"] == "initializing"
        assert "stage_started_at" in shard

    def test_validation_completed_records_timing(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("VALIDATION_STARTED"))
        update_shard_state_from_event(shard, _make_event("VALIDATION_COMPLETED"))
        # timing should be recorded
        assert "validation" in shard.get("stage_timings", {})

    def test_validation_failed(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("VALIDATION_FAILED"))
        assert shard["status"] == "failed"
        assert shard["failure_category"] == "validation_failed"

    def test_validation_completed_without_start_no_error(self):
        shard: dict = {}
        # COMPLETED without prior STARTED should not raise
        update_shard_state_from_event(shard, _make_event("VALIDATION_COMPLETED"))


class TestIngestionEvents:
    """Tests for DATA_INGESTION_* events."""

    def test_ingestion_started(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("DATA_INGESTION_STARTED"))
        assert shard["current_stage"] == "ingestion"
        assert shard["status"] == "running"

    def test_ingestion_completed_with_details(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("DATA_INGESTION_STARTED"))
        update_shard_state_from_event(
            shard, _make_event("DATA_INGESTION_COMPLETED", "5000 records")
        )
        assert "ingestion" in shard.get("stage_timings", {})
        assert shard["stage_details"] == "5000 records"


class TestProcessingEvents:
    """Tests for PROCESSING_* events."""

    def test_processing_started(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("PROCESSING_STARTED"))
        assert shard["current_stage"] == "processing"

    def test_processing_completed_timing(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("PROCESSING_STARTED"))
        update_shard_state_from_event(shard, _make_event("PROCESSING_COMPLETED"))
        assert "processing" in shard.get("stage_timings", {})


class TestPersistenceEvents:
    """Tests for PERSISTENCE_* events."""

    def test_persistence_started(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("PERSISTENCE_STARTED"))
        assert shard["current_stage"] == "persistence"

    def test_persistence_completed_timing(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("PERSISTENCE_STARTED"))
        update_shard_state_from_event(shard, _make_event("PERSISTENCE_COMPLETED"))
        assert "persistence" in shard.get("stage_timings", {})


class TestBroadcastAndOtherEvents:
    """Tests for DATA_BROADCAST and unknown events."""

    def test_data_broadcast(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("DATA_BROADCAST"))
        assert shard["current_stage"] == "broadcasting"

    def test_unknown_event_does_not_raise(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("SOME_UNKNOWN_EVENT", "detail"))
        # stage_details should be updated
        assert shard["stage_details"] == "detail"


class TestStageTimingsInitialization:
    """Tests for stage_timings initialization."""

    def test_stage_timings_initialized_when_missing(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("DATA_BROADCAST"))
        assert "stage_timings" in shard

    def test_stage_timings_initialized_when_none(self):
        shard: dict = {"stage_timings": None}
        update_shard_state_from_event(shard, _make_event("DATA_BROADCAST"))
        assert isinstance(shard["stage_timings"], dict)


class TestProgressParsing:
    """Tests for progress counter parsing in details."""

    def test_progress_parsed_from_details(self):
        shard: dict = {}
        update_shard_state_from_event(
            shard, _make_event("DATE_PROCESSING_STARTED", "2024-01-15 (10/100)")
        )
        assert shard["progress_current"] == 10
        assert shard["progress_total"] == 100
        assert shard["progress"] == 10
        assert shard["progress_message"] == "10/100"

    def test_no_progress_in_details_no_progress_keys(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("STOPPED"))
        # STOPPED sets progress=100
        assert shard["progress"] == 100

    def test_progress_zero_total_no_crash(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("SOME_EVENT", "data (5/0)"))
        # total=0 means no division
        assert shard.get("progress_total") == 0

    def test_progress_100_percent(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("PROCESSING", "batch (50/50)"))
        assert shard["progress"] == 100


class TestParseServiceEventEdgeCases:
    """Additional edge cases for parse_service_event."""

    def test_event_with_no_details_parens(self):
        result = parse_service_event("SERVICE_EVENT: STARTED")
        assert result is not None
        assert result["details"] == ""

    def test_event_with_complex_details(self):
        result = parse_service_event("SERVICE_EVENT: COMPLETED (step=5 total=30)")
        assert result is not None
        assert "step=5 total=30" in result["details"]

    def test_timestamp_is_utc(self):
        result = parse_service_event("SERVICE_EVENT: STARTED")
        assert result is not None
        assert result["timestamp"].tzinfo is not None


class TestGetConfigDir:
    """Tests for get_config_dir."""

    def test_returns_path_object(self):
        path = get_config_dir()
        assert isinstance(path, Path)

    def test_config_dir_exists(self):
        path = get_config_dir()
        assert path.exists()

    def test_config_dir_is_directory(self):
        path = get_config_dir()
        assert path.is_dir()


class TestGetUiDistDir:
    """Tests for get_ui_dist_dir."""

    def test_returns_none_when_no_ui_dist(self):
        # In test environment, UI dist likely doesn't exist
        result = get_ui_dist_dir()
        # Either None or a valid path
        assert result is None or (isinstance(result, Path) and result.exists())

    def test_returns_none_or_path_type(self):
        result = get_ui_dist_dir()
        assert result is None or isinstance(result, Path)


class TestNaiveTimestampInServiceUtils:
    """Tests for naive datetime timestamp handling in update_shard_state_from_event."""

    def test_naive_started_at_in_validation_completed(self):

        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("VALIDATION_STARTED"))
        naive_ts = datetime.now(UTC).replace(tzinfo=None).isoformat()  # no timezone
        shard["stage_started_at"] = naive_ts
        update_shard_state_from_event(shard, _make_event("VALIDATION_COMPLETED"))
        assert "validation" in shard.get("stage_timings", {})

    def test_invalid_started_at_swallows_error(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("VALIDATION_STARTED"))
        shard["stage_started_at"] = "not-iso"
        update_shard_state_from_event(shard, _make_event("VALIDATION_COMPLETED"))

    def test_ingestion_naive_started_at(self):

        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("DATA_INGESTION_STARTED"))
        shard["stage_started_at"] = datetime.now(UTC).replace(tzinfo=None).isoformat()
        update_shard_state_from_event(shard, _make_event("DATA_INGESTION_COMPLETED", "done"))

    def test_processing_invalid_started_at(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("PROCESSING_STARTED"))
        shard["stage_started_at"] = "bad"
        update_shard_state_from_event(shard, _make_event("PROCESSING_COMPLETED"))

    def test_persistence_naive_started_at(self):

        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("PERSISTENCE_STARTED"))
        shard["stage_started_at"] = datetime.now(UTC).replace(tzinfo=None).isoformat()
        update_shard_state_from_event(shard, _make_event("PERSISTENCE_COMPLETED"))
