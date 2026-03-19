# batch-audit-ui scripts

## dev-restart.sh

Restarts the dev server cleanly: kills port 5181, clears Vite cache, starts with `VITE_MOCK_API=true`.

```bash
npm run dev:restart
# or
bash scripts/dev-restart.sh
```

**When to use:** After changing `vite.config.ts`, env vars, or when HMR seems broken.

## Hot reload (no restart)

With the current Vite setup, these edits hot reload automatically:

| Edit in                         | Hot reloads?                   |
| ------------------------------- | ------------------------------ |
| `batch-audit-ui/src/**`         | Yes                            |
| `unified-trading-ui-kit/src/**` | Yes (aliased to source in dev) |
| `vite.config.ts`                | No — restart required          |
| `.env` / `VITE_*` vars          | No — restart required          |
