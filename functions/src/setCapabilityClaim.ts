/**
 * setCapabilityClaim — admin-only HTTPS callable that writes Odum
 * CapabilityClaims onto a Firebase Auth user's custom claims.
 *
 * Stage 3E G2 § 4.
 *
 * DEPLOYMENT
 *   firebase deploy --only functions:setCapabilityClaim --project odum-staging   # staging
 *   firebase deploy --only functions:setCapabilityClaim --project prod           # prod
 *
 * USAGE (from an authenticated admin client, e.g. admin console):
 *
 *   const fn = httpsCallable(functions, "setCapabilityClaim");
 *   await fn({
 *     target_uid: "user-abc",
 *     claims: {
 *       role: "client",
 *       audience: "trading_platform_subscriber",
 *       org_id: "alpha-capital",
 *       pricing_read_internal: false,
 *       strategy_catalogue_admin: false,
 *       im_desk: false,
 *       admin: false,
 *     },
 *   });
 *
 * AUTHORISATION
 *   The function rejects every caller whose ID-token claims don't
 *   include `admin: true`. This mirrors the security rule in
 *   firestore.rules — only admin can uplift anyone's claims, and
 *   nobody can uplift themselves past admin without going through
 *   another admin. No self-service uplift.
 *
 * AUDIT
 *   Every invocation logs rule_id="audit" / violation_code="capability_grant"
 *   to the shared compliance log so claim-grants are reviewable in BigQuery.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

type ClientAudience =
  | "admin"
  | "im_desk"
  | "im_client"
  | "trading_platform_subscriber"
  | "reg_umbrella_client";

interface CapabilityClaims {
  role: string;
  audience: ClientAudience;
  org_id: string | null;
  pricing_read_internal: boolean;
  strategy_catalogue_admin: boolean;
  im_desk: boolean;
  admin: boolean;
}

interface SetCapabilityClaimRequest {
  target_uid: string;
  claims: CapabilityClaims;
}

export const setCapabilityClaim = onCall<SetCapabilityClaimRequest>(async (request) => {
  // 1. Caller must be authenticated.
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "sign-in required");
  }

  // 2. Caller must be admin. Defence-in-depth on top of Firestore rules.
  const callerClaims = request.auth.token as Record<string, unknown>;
  if (callerClaims.admin !== true) {
    throw new HttpsError("permission-denied", "admin claim required");
  }

  // 3. Input validation.
  const { target_uid, claims } = request.data;
  if (!target_uid || typeof target_uid !== "string") {
    throw new HttpsError("invalid-argument", "target_uid required");
  }
  if (!claims || typeof claims !== "object") {
    throw new HttpsError("invalid-argument", "claims required");
  }

  const AUDS: ClientAudience[] = [
    "admin",
    "im_desk",
    "im_client",
    "trading_platform_subscriber",
    "reg_umbrella_client",
  ];
  if (!AUDS.includes(claims.audience)) {
    throw new HttpsError("invalid-argument", `audience must be one of ${AUDS.join("|")}`);
  }

  // 4. Write custom claims onto the target user. Propagation takes up
  //    to one token refresh (~1 hour); admin UI should tell the target
  //    to re-login if claims are elevated.
  await admin.auth().setCustomUserClaims(target_uid, {
    role: claims.role,
    audience: claims.audience,
    org_id: claims.org_id,
    pricing_read_internal: Boolean(claims.pricing_read_internal),
    strategy_catalogue_admin: Boolean(claims.strategy_catalogue_admin),
    im_desk: Boolean(claims.im_desk),
    admin: Boolean(claims.admin),
  });

  // 5. Audit log.
  await admin.firestore().collection("_audit_capability_grants").add({
    granted_by: request.auth.uid,
    granted_to: target_uid,
    claims,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, target_uid };
});
