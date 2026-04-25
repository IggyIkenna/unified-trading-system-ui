"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { contactHrefFromPath } from "@/lib/marketing/contact-link";

/**
 * Pathname-aware "Contact" link for the public footer. Passes the originating
 * page's service context as a query param so the contact form prefills. Client
 * component because the layout is a server component.
 */
export function FooterContactLink({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <Link href={contactHrefFromPath(pathname)} className={className}>
      Contact
    </Link>
  );
}
