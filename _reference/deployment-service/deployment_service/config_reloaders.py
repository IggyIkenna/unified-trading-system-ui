"""Domain config hot-reload wiring for deployment-service."""

from __future__ import annotations

import logging

from unified_config_interface import InstrumentDomainConfig, VenueDomainConfig
from unified_events_interface import log_event
from unified_trading_library import DomainConfigReloader

logger = logging.getLogger(__name__)

_instrument_reloader: DomainConfigReloader[InstrumentDomainConfig] | None = None
_venue_reloader: DomainConfigReloader[VenueDomainConfig] | None = None


def _on_instruments_reload(config: InstrumentDomainConfig) -> None:
    logger.info(
        "Instruments domain config reloaded: %d instruments, %d venues",
        len(config.subscription_list),
        len(config.enabled_venues),
    )
    log_event(
        "CONFIG_CHANGED",
        details={
            "domain": "instruments",
            "service": "deployment-service",
            "instruments_count": len(config.subscription_list),
            "venues_count": len(config.enabled_venues),
        },
    )


def _on_venues_reload(config: VenueDomainConfig) -> None:
    logger.info(
        "Venues domain config reloaded: %d enabled venues",
        len(config.enabled_venues),
    )
    log_event(
        "CONFIG_CHANGED",
        details={
            "domain": "venues",
            "service": "deployment-service",
            "enabled_venues_count": len(config.enabled_venues),
        },
    )


def start_domain_config_reloaders(service_config: object) -> None:
    """Start domain config reloaders. Call on service startup."""
    global _instrument_reloader, _venue_reloader

    config_store_bucket: str = getattr(service_config, "config_store_bucket", "")
    project_id: str | None = getattr(service_config, "project_id", None)

    if not config_store_bucket:
        logger.info("CONFIG_STORE_BUCKET not set — domain config hot-reload disabled")
        return

    _instrument_reloader = DomainConfigReloader(
        domain="instruments",
        config_class=InstrumentDomainConfig,
        config_bucket=config_store_bucket,
        project_id=project_id,
    )
    _instrument_reloader.on_reload(_on_instruments_reload)
    _instrument_reloader.start_watching()

    _venue_reloader = DomainConfigReloader(
        domain="venues",
        config_class=VenueDomainConfig,
        config_bucket=config_store_bucket,
        project_id=project_id,
    )
    _venue_reloader.on_reload(_on_venues_reload)
    _venue_reloader.start_watching()

    logger.info("Domain config reloaders started: instruments, venues")


def stop_domain_config_reloaders() -> None:
    """Stop domain config reloaders. Call on service shutdown."""
    global _instrument_reloader, _venue_reloader
    if _instrument_reloader is not None:
        _instrument_reloader.stop_watching()
        _instrument_reloader = None
    if _venue_reloader is not None:
        _venue_reloader.stop_watching()
        _venue_reloader = None
    logger.info("Domain config reloaders stopped")
