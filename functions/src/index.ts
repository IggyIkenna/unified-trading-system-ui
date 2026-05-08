/**
 * Cloud Functions entrypoint for unified-trading-system-ui.
 *
 * Functions are deployed to the Firebase project pointed to by the
 * active alias in `.firebaserc`:
 *   - `staging` → odum-staging
 *   - `prod`    → central-element-323112
 *
 *   firebase deploy --only functions --project staging
 *   firebase deploy --only functions --project prod
 *
 * SSOT: codex/16-strategy-playbooks/infra-spec/stage-3e-g2-env-split.md § 4.
 */

export { setCapabilityClaim } from "./setCapabilityClaim";
