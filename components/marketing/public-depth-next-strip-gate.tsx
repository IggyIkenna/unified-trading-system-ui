"use client";

import { usePathname } from "next/navigation";
import { shouldHidePublicDepthChrome } from "@/lib/marketing/public-depth-visibility";
import { PublicDepthNextStrip } from "@/components/marketing/public-depth-next-strip";
import { PublicMobileNextStepsBar } from "@/components/marketing/public-depth-next-strip";

/**
 * One SSOT for the public depth strip: same on `/` and all marketing routes; hidden
 * on briefings and sign-in (see `shouldHidePublicDepthChrome`).
 */
export function PublicDepthNextStripGated() {
  const pathname = usePathname();
  if (shouldHidePublicDepthChrome(pathname)) return null;
  return <PublicDepthNextStrip />;
}

export function PublicMobileNextStepsBarGated() {
  const pathname = usePathname();
  if (shouldHidePublicDepthChrome(pathname)) return null;
  return <PublicMobileNextStepsBar />;
}
