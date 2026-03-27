# Widget documentation (index)

All widget-related markdown lives under **`components/widgets/`** (this folder and per-tab subfolders).

## Where things live

| What                                               | Location                                                                                                    |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **This index**                                     | `components/widgets/README.md`                                                                              |
| **Pairing guide**                                  | `components/widgets/pairing-guide.md`                                                                       |
| **New widget doc template**                        | `components/widgets/TEMPLATE.md` — copy into `components/widgets/<tab>/<widget-id>.md` when adding a widget |
| **Per-tab implementation spec** (rollout / agents) | `components/widgets/<tab>/<tab>-widgets.md` (e.g. `accounts/accounts-widgets.md`)                           |
| **Per-widget user docs**                           | `components/widgets/<tab>/README.md` and `components/widgets/<tab>/<widget-id>.md`                          |
| **Mock data change log**                           | `docs/widgets/mock-data-changes.md` (cross-cutting changelog)                                               |

Keeping specs and user docs next to `register.ts` makes them easier to update with code changes.
