import {
  PublicDepthNextStripGated,
  PublicMobileNextStepsBarGated,
} from "@/components/marketing/public-depth-next-strip-gate";
import { CookieConsentBanner } from "@/components/marketing/cookie-consent-banner";
import { FooterContactLink } from "@/components/shell/footer-contact-link";
import dynamic from "next/dynamic";
import Link from "next/link";

/** Split heavy client chrome into async chunks to avoid a single large `layout.js` and ChunkLoadError timeouts. */
const SiteHeader = dynamic(() => import("@/components/shell/site-header").then((m) => ({ default: m.SiteHeader })), {
  ssr: true,
  loading: () => <div className="sticky top-0 z-50 h-14 w-full border-b border-border bg-background/95" aria-hidden />,
});

const PublicMobileNextStepsBar = dynamic(
  () =>
    import("@/components/marketing/public-depth-next-strip").then((m) => ({
      default: m.PublicMobileNextStepsBar,
    })),
  { ssr: true, loading: () => null },
);

const ChatWidgetPublic = dynamic(
  () => import("@/components/chat/chat-widget-public").then((m) => ({ default: m.ChatWidgetPublic })),
  { ssr: true, loading: () => null },
);

/**
 * Public shell — unauthenticated pages (landing, login, signup, docs, etc.)
 * Header + CTA + footer. No auth required.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <PublicDepthNextStripGated />
      <main className="min-h-[calc(100vh-3.5rem)] pb-20 md:pb-0">{children}</main>
      <footer className="border-t border-border py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Odum Research Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/regulatory" className="hover:text-foreground transition-colors">
                FCA 975797
              </Link>
              <FooterContactLink className="hover:text-foreground transition-colors" />
            </div>
          </div>
        </div>
      </footer>
      <PublicMobileNextStepsBar />
      <ChatWidgetPublic />
      <CookieConsentBanner />
    </>
  );
}
