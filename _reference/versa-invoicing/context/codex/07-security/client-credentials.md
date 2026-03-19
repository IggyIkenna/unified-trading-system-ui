# Per-Client Exchange Credentials

Exchange API credentials are stored per client and per venue in GCP Secret Manager (or AWS Secrets Manager when
`CLOUD_PROVIDER=aws`).

## Secret Naming Pattern

```
{client}-{venue}-{credential-type}
```

| Credential Type | Purpose             | Required By                               |
| --------------- | ------------------- | ----------------------------------------- |
| `-api-key`      | Exchange API key    | All venues                                |
| `-api-secret`   | Exchange API secret | Most venues (Binance, Deribit, OKX, etc.) |
| `-passphrase`   | Exchange passphrase | Some venues (e.g. Coinbase, Kraken)       |

## Examples

| Secret Name                       | Used For                           |
| --------------------------------- | ---------------------------------- |
| `client-alpha-binance-api-key`    | Binance API key for client-alpha   |
| `client-alpha-binance-api-secret` | Binance API secret                 |
| `client-alpha-deribit-api-key`    | Deribit API key                    |
| `client-alpha-deribit-api-secret` | Deribit API secret                 |
| `client-alpha-kraken-api-key`     | Kraken API key                     |
| `client-alpha-kraken-api-secret`  | Kraken API secret                  |
| `client-alpha-kraken-passphrase`  | Kraken passphrase (if 2FA enabled) |

## Access Pattern

Credentials are accessed at runtime via `get_secret_client()` from `unified_cloud_interface`:

```python
from unified_cloud_interface import get_secret_client

secret_client = get_secret_client()
api_key = secret_client.access_secret("client-alpha-binance-api-key")
api_secret = secret_client.access_secret("client-alpha-binance-api-secret")
```

## Used By

- **execution-service** — fetches credentials when placing orders on behalf of a client at a venue.

## Rules

- Venue name must match canonical venue ID (lowercase: `binance`, `deribit`, `okx`).
- Client identifier must match the client's canonical ID in the system.
- Never commit credentials; all values live in Secret Manager.
- See [secrets-management.md](./secrets-management.md) for the full secret access pattern.
