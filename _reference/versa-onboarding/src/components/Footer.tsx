import Link from "next/link";

const footerLinks = [
  { href: "/#overview", label: "Business" },
  { href: "/#team", label: "Team" },
  { href: "/#board", label: "Board" },
  { href: "/#approach", label: "Approach" },
  { href: "/#careers", label: "Careers" },
  { href: "/#contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="https://static.wixstatic.com/media/75b7b3_c007ca3165df412b9835bb9f493850fc~mv2.png/v1/fill/w_158,h_160,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/download%20(2).png"
                alt="Odum Research"
                className="h-10 w-10 rounded-full border border-neutral-200 object-cover"
              />
              <span className="text-lg font-semibold tracking-tight text-black">
                Odum Research
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-neutral-600">
              Research-led trading systems. Software providers that drive
              trading strategies at low latency.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Quick links
            </h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-neutral-600 hover:text-black transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Contact
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              <li>Odum Research Ltd</li>
              <li>England, UK</li>
              <li>
                <a
                  href="mailto:info@odum-research.com"
                  className="hover:text-black transition-colors"
                >
                  info@odum-research.com
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/odum-research"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-black transition-colors"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-neutral-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} Odum Research Ltd. All rights
            reserved.
          </p>
          <a
            href="https://www.odum-research.com/disclaimer"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-neutral-500 hover:text-black transition-colors"
          >
            Disclaimer
          </a>
        </div>
      </div>
    </footer>
  );
}
