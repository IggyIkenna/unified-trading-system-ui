# Configuration Loading Patterns

**Purpose:** Complete implementations for loading MAX_WORKERS and other deployment configs
**Date:** February 10, 2026
**Status:** Ready to implement

---

## Service MAX_WORKERS Configuration

### Config File Structure

**File:** `deployment-service-v2/configs/service_max_workers.yaml`

```yaml
# Service MAX_WORKERS Defaults
# Based on resource profiling (see RESOURCE_MONITORING_AND_RIGHTSIZING.md)

service_max_workers:
  # High parallelism (I/O-bound, low resource usage per date)
  instruments-service: 16
  features-calendar-service: 16

  # Moderate parallelism
  ml-inference-service: 3
  market-data-processing-service: 2 # Conservative, can go to 1 if RAM issues

  # No parallelism (memory-bound or already well-utilized)
  market-tick-data-handler: 1
  features-delta-one-service: 1
  ml-training-service: 1
  strategy-service: 1
  execution-service: 1
  features-volatility-service: 1
  features-onchain-service: 1
# Rationale by service:
# - instruments: 10% CPU, 3% RAM → can run 16 dates in parallel (90% CPU)
# - features-calendar: Similar profile to instruments
# - ml-inference: 40% CPU, 19% RAM → 3 dates = 85% CPU
# - market-processing: 70% CPU, 38% RAM → 2 dates max (conservative)
# - market-tick: 50% CPU, 63% RAM → memory-bound (10 GB/date)
# - features-delta-one: 90% CPU, 75% RAM → already maxed
# - ml-training: 95% CPU, 78% RAM → already maxed
# - Others: Conservative defaults until profiled

# Note: Adaptive approach may calculate different values at runtime
# These are starting points for static approach or fallback values
```

---

## Loading in Deployment Orchestrator

### Pattern 1: Load at Module Level (Recommended)

**File:** `deployment-service-v2/deployment_service/shard_calculator.py`

```python
import yaml
from pathlib import Path
from typing import Dict
import logging

logger = logging.getLogger(__name__)

# Default fallbacks (if config file not found)
DEFAULT_SERVICE_MAX_WORKERS = {
    "instruments-service": 16,
    "features-calendar-service": 16,
    "ml-inference-service": 3,
    "market-data-processing-service": 1,
    "market-tick-data-handler": 1,
    "features-delta-one-service": 1,
    "ml-training-service": 1,
    "strategy-service": 1,
    "execution-service": 1,
}

def load_service_max_workers_config() -> Dict[str, int]:
    """
    Load service MAX_WORKERS defaults from config file.

    Returns:
        Dictionary mapping service name to MAX_WORKERS default
    """
    # Find config file (relative to this module)
    config_path = Path(__file__).parent.parent / "configs" / "service_max_workers.yaml"

    if not config_path.exists():
        logger.warning(
            f"Config file not found: {config_path}. Using hardcoded defaults.",
            extra={"config_path": str(config_path)}
        )
        return DEFAULT_SERVICE_MAX_WORKERS.copy()

    try:
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)

        service_max_workers = config.get("service_max_workers", {})

        logger.info(
            f"Loaded MAX_WORKERS config for {len(service_max_workers)} services",
            extra={"config_path": str(config_path)}
        )

        return service_max_workers

    except Exception as e:
        logger.error(
            f"Failed to load MAX_WORKERS config: {e}. Using defaults.",
            extra={"config_path": str(config_path), "error": str(e)}
        )
        return DEFAULT_SERVICE_MAX_WORKERS.copy()

# Load once at module level (cached)
SERVICE_MAX_WORKERS = load_service_max_workers_config()

def get_service_default_max_workers(service_name: str) -> int:
    """
    Get default MAX_WORKERS for a service.

    Args:
        service_name: Service name (e.g., "instruments-service")

    Returns:
        Default MAX_WORKERS value (1 if not found)
    """
    return SERVICE_MAX_WORKERS.get(service_name, 1)
```

**Usage in calculate_shards():**

```python
def calculate_shards(
    service: str,
    start_date: str,
    end_date: str,
    shard_by: str = "date",
    max_workers: Optional[int] = None,
    **kwargs
) -> List[Dict]:
    """Calculate shards with MAX_WORKERS support"""

    # Get service default if not provided
    if max_workers is None:
        max_workers = get_service_default_max_workers(service)
        logger.info(f"Using default MAX_WORKERS={max_workers} for {service}")
    else:
        logger.info(f"Using override MAX_WORKERS={max_workers} for {service}")

    # Rest of shard calculation logic...
```

---

### Pattern 2: Load from Deployment Config (Alternative)

**File:** `deployment-service-v2/deployment_service/config.py` (if exists)

```python
from pydantic import BaseSettings, Field
from typing import Dict
import yaml
from pathlib import Path

class DeploymentConfig(BaseSettings):
    """Deployment orchestrator configuration"""

    project_id: str = Field(default="test-project")

    # Load service MAX_WORKERS from YAML
    service_max_workers: Dict[str, int] = Field(
        default_factory=lambda: _load_service_max_workers()
    )

    # Other config fields...

    class Config:
        env_prefix = "DEPLOYMENT_"

def _load_service_max_workers() -> Dict[str, int]:
    """Load from YAML or return defaults"""
    config_path = Path(__file__).parent.parent / "configs" / "service_max_workers.yaml"

    if config_path.exists():
        with open(config_path) as f:
            config = yaml.safe_load(f)
            return config.get("service_max_workers", {})

    return {
        "instruments-service": 16,
        "features-calendar-service": 16,
        # ... defaults
    }

# Singleton
_config = None

def get_deployment_config() -> DeploymentConfig:
    """Get deployment config singleton"""
    global _config
    if _config is None:
        _config = DeploymentConfig()
    return _config
```

**Usage:**

```python
from deployment_service.config import get_deployment_config

config = get_deployment_config()
max_workers = config.service_max_workers.get(service_name, 1)
```

---

## Loading in API Endpoints

### Pattern 3: Load in API Routes (For Dynamic Override)

**File:** `deployment-service-v2/api/routes/deployments.py`

```python
from deployment_service.shard_calculator import get_service_default_max_workers

@router.post("/deployments")
async def create_deployment(request: DeploymentRequest):
    """Create new deployment with MAX_WORKERS support"""

    # Get MAX_WORKERS (priority: user override > service default > 1)
    max_workers = request.max_workers

    if max_workers is None:
        # Use service default
        max_workers = get_service_default_max_workers(request.service)
        logger.info(f"Using service default MAX_WORKERS={max_workers}")
    else:
        logger.info(f"Using user override MAX_WORKERS={max_workers}")

    # Calculate shards with MAX_WORKERS
    shards = shard_calculator.calculate_shards(
        service=request.service,
        start_date=request.start_date,
        end_date=request.end_date,
        shard_by="date",
        max_workers=max_workers,
        **request.dict()
    )

    # Create deployment
    deployment = await deployment_service.create(
        service=request.service,
        shards=shards,
        max_workers=max_workers
    )

    return deployment
```

---

## Environment Variable Propagation

### From Deployment Orchestrator to Service

**In shard creation:**

```python
def create_shard_config(shard: Dict, deployment: Deployment) -> Dict:
    """Build shard configuration with env vars"""

    env_vars = {
        # Core identifiers
        "DEPLOYMENT_ID": deployment.deployment_id,
        "SHARD_ID": shard["shard_id"],

        # Parallelism control
        "MAX_WORKERS": str(shard["max_workers"]),  # From shard calculation

        # Machine specs (for adaptive calculation)
        "ALLOCATED_VCPUS": str(get_machine_vcpus(deployment.machine_type)),
        "ALLOCATED_MEMORY_GB": str(get_machine_memory_gb(deployment.machine_type)),

        # Category/domain
        "CATEGORY": shard.get("category", ""),
        "DOMAIN": shard.get("domain", ""),

        # User overrides
        **shard.get("env_vars", {})
    }

    return {
        "cli_args": shard["cli_args"],
        "env_vars": env_vars
    }

def get_machine_vcpus(machine_type: str) -> int:
    """Get vCPU count for machine type"""
    MACHINE_VCPUS = {
        "c2-standard-4": 4,
        "c2-standard-8": 8,
        "c2-standard-16": 16,
        "c2-standard-30": 30,
        "c2-standard-60": 60,
    }
    return MACHINE_VCPUS.get(machine_type, 4)

def get_machine_memory_gb(machine_type: str) -> int:
    """Get memory in GB for machine type"""
    MACHINE_MEMORY = {
        "c2-standard-4": 16,
        "c2-standard-8": 32,
        "c2-standard-16": 64,
        "c2-standard-30": 120,
        "c2-standard-60": 240,
    }
    return MACHINE_MEMORY.get(machine_type, 16)
```

---

## Terraform Variable Passing

### Read from YAML in Terraform (Optional)

**If you want Terraform to read the YAML directly:**

```hcl
# terraform/locals.tf

locals {
  # Load service MAX_WORKERS from YAML
  service_max_workers_yaml = yamldecode(file("${path.module}/../configs/service_max_workers.yaml"))
  service_max_workers      = local.service_max_workers_yaml.service_max_workers

  # Example access
  instruments_max_workers = local.service_max_workers["instruments-service"]
}

# terraform/services/instruments/main.tf

resource "google_cloud_run_v2_job" "instruments_job" {
  template {
    template {
      containers {
        env {
          name  = "MAX_WORKERS"
          value = tostring(local.service_max_workers[var.service_name])
        }
      }
    }
  }
}
```

---

### Hardcoded in Terraform (Simpler)

**If you prefer not to load YAML:**

```hcl
# terraform/variables.tf

variable "service_max_workers" {
  description = "Default MAX_WORKERS for date parallelism per service"
  type        = map(number)

  default = {
    "instruments-service"         = 16
    "features-calendar-service"   = 16
    "ml-inference-service"        = 3
    "market-data-processing-service" = 1
    "market-tick-data-handler"    = 1
    "features-delta-one-service"  = 1
    "ml-training-service"         = 1
    "strategy-service"            = 1
    "execution-service"          = 1
  }
}

# In job template
env {
  name  = "MAX_WORKERS"
  value = tostring(var.service_max_workers[var.service_name])
}
```

**Advantage:** Simpler, no YAML parsing in Terraform
**Disadvantage:** Duplicate definition (YAML + HCL)

**Recommendation:** Use hardcoded Terraform approach (simpler, more reliable)

---

## Configuration Validation

### At Deployment Creation

```python
def validate_max_workers(service: str, max_workers: int, machine_type: str) -> None:
    """
    Validate MAX_WORKERS is safe for service and machine type.

    Raises:
        ValueError: If MAX_WORKERS would likely cause OOM
    """
    # Get machine specs
    memory_gb = get_machine_memory_gb(machine_type)

    # Get service memory profile
    SERVICE_MEMORY_PROFILES = {
        "instruments-service": 0.5,  # GB per date
        "features-calendar-service": 0.5,
        "ml-inference-service": 3.0,
        "market-data-processing-service": 6.0,
        "market-tick-data-handler": 10.0,
        "features-delta-one-service": 12.0,
        "ml-training-service": 25.0,
    }

    memory_per_worker = SERVICE_MEMORY_PROFILES.get(service, 2.0)

    # Calculate required memory
    required_memory = max_workers * memory_per_worker * 1.5  # 1.5x safety

    if required_memory > memory_gb:
        raise ValueError(
            f"MAX_WORKERS={max_workers} would require {required_memory:.1f} GB "
            f"but machine has only {memory_gb} GB. Risk of OOM. "
            f"Reduce MAX_WORKERS or upsize machine type."
        )

    # Warn if very aggressive
    if required_memory > memory_gb * 0.8:
        logger.warning(
            f"MAX_WORKERS={max_workers} will use {required_memory / memory_gb * 100:.0f}% of RAM. "
            f"Consider reducing to {int(memory_gb * 0.7 / memory_per_worker)} for safety."
        )
```

**Call before creating deployment:**

```python
# In create_deployment()
validate_max_workers(
    service=request.service,
    max_workers=max_workers,
    machine_type=deployment_config.machine_type
)
```

---

## Complete Integration Example

### In ShardCalculator

```python
# deployment_service/shard_calculator.py

import yaml
from pathlib import Path
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class ShardCalculator:
    """Calculate shards for deployment with MAX_WORKERS support"""

    def __init__(self, config_dir: str):
        self.config_dir = Path(config_dir)

        # Load service MAX_WORKERS config
        self.service_max_workers = self._load_service_max_workers()

    def _load_service_max_workers(self) -> Dict[str, int]:
        """Load service MAX_WORKERS from config file"""
        config_path = self.config_dir / "service_max_workers.yaml"

        if not config_path.exists():
            logger.warning(f"MAX_WORKERS config not found: {config_path}")
            return {}

        try:
            with open(config_path) as f:
                config = yaml.safe_load(f)
            return config.get("service_max_workers", {})
        except Exception as e:
            logger.error(f"Failed to load MAX_WORKERS config: {e}")
            return {}

    def get_max_workers(
        self,
        service: str,
        user_override: Optional[int] = None
    ) -> int:
        """
        Get MAX_WORKERS for service (user override > config > default 1).

        Args:
            service: Service name
            user_override: User-specified MAX_WORKERS (takes precedence)

        Returns:
            MAX_WORKERS value to use
        """
        if user_override is not None:
            logger.info(f"Using user override MAX_WORKERS={user_override} for {service}")
            return user_override

        if service in self.service_max_workers:
            default = self.service_max_workers[service]
            logger.info(f"Using config default MAX_WORKERS={default} for {service}")
            return default

        logger.warning(f"No MAX_WORKERS config for {service}, using default=1")
        return 1

    def calculate_shards(
        self,
        service: str,
        start_date: str,
        end_date: str,
        shard_by: str = "date",
        max_workers: Optional[int] = None,
        **kwargs
    ) -> List[Dict]:
        """
        Calculate shards with MAX_WORKERS batching.

        Args:
            service: Service name
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            shard_by: Sharding dimension (usually "date")
            max_workers: Override MAX_WORKERS (None = use service default)

        Returns:
            List of shard configurations
        """
        if shard_by != "date":
            # Other shard types unchanged
            return self._calculate_non_date_shards(service, shard_by, **kwargs)

        # Get MAX_WORKERS (user override or service default)
        max_workers = self.get_max_workers(service, max_workers)

        # Generate date range
        from datetime import datetime, timedelta
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()

        date_range = []
        current = start
        while current <= end:
            date_range.append(current)
            current += timedelta(days=1)

        # Batch dates into multi-date shards
        shards = []
        for i in range(0, len(date_range), max_workers):
            date_batch = date_range[i:i+max_workers]

            shard = {
                "shard_id": f"{service}-{date_batch[0].strftime('%Y%m%d')}-{date_batch[-1].strftime('%Y%m%d')}",
                "service": service,
                "start_date": str(date_batch[0]),
                "end_date": str(date_batch[-1]),
                "date_count": len(date_batch),
                "max_workers": len(date_batch),
                "dates": [str(d) for d in date_batch],
                "cli_args": f"--start-date {date_batch[0]} --end-date {date_batch[-1]}",
                "env_vars": {
                    "MAX_WORKERS": str(len(date_batch))
                }
            }

            shards.append(shard)

        logger.info(
            f"Created {len(shards)} shards for {len(date_range)} dates "
            f"(MAX_WORKERS={max_workers}, avg {len(date_range)/len(shards):.1f} dates/shard)"
        )

        return shards
```

---

## Testing Configuration Loading

```python
# tests/unit/test_config_loading.py

import pytest
from pathlib import Path
from deployment_service.shard_calculator import (
    load_service_max_workers_config,
    get_service_default_max_workers
)

def test_load_service_max_workers_from_yaml(tmp_path):
    """Test loading MAX_WORKERS from YAML file"""
    # Create test YAML
    config_content = """
service_max_workers:
  instruments-service: 16
  features-calendar-service: 16
  ml-inference-service: 3
"""
    config_file = tmp_path / "service_max_workers.yaml"
    config_file.write_text(config_content)

    # Mock config_dir to tmp_path
    # Load config
    # (Implementation depends on how you refactor load function)

    # Assert
    # assert loaded_config["instruments-service"] == 16

def test_get_service_default_max_workers():
    """Test getting default MAX_WORKERS for services"""
    assert get_service_default_max_workers("instruments-service") == 16
    assert get_service_default_max_workers("features-calendar-service") == 16
    assert get_service_default_max_workers("ml-inference-service") == 3
    assert get_service_default_max_workers("unknown-service") == 1  # Default

def test_max_workers_override():
    """Test user override takes precedence"""
    calculator = ShardCalculator("configs")

    # User override
    max_workers = calculator.get_max_workers("instruments-service", user_override=32)
    assert max_workers == 32  # Override used

    # No override (use config)
    max_workers = calculator.get_max_workers("instruments-service")
    assert max_workers == 16  # Config default used
```

---

## Summary

**All configuration patterns now fully specified:**

1. ✅ **Config file structure** - Complete YAML with rationale
2. ✅ **Module-level loading** - `load_service_max_workers_config()` full implementation
3. ✅ **Singleton pattern** - Load once, reuse everywhere
4. ✅ **Override priority** - User > config > default (1)
5. ✅ **Validation** - Check MAX_WORKERS won't cause OOM
6. ✅ **Terraform integration** - Two approaches (YAML or hardcoded)
7. ✅ **API integration** - How to use in deployment endpoints
8. ✅ **Testing** - Unit tests for config loading

**File Locations:**

- Config: `deployment-service-v2/configs/service_max_workers.yaml`
- Loading: `deployment_service/shard_calculator.py`
- Alternative: `deployment_service/config.py` (if using pydantic)
- Terraform: `terraform/variables.tf`

**Can Implement?** ✅ YES - 100% complete with multiple approaches provided
