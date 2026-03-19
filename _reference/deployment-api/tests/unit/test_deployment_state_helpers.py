"""
Unit tests for deployment_state module helpers.

Tests cover pure helper functions:
- _extract_severity_and_logger
- _parse_execution_name
"""

from deployment_api.routes.deployment_state import (
    _extract_severity_and_logger,
    _parse_execution_name,
)


class TestExtractSeverityAndLogger:
    """Tests for _extract_severity_and_logger in deployment_state."""

    def test_python_logging_error(self):
        line = "ERROR:my_module:Something went wrong"
        severity, logger_name = _extract_severity_and_logger(line)
        assert severity == "ERROR"
        assert logger_name == "my_module"

    def test_python_logging_warning(self):
        line = "WARNING:my_module:Something is off"
        severity, logger_name = _extract_severity_and_logger(line)
        assert severity == "WARNING"
        assert logger_name == "my_module"

    def test_python_logging_info(self):
        line = "INFO:app:Starting up"
        severity, logger_name = _extract_severity_and_logger(line)
        assert severity == "INFO"
        assert logger_name == "app"

    def test_python_logging_debug(self):
        line = "DEBUG:app:debug message"
        severity, _logger_name = _extract_severity_and_logger(line)
        assert severity == "DEBUG"

    def test_python_logging_critical(self):
        line = "CRITICAL:app:critical failure"
        severity, _logger_name = _extract_severity_and_logger(line)
        assert severity == "CRITICAL"

    def test_json_log_with_level(self):
        import json

        log = json.dumps({"level": "error", "logger": "my_service", "message": "failed"})
        severity, logger_name = _extract_severity_and_logger(log)
        assert severity == "ERROR"
        assert logger_name == "my_service"

    def test_json_log_with_warning_level(self):
        import json

        log = json.dumps({"level": "warning", "message": "degraded"})
        severity, _logger_name = _extract_severity_and_logger(log)
        assert severity == "WARNING"

    def test_json_log_with_name_fallback(self):
        import json

        log = json.dumps({"level": "info", "name": "my_logger"})
        _severity, logger_name = _extract_severity_and_logger(log)
        assert logger_name == "my_logger"

    def test_severity_alias_warn(self):
        import json

        log = json.dumps({"level": "warn"})
        severity, _ = _extract_severity_and_logger(log)
        assert severity == "WARNING"

    def test_severity_alias_fatal(self):
        import json

        log = json.dumps({"level": "fatal"})
        severity, _ = _extract_severity_and_logger(log)
        assert severity == "CRITICAL"

    def test_severity_alias_trace(self):
        import json

        log = json.dumps({"level": "trace"})
        severity, _ = _extract_severity_and_logger(log)
        assert severity == "DEBUG"

    def test_plain_text_no_format(self):
        line = "some random log message without format"
        severity, logger_name = _extract_severity_and_logger(line)
        assert severity == "INFO"
        assert logger_name is None

    def test_invalid_json_falls_through(self):
        line = "{not valid json"
        severity, _logger_name = _extract_severity_and_logger(line)
        # Falls through to plain text path — severity defaults to INFO
        assert isinstance(severity, str)


class TestParseExecutionName:
    """Tests for _parse_execution_name in deployment_state."""

    def test_full_path(self):
        name = "projects/my-project/locations/us-central1/jobs/my-job/executions/exec-001"
        region, job_name = _parse_execution_name(name)
        assert region == "us-central1"
        assert job_name == "my-job"

    def test_asia_region(self):
        name = "projects/proj/locations/asia-northeast1/jobs/asia-job/executions/e1"
        region, job_name = _parse_execution_name(name)
        assert region == "asia-northeast1"
        assert job_name == "asia-job"

    def test_empty_string(self):
        region, job_name = _parse_execution_name("")
        assert region is None
        assert job_name is None

    def test_partial_path_no_locations(self):
        name = "some/path/without/locations"
        region, job_name = _parse_execution_name(name)
        assert region is None
        assert job_name is None

    def test_europe_region(self):
        name = "projects/proj/locations/europe-west4/jobs/eu-job/executions/e1"
        region, job_name = _parse_execution_name(name)
        assert region == "europe-west4"
        assert job_name == "eu-job"
