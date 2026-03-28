"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const NAV_ITEMS = [
  { href: "/", label: "Platform" },
  { href: "/#services", label: "Services" },
  { href: "/docs", label: "Developer Docs" },
  { href: "/investor-relations", label: "Investor Relations" },
  { href: "/contact", label: "Contact" },
] as const;

/** Path and fragment for a nav href (e.g. `/#services` → `/` + `#services`). */
function parseNavHref(href: string): { path: string; hash: string } {
  const hashIdx = href.indexOf("#");
  if (hashIdx === -1) {
    return { path: href, hash: "" };
  }
  const path = href.slice(0, hashIdx);
  const fragment = href.slice(hashIdx);
  return { path: path === "" ? "/" : path, hash: fragment };
}

function isNavItemActive(pathname: string, hash: string, itemHref: string): boolean {
  const [pathPart, hashPart] = itemHref.split("#");
  const normalizedHash = hashPart ? `#${hashPart}` : "";

  if (normalizedHash) {
    return pathname === pathPart && hash === normalizedHash;
  }

  if (pathname === "/" && pathPart === "/") {
    return hash === "" || hash === "#";
  }

  return pathname === itemHref || pathname === pathPart;
}

export function SiteHeader() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [hash, setHash] = React.useState("");

  const syncHashFromWindow = React.useCallback(() => {
    setHash(window.location.hash);
  }, []);

  React.useEffect(() => {
    syncHashFromWindow();
    window.addEventListener("hashchange", syncHashFromWindow);
    return () => window.removeEventListener("hashchange", syncHashFromWindow);
  }, [pathname, syncHashFromWindow]);

  const handleNavLinkClick = React.useCallback(
    (itemHref: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const { path, hash: targetHash } = parseNavHref(itemHref);
      if (path === pathname) {
        setHash(targetHash);
        return;
      }

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          syncHashFromWindow();
        });
      });
    },
    [pathname, syncHashFromWindow],
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <img src="/images/odum-logo.png" alt="Odum Research" className="size-9" />
          <div>
            <span className="text-lg font-semibold">Odum Research</span>
            <Badge variant="outline" className="ml-2 text-xs">
              FCA 975797
            </Badge>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavLinkClick(item.href)}
              className={cn(
                "text-sm transition-colors hover:text-foreground",
                isNavItemActive(pathname, hash, item.href) ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {!loading && user ? (
            <>
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground hidden sm:block">
                Dashboard
              </Link>
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                    {user.displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <span className="hidden sm:inline">{user.displayName.split(" ")[0]}</span>
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground hidden sm:block">
                Sign In
              </Link>
              <Button size="sm" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
