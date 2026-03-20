import { redirect } from "next/navigation"

// Canonical engagement page is at /services/engagement
// This redirect ensures /engagement still works from ops nav
export default function EngagementRedirect() {
  redirect("/services/engagement")
}
