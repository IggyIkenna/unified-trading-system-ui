"use client";

import { PLATFORM_MARKETING_NAV_LABEL } from "@/components/shell/nav-copy";
import { SpacesNavSections } from "@/components/shell/spaces-nav-sections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { ChevronDown, Compass } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

const NAV_HOME = { href: "/", label: "Home" } as const;

// 5-path nav per marketing_site_restructure_2026_04_20 plan M1:
// Investment Management / DART / Signals / Regulatory / Firm + Contact secondary.
const NAV_FIVE_PATHS = [
  { href: "/investment-management", label: "Investment Management" },
  { href: "/platform", label: PLATFORM_MARKETING_NAV_LABEL },
  { href: "/signals", label: "Odum Signals" },
  { href: "/regulatory", label: "Regulatory" },
  { href: "/who-we-are", label: "Who We Are" },
] as const;

const NAV_SECONDARY = [{ href: "/contact", label: "Contact" }] as const;

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

function NavSeparator() {
  return (
    <span className="shrink-0 select-none px-0.5 text-xs font-light text-muted-foreground/40" aria-hidden="true">
      |
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [hash, setHash] = React.useState("");
  const [mobileOpen, setMobileOpen] = React.useState(false);

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

  const navLinkClass = (href: string) =>
    cn(
      "shrink-0 whitespace-nowrap text-sm transition-colors hover:text-foreground",
      isNavItemActive(pathname, hash, href) ? "font-medium text-foreground" : "text-muted-foreground",
    );

  return (
    <header
      data-shell="site-header"
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container flex min-h-14 items-center justify-between gap-3 px-4 py-2 md:px-6">
        {/* Mobile: logo opens nav sheet. Desktop: logo navigates home. */}
        <button
          className="flex shrink-0 items-center gap-3 md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <img src="/images/odum-logo.png" alt="Odum Research" className="size-9" />
          <div className="flex flex-col items-start gap-0.5 leading-tight">
            <span className="text-lg font-semibold">Odum Research</span>
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal leading-none">
              FCA 975797
            </Badge>
          </div>
        </button>
        <Link href="/" className="hidden shrink-0 items-center gap-3 md:flex">
          <img src="/images/odum-logo.png" alt="Odum Research" className="size-9" />
          <div className="flex flex-col items-start gap-0.5 leading-tight">
            <span className="text-lg font-semibold">Odum Research</span>
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal leading-none">
              FCA 975797
            </Badge>
          </div>
        </Link>

        {/* Mobile nav sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-border/40 px-4 py-3">
              <SheetTitle className="flex items-center gap-3">
                <img src="/images/odum-logo.png" alt="Odum Research" className="size-8" />
                <span className="text-base font-semibold">Odum Research</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-3 py-4">
              {[NAV_HOME, ...NAV_FIVE_PATHS, ...NAV_SECONDARY].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    isNavItemActive(pathname, hash, item.href)
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-border/40 px-4 py-4">
              {!loading && user ? (
                <Button asChild className="w-full">
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    Sign In
                  </Link>
                  <Button asChild className="w-full">
                    <Link href="/contact" onClick={() => setMobileOpen(false)}>
                      Book a call
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-2 px-2 md:flex lg:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Compass className="size-3.5" aria-hidden />
              Spaces
              <ChevronDown className="size-3.5 opacity-70" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <SpacesNavSections />
            </DropdownMenuContent>
          </DropdownMenu>
          <NavSeparator />
          <Link
            href={NAV_HOME.href}
            onClick={handleNavLinkClick(NAV_HOME.href)}
            className={navLinkClass(NAV_HOME.href)}
          >
            {NAV_HOME.label}
          </Link>
          <NavSeparator />
          {NAV_FIVE_PATHS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavLinkClick(item.href)}
              className={navLinkClass(item.href)}
            >
              {item.label}
            </Link>
          ))}
          <NavSeparator />
          {NAV_SECONDARY.map((item, index) => (
            <React.Fragment key={item.href}>
              {index > 0 ? <NavSeparator /> : null}
              <Link href={item.href} onClick={handleNavLinkClick(item.href)} className={navLinkClass(item.href)}>
                {item.label}
              </Link>
            </React.Fragment>
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
                <Link href="/contact">Book a call</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
