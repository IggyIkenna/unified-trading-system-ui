"""
Unit tests for auth_middleware module.

auth_middleware.py only re-exports from unified_trading_library.
Tests verify the __all__ exports are accessible.
"""

from deployment_api.auth_middleware import __all__


class TestAuthMiddlewareExports:
    """Tests that auth_middleware correctly re-exports from UTL."""

    def test_all_exports_defined(self):
        assert "GoogleUser" in __all__
        assert "get_current_user" in __all__
        assert "role_required" in __all__

    def test_all_has_expected_count(self):
        assert len(__all__) == 3

    def test_google_user_importable(self):
        from deployment_api.auth_middleware import GoogleUser

        assert GoogleUser is not None

    def test_get_current_user_importable(self):
        from deployment_api.auth_middleware import get_current_user

        assert get_current_user is not None

    def test_role_required_importable(self):
        from deployment_api.auth_middleware import role_required

        assert role_required is not None
