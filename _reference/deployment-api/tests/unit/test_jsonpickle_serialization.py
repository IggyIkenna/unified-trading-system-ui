from datetime import UTC, datetime

from deployment_api.utils.cache import deserialize, serialize


class TestJsonpickleSerialization:
    def test_round_trip_simple_dict(self):
        payload = {"ok": True, "count": 3, "tags": ["a", "b"]}
        restored = deserialize(serialize(payload))
        assert restored == payload

    def test_datetime_serialized_as_string(self):
        """After jsonpickle removal, datetimes serialize to ISO strings via json.dumps(default=str)."""
        now = datetime.now(UTC)
        restored = deserialize(serialize(now))
        assert isinstance(restored, str)
        assert str(now) == restored
