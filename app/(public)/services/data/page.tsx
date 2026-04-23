import { redirect } from "next/navigation";

/**
 * /services/data is a legacy route — "Data Provision" was retired as a
 * separate commercial path on 2026-04-22. Data capabilities are part of
 * DART now. Keeping this route alive as a 307 redirect so inbound links
 * and bookmarks still land somewhere useful.
 */
export default function LegacyServicesDataRedirect(): never {
  redirect("/platform");
}
