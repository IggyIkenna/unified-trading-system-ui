/**
 * GET /api/v1/firebase-auth/users — alias of /firebase-users (legacy admin
 * pages call both shapes).
 */
export { GET } from "@/app/api/v1/firebase-users/route";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
