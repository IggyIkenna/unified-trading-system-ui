# Transport Security

**SSOT:** This document is the canonical reference for transport security decisions in the unified trading system.
**Registered in:** `unified-trading-codex/00-SSOT-INDEX.md`

---

## No Service Mesh (Intentional Architecture Decision)

The unified trading system deliberately does **not** use a service mesh (Istio, Envoy, Linkerd).

### Rationale

- **Latency:** Per-hop sidecar proxies add 2–5 ms per request. At the execution layer (order submission, fill
  acknowledgement), this latency is unacceptable. Strategy alpha degrades measurably beyond 1 ms slippage budgets.
- **Complexity vs. benefit:** The system operates within a single GCP VPC. East-west traffic between Cloud Run services
  is already encrypted by Google's infrastructure (TLS at the networking layer). An additional mTLS sidecar layer would
  duplicate this without adding security value.
- **Operational overhead:** Service mesh CRDs, certificate rotation, and observability sidecars introduce failure modes
  that are harder to debug than direct HTTP/gRPC calls with structured logging.

### What we use instead

| Concern                 | Solution                                                     |
| ----------------------- | ------------------------------------------------------------ |
| Service-to-service auth | GCP IAM + OIDC tokens (Cloud Run identity)                   |
| Encryption in transit   | GCP VPC internal TLS (automatic) + HTTPS at ingress          |
| Mutual auth             | Cloud Run service-to-service auth with audience-bound tokens |
| Observability           | Structured JSON logs → Cloud Logging; Prometheus metrics     |
| Traffic policy          | IAM conditions + VPC Service Controls (not L7 routing rules) |

### Enforcement

- Services MUST NOT declare Istio/Envoy sidecar annotations in their deployment configs.
- All inter-service HTTP calls use `google.auth.transport.requests.AuthorizedSession` or equivalent token-injecting
  client.
- Ingress TLS terminated at Cloud Run load balancer; internal traffic travels over Google's encrypted backbone.

---

## TLS Standards

- Minimum TLS version: **TLS 1.2** (TLS 1.3 preferred)
- Cloud Run enforces TLS 1.2+ at the ingress layer automatically.
- No self-signed certificates in production — all certs issued via GCP Certificate Manager.

---

## Related

- `07-security/secrets-management.md` — secret retrieval patterns
- `07-security/audit-logging.md` — auth event logging
- `unified-trading-pm/configs/runtime-topology.yaml` — service interaction topology
