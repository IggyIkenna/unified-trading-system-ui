"use client";

import { RouteErrorPage } from "@/components/shell/route-error-page";

export default function ServicesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorPage error={error} reset={reset} />;
}
