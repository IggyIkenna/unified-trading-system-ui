"use client";

import * as React from "react";

import type { MarketingShadowHeadLink } from "@/lib/marketing/load-marketing-static";

type MarketingStaticShadowProps = {
  css: string;
  html: string;
  headLinks?: readonly MarketingShadowHeadLink[];
  /** Inline scripts stripped from HTML (they do not run via `innerHTML`); executed with a shadow `document` shim. */
  scripts?: readonly string[];
};

/**
 * Mounts marketing HTML + its stylesheet inside an **open** shadow tree so `header`, `a`,
 * and `body` rules from legacy static pages do not leak onto `SiteHeader` / the app shell.
 *
 * Uses a **stable ref callback** to attach the shadow as soon as the host DOM node exists.
 * Under Next 16 + Turbopack dev, relying only on `useLayoutEffect`/`useEffect` on `ref={hostRef}`
 * left `data-marketing-shadow` unset in Playwright / MCP (empty host, no shadow). A ref
 * callback runs during commit without depending on that effect ordering. `useEffect` re-syncs
 * when `css` / `html` / `headLinks` change while the host is mounted.
 */
function runMarketingShadowInlineScripts(root: ShadowRoot, scripts: readonly string[]): void {
  const inner = root.querySelector("[data-testid='marketing-inner']");
  if (!inner) return;
  const digest = `${inner.innerHTML.length}::${scripts.map((s) => s.length).join(",")}`;
  if (inner.getAttribute("data-marketing-scripts-digest") === digest) return;
  inner.setAttribute("data-marketing-scripts-digest", digest);

  for (const code of scripts) {
    if (!code) continue;
    try {
      const runner = new Function(
        "root",
        `var __mrDocument = window.document;
        var document = {
          getElementById: function (id) { return root.getElementById(id); },
          querySelector: function (sel) { return root.querySelector(sel); },
          querySelectorAll: function (sel) { return root.querySelectorAll(sel); },
          addEventListener: function () { return __mrDocument.addEventListener.apply(__mrDocument, arguments); },
          removeEventListener: function () { return __mrDocument.removeEventListener.apply(__mrDocument, arguments); },
          get readyState() { return __mrDocument.readyState; },
        };
        ${code}`,
      ) as (r: ShadowRoot) => void;
      runner(root);
    } catch (err) {
      console.error("[MarketingStaticShadow] marketing inline script failed", err);
    }
  }
}

function syncShadowHeadLinks(shadow: ShadowRoot, headLinks: readonly MarketingShadowHeadLink[] | undefined) {
  for (const existing of shadow.querySelectorAll("link[data-marketing-static]")) {
    existing.remove();
  }
  const styleAnchor = shadow.querySelector("style");
  for (const spec of headLinks ?? []) {
    const link = document.createElement("link");
    link.setAttribute("data-marketing-static", "1");
    link.rel = spec.rel;
    link.href = spec.href;
    if (spec.crossOrigin) link.crossOrigin = spec.crossOrigin;
    if (spec.media) link.media = spec.media;
    if (styleAnchor) shadow.insertBefore(link, styleAnchor);
    else shadow.appendChild(link);
  }
}

export function MarketingStaticShadow({ css, html, headLinks, scripts = [] }: MarketingStaticShadowProps) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const propsRef = React.useRef({ css, html, headLinks, scripts });
  propsRef.current = { css, html, headLinks, scripts };

  const applyHost = React.useCallback((host: HTMLDivElement | null) => {
    hostRef.current = host;
    if (!host) return;

    const { css: nextCss, html: nextHtml, headLinks: nextHeadLinks, scripts: nextScripts } = propsRef.current;

    try {
      if (!host.shadowRoot) {
        const shadow = host.attachShadow({ mode: "open" });
        const styleEl = document.createElement("style");
        styleEl.textContent = nextCss;
        const inner = document.createElement("div");
        inner.className = "marketing-inner";
        inner.setAttribute("data-testid", "marketing-inner");
        inner.innerHTML = nextHtml;
        shadow.appendChild(styleEl);
        shadow.appendChild(inner);
        syncShadowHeadLinks(shadow, nextHeadLinks);
        runMarketingShadowInlineScripts(shadow, nextScripts);
      } else {
        const shadow = host.shadowRoot;
        syncShadowHeadLinks(shadow, nextHeadLinks);
        const styleEl = shadow.querySelector("style");
        if (styleEl) styleEl.textContent = nextCss;
        const inner = shadow.querySelector("[data-testid='marketing-inner']");
        if (inner) {
          inner.removeAttribute("data-marketing-scripts-digest");
          inner.innerHTML = nextHtml;
        }
        if (shadow) runMarketingShadowInlineScripts(shadow, nextScripts);
      }

      host.setAttribute("data-marketing-shadow", "ready");
    } catch {
      host.setAttribute("data-marketing-shadow", "error");
    }
  }, []);

  React.useEffect(() => {
    applyHost(hostRef.current);
  }, [css, html, headLinks, applyHost]);

  return (
    <div
      ref={applyHost}
      className="w-full min-h-[70vh]"
      data-testid="marketing-static-host"
      suppressHydrationWarning
    />
  );
}

export default MarketingStaticShadow;
