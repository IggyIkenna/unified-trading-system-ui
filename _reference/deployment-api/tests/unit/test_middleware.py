"""
Unit tests for middleware module.

Tests configure_middleware with various CORS settings including
production origins, dev origins, and cloud run regex patterns.
"""

from unittest.mock import MagicMock, patch

from deployment_api.middleware import configure_middleware


class TestConfigureMiddlewareNoCloudRun:
    """Tests when CORS_ALLOWED_CLOUD_RUN is not set."""

    @patch("deployment_api.middleware.settings")
    def test_adds_cors_middleware_without_regex(self, mock_settings):
        mock_settings.API_PORT = 8080
        mock_settings.FRONTEND_PORT = 5173
        mock_settings.CORS_ALLOWED_ORIGINS = ""
        mock_settings.DEPLOYMENT_ENV = "production"
        mock_settings.CORS_ALLOWED_CLOUD_RUN = ""

        app = MagicMock()
        configure_middleware(app)

        app.add_middleware.assert_called_once()
        call_kwargs = app.add_middleware.call_args
        assert "allow_credentials" in call_kwargs.kwargs
        assert call_kwargs.kwargs["allow_credentials"] is True

    @patch("deployment_api.middleware.settings")
    def test_development_adds_dev_origins(self, mock_settings):
        mock_settings.API_PORT = 8080
        mock_settings.FRONTEND_PORT = 5173
        mock_settings.CORS_ALLOWED_ORIGINS = ""
        mock_settings.DEPLOYMENT_ENV = "development"
        mock_settings.CORS_ALLOWED_CLOUD_RUN = ""

        app = MagicMock()
        configure_middleware(app)

        call_kwargs = app.add_middleware.call_args
        allow_origins = call_kwargs.kwargs.get("allow_origins", [])
        assert any("localhost" in o for o in allow_origins)

    @patch("deployment_api.middleware.settings")
    def test_production_origins_from_settings(self, mock_settings):
        mock_settings.API_PORT = 8080
        mock_settings.FRONTEND_PORT = 5173
        mock_settings.CORS_ALLOWED_ORIGINS = "https://example.com,https://app.example.com"
        mock_settings.DEPLOYMENT_ENV = "production"
        mock_settings.CORS_ALLOWED_CLOUD_RUN = ""

        app = MagicMock()
        configure_middleware(app)

        call_kwargs = app.add_middleware.call_args
        allow_origins = call_kwargs.kwargs.get("allow_origins", [])
        assert "https://example.com" in allow_origins
        assert "https://app.example.com" in allow_origins

    @patch("deployment_api.middleware.settings")
    def test_production_no_dev_origins(self, mock_settings):
        mock_settings.API_PORT = 8080
        mock_settings.FRONTEND_PORT = 5173
        mock_settings.CORS_ALLOWED_ORIGINS = ""
        mock_settings.DEPLOYMENT_ENV = "production"
        mock_settings.CORS_ALLOWED_CLOUD_RUN = ""

        app = MagicMock()
        configure_middleware(app)

        call_kwargs = app.add_middleware.call_args
        allow_origins = call_kwargs.kwargs.get("allow_origins", [])
        assert len(allow_origins) == 0


class TestConfigureMiddlewareWithCloudRun:
    """Tests when CORS_ALLOWED_CLOUD_RUN is set."""

    @patch("deployment_api.middleware.settings")
    def test_adds_cors_middleware_with_regex(self, mock_settings):
        mock_settings.API_PORT = 8080
        mock_settings.FRONTEND_PORT = 5173
        mock_settings.CORS_ALLOWED_ORIGINS = ""
        mock_settings.DEPLOYMENT_ENV = "production"
        mock_settings.CORS_ALLOWED_CLOUD_RUN = "my-service,other-service"

        app = MagicMock()
        configure_middleware(app)

        app.add_middleware.assert_called_once()
        call_kwargs = app.add_middleware.call_args
        # Should include allow_origin_regex
        assert "allow_origin_regex" in call_kwargs.kwargs
        regex = call_kwargs.kwargs["allow_origin_regex"]
        assert "my-service" in regex
        assert "other-service" in regex

    @patch("deployment_api.middleware.settings")
    def test_single_cloud_run_service_regex(self, mock_settings):
        mock_settings.API_PORT = 8080
        mock_settings.FRONTEND_PORT = 5173
        mock_settings.CORS_ALLOWED_ORIGINS = ""
        mock_settings.DEPLOYMENT_ENV = "production"
        mock_settings.CORS_ALLOWED_CLOUD_RUN = "deployment-api"

        app = MagicMock()
        configure_middleware(app)

        call_kwargs = app.add_middleware.call_args
        regex = call_kwargs.kwargs["allow_origin_regex"]
        assert "deployment-api" in regex
        assert "run\\.app" in regex or "run.app" in regex

    @patch("deployment_api.middleware.settings")
    def test_allowed_methods_always_set(self, mock_settings):
        mock_settings.API_PORT = 8080
        mock_settings.FRONTEND_PORT = 5173
        mock_settings.CORS_ALLOWED_ORIGINS = ""
        mock_settings.DEPLOYMENT_ENV = "production"
        mock_settings.CORS_ALLOWED_CLOUD_RUN = ""

        app = MagicMock()
        configure_middleware(app)

        call_kwargs = app.add_middleware.call_args
        methods = call_kwargs.kwargs.get("allow_methods", [])
        assert "GET" in methods
        assert "POST" in methods
        assert "DELETE" in methods
