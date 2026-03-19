"""
Unit tests for service_events module.

The service_events module is structurally identical to service_utils but
in a different location. Tests cover parse_service_event and
update_shard_state_from_event from the service_events module.
"""

from datetime import UTC, datetime

from deployment_api.utils.service_events import (
    parse_service_event,
    update_shard_state_from_event,
)


def _make_event(name: str, details: str = "") -> dict:
    return {"event_name": name, "details": details, "timestamp": datetime.now(UTC)}


class TestParseServiceEventFromServiceEvents:
    """Tests for parse_service_event in service_events module."""

    def test_basic_event(self):
        result = parse_service_event("SERVICE_EVENT: STARTED")
        assert result is not None
        assert result["event_name"] == "STARTED"
        assert result["details"] == ""

    def test_event_with_details(self):
        result = parse_service_event(
            "SERVICE_EVENT: INSTRUMENT_PROCESSING_COMPLETED (BTC-USDT, 500)"
        )
        assert result is not None
        assert result["event_name"] == "INSTRUMENT_PROCESSING_COMPLETED"
        assert "BTC-USDT" in result["details"]

    def test_no_match_returns_none(self):
        assert parse_service_event("random log line") is None

    def test_empty_string_returns_none(self):
        assert parse_service_event("") is None

    def test_serial_console_prefix(self):
        line = "[ 12.345] docker[1234]: SERVICE_EVENT: VALIDATION_STARTED"
        result = parse_service_event(line)
        assert result is not None
        assert result["event_name"] == "VALIDATION_STARTED"

    def test_timestamp_is_datetime(self):
        result = parse_service_event("SERVICE_EVENT: STARTED")
        assert result is not None
        assert isinstance(result["timestamp"], datetime)


class TestUpdateShardStateFromServiceEvents:
    """Tests for update_shard_state_from_event in service_events module."""

    def test_stopped_event(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("STOPPED"))
        assert shard["status"] == "completed"
        assert shard["current_stage"] == "completed"
        assert shard["progress"] == 100

    def test_failed_event(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("FAILED", "timeout error"))
        assert shard["status"] == "failed"
        assert shard["failure_category"] == "service_failed"

    def test_validation_started(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("VALIDATION_STARTED"))
        assert shard["current_stage"] == "validation"
        assert shard["status"] == "initializing"

    def test_validation_completed_timing(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("VALIDATION_STARTED"))
        update_shard_state_from_event(shard, _make_event("VALIDATION_COMPLETED"))
        assert "validation" in shard.get("stage_timings", {})

    def test_validation_failed(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("VALIDATION_FAILED"))
        assert shard["status"] == "failed"
        assert shard["failure_category"] == "validation_failed"

    def test_ingestion_started(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("DATA_INGESTION_STARTED"))
        assert shard["current_stage"] == "ingestion"
        assert shard["status"] == "running"

    def test_ingestion_completed_timing(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("DATA_INGESTION_STARTED"))
        update_shard_state_from_event(shard, _make_event("DATA_INGESTION_COMPLETED", "done"))
        assert "ingestion" in shard.get("stage_timings", {})

    def test_processing_started(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("PROCESSING_STARTED"))
        assert shard["current_stage"] == "processing"

    def test_processing_completed_timing(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("PROCESSING_STARTED"))
        update_shard_state_from_event(shard, _make_event("PROCESSING_COMPLETED"))
        assert "processing" in shard.get("stage_timings", {})

    def test_persistence_started(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("PERSISTENCE_STARTED"))
        assert shard["current_stage"] == "persistence"

    def test_persistence_completed_timing(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("PERSISTENCE_STARTED"))
        update_shard_state_from_event(shard, _make_event("PERSISTENCE_COMPLETED"))
        assert "persistence" in shard.get("stage_timings", {})

    def test_data_broadcast(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("DATA_BROADCAST"))
        assert shard["current_stage"] == "broadcasting"

    def test_progress_counter_parsed(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("SOME_EVENT", "step (15/50)"))
        assert shard["progress_current"] == 15
        assert shard["progress_total"] == 50
        assert shard["progress"] == 30  # 15/50 * 100

    def test_stage_timings_initialized(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("UNKNOWN_EVENT"))
        assert "stage_timings" in shard
        assert isinstance(shard["stage_timings"], dict)

    def test_stage_timings_none_replaced(self):
        shard: dict = {"stage_timings": None}
        update_shard_state_from_event(shard, _make_event("UNKNOWN_EVENT"))
        assert isinstance(shard["stage_timings"], dict)

    def test_stage_details_always_set(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("MY_EVENT", "custom detail"))
        assert shard["stage_details"] == "custom detail"


class TestNaiveTimestampHandling:
    """Tests for naive datetime timestamp handling in stage timing calculations."""

    def test_naive_started_at_gets_utc_timezone(self):

        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("VALIDATION_STARTED"))
        # Replace stage_started_at with a naive datetime ISO string (no timezone)
        naive_ts = datetime.now(UTC).replace(tzinfo=None).isoformat()  # no UTC timezone
        shard["stage_started_at"] = naive_ts
        # Should not raise - naive datetime is handled via replace(tzinfo=UTC)
        update_shard_state_from_event(shard, _make_event("VALIDATION_COMPLETED"))
        assert "validation" in shard.get("stage_timings", {})

    def test_invalid_started_at_swallows_valueerror(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("VALIDATION_STARTED"))
        shard["stage_started_at"] = "not-a-valid-iso-string"
        # Should not raise - ValueError is caught and suppressed
        update_shard_state_from_event(shard, _make_event("VALIDATION_COMPLETED"))

    def test_ingestion_naive_started_at(self):

        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("DATA_INGESTION_STARTED"))
        naive_ts = datetime.now(UTC).replace(tzinfo=None).isoformat()
        shard["stage_started_at"] = naive_ts
        update_shard_state_from_event(shard, _make_event("DATA_INGESTION_COMPLETED", "done"))
        assert "ingestion" in shard.get("stage_timings", {})

    def test_processing_invalid_started_at(self):
        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("PROCESSING_STARTED"))
        shard["stage_started_at"] = "bad-date"
        update_shard_state_from_event(shard, _make_event("PROCESSING_COMPLETED"))

    def test_persistence_naive_started_at(self):

        shard: dict = {}
        update_shard_state_from_event(shard, _make_event("PERSISTENCE_STARTED"))
        naive_ts = datetime.now(UTC).replace(tzinfo=None).isoformat()
        shard["stage_started_at"] = naive_ts
        update_shard_state_from_event(shard, _make_event("PERSISTENCE_COMPLETED"))
        assert "persistence" in shard.get("stage_timings", {})
