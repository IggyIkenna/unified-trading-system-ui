"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

/**
 * useTabParam — persist tab selection in the URL search params.
 *
 * Replaces `useState("defaultTab")` + `<Tabs defaultValue=...>` with
 * URL-backed state so tabs survive navigation and support deep-linking.
 *
 * Usage:
 *   const [tab, setTab] = useTabParam("overview");
 *   <Tabs value={tab} onValueChange={setTab}>
 *
 * URL: /services/trading/overview?tab=orders
 *
 * @param defaultValue  — tab shown when no ?tab= param is present
 * @param paramName     — search param key (default: "tab")
 */
export function useTabParam(
  defaultValue: string,
  paramName = "tab",
): [string, (value: string) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const current = searchParams.get(paramName) ?? defaultValue;

  const setTab = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === defaultValue) {
        params.delete(paramName);
      } else {
        params.set(paramName, value);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname, defaultValue, paramName],
  );

  return [current, setTab];
}
