"""Venue execution profile — execution method, API, browser automation, geographic and financial constraints.

Schema for sports execution venues. Lives in canonical/domain/sports/venue_execution.py.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from enum import StrEnum

from .._base import CanonicalBase
from .betting import CommissionModel


class ExecutionMethod(StrEnum):
    """Primary execution method for the venue."""

    REST_API = "rest_api"
    WEBSOCKET_API = "websocket_api"
    FIX_PROTOCOL = "fix_protocol"
    BROWSER_AUTOMATION = "browser_automation"
    HYBRID = "hybrid"


class AntiDetectionLevel(StrEnum):
    """Anti-bot / anti-detection severity for browser automation."""

    NONE = "none"
    BASIC = "basic"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"
    EXTREME = "extreme"


class CredentialType(StrEnum):
    """Type of credentials required for the venue."""

    API_KEY = "api_key"
    API_KEY_SECRET = "api_key_secret"
    OAUTH2 = "oauth2"
    USERNAME_PASSWORD = "username_password"
    USERNAME_PASSWORD_2FA = "username_password_2fa"
    CERTIFICATE = "certificate"
    WALLET_PRIVATE_KEY = "wallet_private_key"


class AccountVerificationLevel(StrEnum):
    """KYC / account verification level required."""

    NONE = "none"
    EMAIL = "email"
    PHONE = "phone"
    KYC_BASIC = "kyc_basic"
    KYC_ENHANCED = "kyc_enhanced"
    KYC_FULL = "kyc_full"


class VenueCategory(StrEnum):
    """How we connect to the venue."""

    EXCHANGE = "exchange"
    BOOKMAKER_API = "bookmaker_api"
    SCRAPER = "scraper"


class VenueExecutionProfile(CanonicalBase):
    """Execution profile for a sports venue — API, browser automation, geographic and financial constraints."""

    # Identity
    venue_key: str
    venue_category: VenueCategory | None = None
    odds_api_key: str | None = None
    display_name: str | None = None
    parent_company: str | None = None

    # Execution method
    primary_execution_method: ExecutionMethod | None = None
    fallback_execution_method: ExecutionMethod | None = None

    # API details
    api_base_url: str | None = None
    api_docs_url: str | None = None
    api_version: str | None = None
    has_rest_api: bool | None = None
    has_websocket_api: bool | None = None
    has_streaming_api: bool | None = None
    has_fix_protocol: bool | None = None
    api_rate_limit_requests_per_second: int | None = None
    api_rate_limit_requests_per_minute: int | None = None
    api_fee_monthly: Decimal | None = None
    api_fee_one_off: Decimal | None = None
    api_fee_currency: str | None = None

    # Browser automation
    login_url: str | None = None
    bet_placement_url_pattern: str | None = None
    account_url: str | None = None
    withdrawal_url: str | None = None
    deposit_url: str | None = None
    mobile_site_url: str | None = None
    uses_single_page_app: bool | None = None
    requires_javascript: bool | None = None
    anti_detection_level: AntiDetectionLevel | None = None
    known_waf: str | None = None
    requires_captcha: bool | None = None
    captcha_type: str | None = None
    requires_geolocation_check: bool | None = None
    geolocation_provider: str | None = None
    session_timeout_minutes: int | None = None
    max_concurrent_sessions: int | None = None

    # Credentials
    credential_type: CredentialType | None = None
    requires_2fa: bool | None = None
    two_factor_method: str | None = None
    account_verification_level: AccountVerificationLevel | None = None
    config_secret_field: str | None = None  # Secret Manager key for UnifiedCloudConfig
    username_secret_key: str | None = None  # For browser venues
    password_secret_key: str | None = None  # For browser venues
    api_key_secret_key: str | None = None  # For API venues
    totp_secret_key: str | None = None  # For 2FA

    # Geographic
    headquarters_country: str | None = None
    license_jurisdictions: list[str] | None = None
    available_countries: list[str] | None = None
    blocked_countries: list[str] | None = None
    blocked_us_states: list[str] | None = None
    available_us_states: list[str] | None = None
    requires_residency: bool | None = None
    residency_countries: list[str] | None = None
    requires_local_payment_method: bool | None = None
    ip_geo_enforcement: bool | None = None
    vpn_detection: bool | None = None

    # Financial
    supported_currencies: list[str] | None = None
    min_deposit: Decimal | None = None
    max_deposit: Decimal | None = None
    min_withdrawal: Decimal | None = None
    max_withdrawal_per_transaction: Decimal | None = None
    max_withdrawal_per_day: Decimal | None = None
    max_withdrawal_per_week: Decimal | None = None
    max_withdrawal_per_month: Decimal | None = None
    withdrawal_delay_hours_min: int | None = None
    withdrawal_delay_hours_max: int | None = None
    withdrawal_methods: list[str] | None = None
    deposit_methods: list[str] | None = None
    supports_crypto_deposit: bool | None = None
    supports_crypto_withdrawal: bool | None = None
    crypto_currencies_accepted: list[str] | None = None

    # Bet limits
    min_bet: Decimal | None = None
    min_bet_currency: str | None = None
    max_bet_per_market: Decimal | None = None
    max_payout: Decimal | None = None
    max_payout_currency: str | None = None
    limits_winning_accounts: bool | None = None
    account_limiting_severity: str | None = None

    # Fees
    commission_model: CommissionModel | None = None
    commission_rate: Decimal | None = None
    commission_notes: str | None = None
    withdrawal_fee: Decimal | None = None
    withdrawal_fee_type: str | None = None

    # Operational
    notes: str | None = None
    known_issues: str | None = None
    last_verified_date: date | None = None


__all__ = [
    "AccountVerificationLevel",
    "AntiDetectionLevel",
    "CredentialType",
    "ExecutionMethod",
    "VenueCategory",
    "VenueExecutionProfile",
]
