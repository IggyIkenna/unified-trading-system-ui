# System Topology DAG

> **MOVED.** Canonical location: `unified-trading-pm/TOPOLOGY-DAG.md`
>
> The topology DAG is co-located with `workspace-manifest.json` (the machine-readable DAG SSOT) in `unified-trading-pm`.
> When tiers or services change, one PR in one repo updates both the manifest and this diagram. Codex owns architectural
> narrative and contracts, not living diagrams.
>
> **Direct link:** [unified-trading-pm/TOPOLOGY-DAG.md](../../unified-trading-pm/TOPOLOGY-DAG.md)

## What lives where

| Artifact                    | Location                                                      | Purpose                                         |
| --------------------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| Human-readable tier diagram | `unified-trading-pm/TOPOLOGY-DAG.md`                          | Full Mermaid flowchart — T0→services→UIs→infra  |
| Code DAG (machine-readable) | `unified-trading-pm/workspace-manifest.json`                  | Tier membership, version pins, merge order      |
| Runtime wiring              | `deployment-service/configs/runtime-topology.yaml`            | Topics, storage, co-location rules per service  |
| Tier architecture narrative | `unified-trading-codex/04-architecture/TIER-ARCHITECTURE.md`  | Why the tiers exist; import rules; enforcement  |
| Protocol injection contract | `unified-trading-codex/04-architecture/PROTOCOL-INJECTION.md` | How libraries resolve live vs batch, GCP vs AWS |
