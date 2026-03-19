"""
Config Loader - Load sharding configurations from YAML files

Handles loading:
- venues.yaml: Canonical venue-category mappings
- sharding.SERVICE.yaml: Per-service sharding configurations
- cloud-providers.yaml: Cloud provider configurations (GCP/AWS)
"""

import logging
import re
from pathlib import Path
from typing import cast

import yaml

from .config.base_config import BaseConfigLoader
from .config.bootstrap_config import TopologyBootstrapConfig
from .config.config_validator import ConfigurationError, ConfigValidator, ValidationUtils
from .config.env_substitutor import (
    build_storage_path_variables,
    get_cloud_provider,
    parse_gcs_path,
    parse_storage_path,
    substitute_env_vars,
)

logger = logging.getLogger(__name__)


class ConfigLoader(BaseConfigLoader):
    """
    Loads sharding configuration files.

    Configuration files are expected to be in YAML format:
    - configs/venues.yaml: Venue-category mappings
    - configs/sharding.{service}.yaml: Service-specific sharding configs
    - configs/cloud-providers.yaml: Cloud provider configurations
    """

    def __init__(self, config_dir: str = "configs"):
        """Initialize the config loader."""
        super().__init__(config_dir)
        self.validator = ConfigValidator()

    def load_venues_config(self) -> dict[str, object]:
        """Load the venues configuration file."""
        config = self._load_yaml_file("venues.yaml")
        self.validator.validate_venues_config(config)
        return config

    def load_venue_data_types(self) -> dict[str, object]:
        """Load the venue-specific data types configuration."""
        return self._load_optional_yaml_file("venue_data_types.yaml")

    def load_data_providers_config(self) -> dict[str, object]:
        """Load data provider configuration."""
        return self._load_optional_yaml_file("data-providers.yaml")

    def load_service_config(self, service: str) -> dict[str, object]:
        """Load sharding configuration for a specific service."""
        config = self._load_yaml_file(f"sharding.{service}.yaml", service)
        self.validator.validate_service_config(config, service)
        return config

    def load_expected_start_dates(self) -> dict[str, object]:
        """Load expected start dates configuration."""
        config = self._load_optional_yaml_file("expected_start_dates.yaml")
        if config:
            self.validator.validate_expected_start_dates_config(config)
        return config

    def load_cloud_providers_config(self) -> dict[str, object]:
        """Load cloud providers configuration."""
        config = self._load_optional_yaml_file("cloud-providers.yaml")
        if config:
            self.validator.validate_cloud_providers_config(config)
        return config

    def load_runtime_topology_config(self) -> dict[str, object]:
        """Load runtime topology from PM (SSOT).

        Resolution order:
        1. RUNTIME_TOPOLOGY_PATH (from TopologyBootstrapConfig)
        2. {WORKSPACE_ROOT}/unified-trading-pm/configs/runtime-topology.yaml
        """
        bootstrap = TopologyBootstrapConfig.from_env()
        if bootstrap.runtime_topology_path:
            path = Path(bootstrap.runtime_topology_path)
            if path.exists():
                cache_key = "runtime-topology"
                if cache_key in self._cache:
                    return cast(dict[str, object], self._cache[cache_key])
                with open(path) as f:
                    content = cast(dict[str, object], yaml.safe_load(f) or {})
                self._cache[cache_key] = content
                return content
            logger.warning(
                "RUNTIME_TOPOLOGY_PATH=%s does not exist", bootstrap.runtime_topology_path
            )

        if bootstrap.workspace_root:
            pm_path = (
                Path(bootstrap.workspace_root)
                / "unified-trading-pm"
                / "configs"
                / "runtime-topology.yaml"
            )
            if pm_path.exists():
                cache_key = "runtime-topology"
                if cache_key in self._cache:
                    return cast(dict[str, object], self._cache[cache_key])
                with open(pm_path) as f:
                    content = cast(dict[str, object], yaml.safe_load(f) or {})
                self._cache[cache_key] = content
                return content
            logger.warning("PM topology not found at %s", pm_path)

        logger.warning(
            "runtime-topology.yaml not found. Set RUNTIME_TOPOLOGY_PATH or WORKSPACE_ROOT."
        )
        return {}

    def list_available_services(self) -> list[str]:
        """List all available services with sharding configs."""
        if not self.config_dir.exists():
            return []

        services: list[str] = []
        for path in self.config_dir.glob("sharding.*.yaml"):
            service = path.stem.replace("sharding.", "")
            services.append(service)

        return sorted(services)

    # Venue and category helper methods
    def get_category_start_date(self, service: str, category: str) -> str | None:
        """Get the expected start date for a service/category."""
        config = self.load_expected_start_dates()
        if not config or service not in config:
            return None

        service_config_raw = config[service]
        if not isinstance(service_config_raw, dict) or category not in service_config_raw:
            return None

        service_config_dict = cast(dict[str, object], service_config_raw)
        category_config = service_config_dict[category]
        if isinstance(category_config, dict):
            val = cast(dict[str, object], category_config).get("category_start")
            return str(val) if val is not None else None
        return None

    def get_venue_start_date(self, service: str, category: str, venue: str) -> str | None:
        """Get the expected start date for a specific venue."""
        config = self.load_expected_start_dates()
        if not config:
            return None

        # Try the requested service first
        if service in config and isinstance(config[service], dict):
            service_config = cast(dict[str, object], config[service])
            if category in service_config and isinstance(service_config[category], dict):
                category_config = cast(dict[str, object], service_config[category])
                venues = category_config.get("venues")
                if isinstance(venues, dict) and venue in venues:
                    val = cast(dict[str, object], venues)[venue]
                    return str(val) if val is not None else None

        # Fallback to canonical services
        fallback_services = ["market-tick-data-service", "instruments-service"]
        for fallback in fallback_services:
            if fallback == service or fallback not in config:
                continue

            fallback_config_raw = config[fallback]
            if not isinstance(fallback_config_raw, dict) or category not in fallback_config_raw:
                continue

            fallback_config_dict = cast(dict[str, object], fallback_config_raw)
            category_config = fallback_config_dict[category]
            if isinstance(category_config, dict):
                venues = cast(dict[str, object], category_config).get("venues")
                if isinstance(venues, dict) and venue in venues:
                    val = cast(dict[str, object], venues)[venue]
                    return str(val) if val is not None else None

        return None

    def get_venue_expected_data_types(self, category: str, venue: str, date_str: str) -> list[str]:
        """Get the expected data types for a specific venue on a given date."""
        venues_config = self.load_venues_config()

        # Validate required structure
        try:
            categories = cast(
                dict[str, object],
                ValidationUtils.get_required(venues_config, "categories", "venues config"),
            )
            category_config = cast(
                dict[str, object],
                ValidationUtils.get_required(categories, category, "venues categories"),
            )
        except ConfigurationError:
            logger.warning("Category '%s' not found in venues config", category)
            return []

        # Get venue_data_types mapping - optional
        venue_data_types_raw = category_config.get("venue_data_types")
        if not isinstance(venue_data_types_raw, dict):
            # Fallback to category-level data types
            default_types_raw = category_config.get("data_types")
            return (
                [str(x) for x in cast(list[object], default_types_raw)]
                if isinstance(default_types_raw, list)
                else []
            )

        venue_data_types_dict = cast(dict[str, object], venue_data_types_raw)
        venue_types_raw = venue_data_types_dict.get(venue)
        if not isinstance(venue_types_raw, dict):
            # Fallback to category-level data types
            default_types_raw = category_config.get("data_types")
            return (
                [str(x) for x in cast(list[object], default_types_raw)]
                if isinstance(default_types_raw, list)
                else []
            )

        venue_types_dict = cast(dict[str, object], venue_types_raw)

        # Check if date is within a tick_window
        tick_windows = category_config.get("tick_windows")
        is_tick_window = False
        if isinstance(tick_windows, list):
            for window_raw in cast(list[object], tick_windows):
                if not isinstance(window_raw, dict):
                    continue
                window = cast(dict[str, object], window_raw)
                start = window.get("start")
                end = window.get("end")
                if start and end and str(start) <= date_str <= str(end):
                    is_tick_window = True
                    break

        # Collect data types from all instrument types for this venue
        expected: set[str] = set()
        for _inst_type, type_config_raw in venue_types_dict.items():
            if not isinstance(type_config_raw, dict):
                continue
            type_config = cast(dict[str, object], type_config_raw)

            if is_tick_window:
                tick_types = type_config.get("tick_window")
                if isinstance(tick_types, list):
                    expected.update(str(t) for t in cast(list[object], tick_types))
            else:
                default_types_inner = type_config.get("default")
                if isinstance(default_types_inner, list):
                    expected.update(str(t) for t in cast(list[object], default_types_inner))

        return list(expected)

    def is_data_type_expected_for_venue(
        self, category: str, venue: str, data_type: str, date_str: str | None = None
    ) -> bool:
        """Check if a data_type is expected for a specific venue."""
        venue_config = self.load_venue_data_types()
        if venue_config:
            cat_config_raw = venue_config.get(category)
            if isinstance(cat_config_raw, dict):
                cat_config = cast(dict[str, object], cat_config_raw)
                venues = cat_config.get("venues")
                if isinstance(venues, dict):
                    venues_dict = cast(dict[str, object], venues)
                    venue_info_raw = venues_dict.get(venue)
                    if isinstance(venue_info_raw, dict):
                        venue_info = cast(dict[str, object], venue_info_raw)
                        data_types_raw: object = venue_info.get("data_types")

                        if data_types_raw:
                            if isinstance(data_types_raw, dict):
                                data_types_dict = cast(dict[str, object], data_types_raw)
                                is_tick_window = False
                                if date_str:
                                    tick_windows = cat_config.get("tick_windows")
                                    if isinstance(tick_windows, list):
                                        for window_raw in cast(list[object], tick_windows):
                                            if not isinstance(window_raw, dict):
                                                continue
                                            window = cast(dict[str, object], window_raw)
                                            start = window.get("start")
                                            end = window.get("end")
                                            if start and end and str(start) <= date_str <= str(end):
                                                is_tick_window = True
                                                break

                                resolved_types: list[object] | None = None
                                if is_tick_window:
                                    tick_types = data_types_dict.get("tick_window")
                                    if isinstance(tick_types, list):
                                        resolved_types = cast(list[object], tick_types)
                                    else:
                                        default_val = data_types_dict.get("default")
                                        resolved_types = (
                                            cast(list[object], default_val)
                                            if isinstance(default_val, list)
                                            else None
                                        )
                                else:
                                    default_val = data_types_dict.get("default")
                                    resolved_types = (
                                        cast(list[object], default_val)
                                        if isinstance(default_val, list)
                                        else None
                                    )

                                data_types_raw = (
                                    resolved_types if resolved_types is not None else []
                                )

                            if isinstance(data_types_raw, list):
                                return data_type in cast(list[object], data_types_raw)

        # Fallback to venue-specific expectations
        if date_str:
            expected = self.get_venue_expected_data_types(category, venue, date_str)
            return data_type in expected

        # Default to allowing all data types if no specific configuration
        return True

    def get_chain_data_type_config(self) -> dict[str, object]:
        """Get configuration for chain data types."""
        venue_config = self.load_venue_data_types()
        if not venue_config:
            return {}

        chain_config = venue_config.get("chain_data_types")
        return cast(dict[str, object], chain_config) if isinstance(chain_config, dict) else {}

    def get_all_venue_data_type_expectations(
        self, category: str, date_str: str
    ) -> dict[str, list[str]]:
        """Get expected data types for ALL venues in a category for a given date."""
        venues_config = self.load_venues_config()

        try:
            categories = cast(
                dict[str, object],
                ValidationUtils.get_required(venues_config, "categories", "venues config"),
            )
            category_config = cast(
                dict[str, object],
                ValidationUtils.get_required(categories, category, "venues categories"),
            )
        except ConfigurationError:
            logger.warning("Category '%s' not found in venues config", category)
            return {}

        venues = category_config.get("venues")
        if not isinstance(venues, list):
            logger.warning("Venues list not found or invalid for category '%s'", category)
            return {}

        result: dict[str, list[str]] = {}
        for venue_raw in cast(list[object], venues):
            venue_str = str(venue_raw)
            expected = self.get_venue_expected_data_types(category, venue_str, date_str)
            result[venue_str] = expected

        return result

    # Compute configuration methods
    def get_compute_recommendation(
        self, service: str, compute_type: str = "vm"
    ) -> dict[str, object]:
        """Get compute recommendations for a service."""
        config = self.load_service_config(service)
        compute = config.get("compute")

        # Apply sensible defaults if compute section missing or invalid
        if not isinstance(compute, dict) or compute_type not in compute:
            logger.info("No compute config for %s.%s, using defaults", service, compute_type)
            if compute_type == "vm":
                return {"machine_type": "c2-standard-4", "disk_size_gb": 50}
            elif compute_type == "cloud_run":
                return {"memory": "4Gi", "cpu": 2, "timeout_seconds": 3600}
            else:
                raise ConfigurationError(
                    f"Unknown compute type '{compute_type}' for service '{service}'"
                )

        compute_dict = cast(dict[str, object], compute)
        compute_config = compute_dict[compute_type]
        if not isinstance(compute_config, dict):
            raise ConfigurationError(
                f"Invalid compute config for {service}.{compute_type}"
                f" - expected dict, got {type(compute_config)}"
            )

        return cast(dict[str, object], compute_config)

    def get_venue_overrides(self, service: str) -> dict[str, dict[str, object]]:
        """Get venue-specific compute overrides for a service."""
        config = self.load_service_config(service)
        compute = config.get("compute")

        if not isinstance(compute, dict):
            logger.debug("No compute section found for service '%s'", service)
            return {}

        compute_dict = cast(dict[str, object], compute)
        venue_overrides = compute_dict.get("venue_overrides")
        if not isinstance(venue_overrides, dict):
            logger.debug("No venue overrides found for service '%s'", service)
            return {}

        return cast(dict[str, dict[str, object]], venue_overrides)

    def get_compute_config_for_shard(
        self,
        service: str,
        compute_type: str,
        shard_dimensions: dict[str, str],
    ) -> dict[str, object]:
        """Get compute configuration for a specific shard, applying venue overrides."""
        base_config = self.get_compute_recommendation(service, compute_type)

        venue = shard_dimensions.get("venue")
        if not venue:
            return base_config

        venue_overrides = self.get_venue_overrides(service)
        if venue not in venue_overrides:
            return base_config

        venue_config = venue_overrides[venue].get(compute_type)
        if isinstance(venue_config, dict) and venue_config:
            venue_config_dict = cast(dict[str, object], venue_config)
            logger.info("Applying venue override for %s: %s", venue, venue_config_dict)
            merged: dict[str, object] = {**base_config, **venue_config_dict}
            return merged

        return base_config

    def get_scaled_compute_config(
        self,
        service: str,
        compute_type: str,
        max_workers: int | None = None,
        skip_venue_sharding: bool = False,
    ) -> dict[str, object]:
        """Get compute config scaled by max-workers ratio and venue sharding settings."""
        base_config = self.get_compute_recommendation(service, compute_type)
        service_config = self.load_service_config(service)

        base_max_workers: int = 4
        cli_optional = service_config.get("cli_optional")
        if isinstance(cli_optional, list):
            for opt_raw in cast(list[object], cli_optional):
                if isinstance(opt_raw, dict):
                    opt = cast(dict[str, object], opt_raw)
                    if opt.get("name") == "max-workers":
                        base_max_workers = int(cast(int, opt.get("default") or 4))
                        break

        effective_max_workers: int = max_workers if max_workers is not None else base_max_workers
        scale_factor = max(1.0, effective_max_workers / base_max_workers)

        if skip_venue_sharding:
            scale_factor *= 2.0
            logger.info("Venue sharding skipped - applying 2x scaling factor")

        if scale_factor > 1.0:
            logger.info("Scaling compute by %.1fx", scale_factor)
            base_config = self._scale_machine_type(base_config, scale_factor, compute_type)

        return base_config

    def _scale_machine_type(
        self, config: dict[str, object], scale_factor: float, compute_type: str
    ) -> dict[str, object]:
        """Scale machine type by a factor."""
        config = config.copy()

        if compute_type == "vm":
            current = str(config.get("machine_type", "c2-standard-16"))
            c2_match = re.match(r"(c2-standard-)(\d+)", current)
            if c2_match:
                prefix, vcpus = c2_match.groups()
                requested = min(60, int(int(vcpus) * scale_factor))
                valid_c2_vcpus = (4, 8, 16, 30, 60)
                new_vcpus = min(valid_c2_vcpus, key=lambda x: (abs(x - requested), x))
                config["machine_type"] = f"{prefix}{new_vcpus}"
                logger.info("Scaled VM: %s -> %s", current, config["machine_type"])

            current_disk_raw = config.get("disk_size_gb", 150)
            current_disk: float = float(cast(float, current_disk_raw))
            config["disk_size_gb"] = int(current_disk * scale_factor)

        elif compute_type == "cloud_run":
            current_mem = str(config.get("memory", "64Gi"))
            mem_value = int(current_mem.replace("Gi", "").replace("Mi", ""))
            is_gi = "Gi" in current_mem
            new_mem = int(mem_value * scale_factor)

            if is_gi:
                new_mem = min(128, new_mem)
                config["memory"] = f"{new_mem}Gi"
            else:
                config["memory"] = f"{new_mem}Mi"

            current_cpu_val = config.get("cpu", "8")
            if isinstance(current_cpu_val, str):
                current_cpu = int(current_cpu_val)
            else:
                current_cpu = int(cast(int | float, current_cpu_val))
            new_cpu = min(8, int(current_cpu * scale_factor))
            config["cpu"] = str(new_cpu)

            logger.info("Scaled Cloud Run: memory=%s, cpu=%s", config["memory"], config["cpu"])

        return config

    # Cloud provider methods
    def get_docker_image(
        self, service: str, tag: str = "latest", provider: str | None = None
    ) -> str:
        """Get the Docker image URL for a service based on cloud provider."""
        provider = provider or get_cloud_provider()
        cloud_config = self.load_cloud_providers_config()

        if not cloud_config:
            logger.warning("No cloud providers config found, falling back to service config")
            service_config = self.load_service_config(service)
            raw = str(service_config.get("docker_image", f"{service}:{tag}"))
            return substitute_env_vars(raw)

        provider_config_raw = cloud_config.get(provider)
        if not isinstance(provider_config_raw, dict):
            logger.warning(
                "Provider '%s' not found in cloud config, falling back to service config", provider
            )
            service_config = self.load_service_config(service)
            raw = str(service_config.get("docker_image") or f"{service}:{tag}")
            return substitute_env_vars(raw)

        provider_config = cast(dict[str, object], provider_config_raw)
        registry_config_raw = provider_config.get("container_registry")
        if not isinstance(registry_config_raw, dict):
            logger.warning(
                "No container registry config for provider '%s', falling back to service config",
                provider,
            )
            service_config = self.load_service_config(service)
            raw = str(service_config.get("docker_image") or f"{service}:{tag}")
            return substitute_env_vars(raw)

        registry_config = cast(dict[str, object], registry_config_raw)

        # Get repository mapping (optional)
        repo_mapping = cloud_config.get("service_repositories")
        if isinstance(repo_mapping, dict):
            repo_mapping_dict = cast(dict[str, object], repo_mapping)
            repository: str = str(repo_mapping_dict.get(service) or service)
        else:
            repository = service

        url_pattern = ValidationUtils.get_with_default(
            registry_config, "url_pattern", None, f"container registry for {provider}"
        )
        default_tag = str(registry_config.get("default_tag") or "latest")
        tag = tag or default_tag

        if not url_pattern:
            service_config = self.load_service_config(service)
            raw = str(service_config.get("docker_image", f"{service}:{tag}"))
            return substitute_env_vars(raw)

        variables = build_storage_path_variables()
        variables.update({"service": service, "repository": str(repository), "tag": tag})

        if provider == "aws":
            variables.update(
                {
                    "account_id": substitute_env_vars("${AWS_ACCOUNT_ID}"),
                    "region": substitute_env_vars("${AWS_REGION:-us-east-1}"),
                }
            )

        return substitute_env_vars(str(url_pattern)).format(**variables)

    def get_bucket_name(self, domain: str, category: str = "", provider: str | None = None) -> str:
        """Get the bucket name for a domain/category based on cloud provider."""
        provider = provider or get_cloud_provider()
        cloud_config = self.load_cloud_providers_config()

        if not cloud_config:
            logger.warning("No cloud providers config available")
            return ""

        provider_config_raw = cloud_config.get(provider)
        if not isinstance(provider_config_raw, dict):
            logger.warning("Provider '%s' not found in cloud providers config", provider)
            return ""
        provider_config = cast(dict[str, object], provider_config_raw)

        storage_config_raw = provider_config.get("storage")
        if not isinstance(storage_config_raw, dict):
            logger.warning("No storage config found for provider '%s'", provider)
            return ""

        storage_config = cast(dict[str, object], storage_config_raw)
        domain_config = storage_config.get(domain)
        if domain_config is None:
            logger.warning("Storage domain '%s' not found in cloud providers config", domain)
            return ""

        bucket_template: object
        if isinstance(domain_config, dict):
            if not category:
                logger.warning("Category required for domain '%s' with dict config", domain)
                return ""
            bucket_template = ValidationUtils.get_with_default(
                cast(dict[str, object], domain_config),
                category.upper(),
                None,
                f"storage config for {domain}.{category}",
            )
        else:
            bucket_template = domain_config

        if not bucket_template:
            logger.warning(
                "No bucket template found for domain '%s', category '%s'", domain, category
            )
            return ""

        return substitute_env_vars(str(bucket_template))

    def get_container_registry_url(self, provider: str | None = None) -> str:
        """Get the base container registry URL for the provider."""
        provider = provider or get_cloud_provider()

        if provider == "aws":
            account_id = substitute_env_vars("${AWS_ACCOUNT_ID}")
            region = substitute_env_vars("${AWS_REGION:-us-east-1}")
            return f"{account_id}.dkr.ecr.{region}.amazonaws.com"
        else:  # GCP
            project_id = substitute_env_vars("${GCP_PROJECT_ID}")
            region = substitute_env_vars("${GCS_REGION:-asia-northeast1}")
            return f"{region}-docker.pkg.dev/{project_id}"

    # CLI configuration methods
    def get_cli_args_mapping(self, service: str) -> dict[str, str]:
        """Get CLI argument mappings for a service."""
        config = self.load_service_config(service)
        cli_args = config.get("cli_args")

        if not isinstance(cli_args, dict):
            logger.debug("No CLI args mapping found for service '%s'", service)
            return {}

        return cast(dict[str, str], cli_args)

    def get_cli_flags(self, service: str) -> dict[str, str]:
        """Get CLI flags for a service."""
        config = self.load_service_config(service)
        cli_flags = config.get("cli_flags")

        if not isinstance(cli_flags, dict):
            logger.debug("No CLI flags found for service '%s'", service)
            return {}

        return cast(dict[str, str], cli_flags)


# Re-export parser functions
__all__ = ["ConfigLoader", "parse_gcs_path", "parse_storage_path"]
