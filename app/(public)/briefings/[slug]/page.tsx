import { BriefingHero } from "@/components/briefings/briefing-hero";
import { Badge } from "@/components/ui/badge";
import { BRIEFING_PILLARS } from "@/lib/briefings/content";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BRIEFING_PILLARS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const pillar = BRIEFING_PILLARS.find((p) => p.slug === slug);
  if (!pillar) return { title: "Briefing | Odum Research" };
  return { title: `${pillar.title} — Briefings | Odum Research` };
}

export default async function BriefingPillarPage({ params }: PageProps) {
  const { slug } = await params;
  const pillar = BRIEFING_PILLARS.find((p) => p.slug === slug);
  if (!pillar) notFound();

  return (
    <div className="container max-w-3xl px-4 py-12 md:px-6 space-y-10">
      <div className="space-y-2 text-xs">
        <Link
          href="/briefings"
          className="text-muted-foreground hover:text-foreground"
        >
          ← All briefings
        </Link>
        <div>
          <Badge variant="outline" className="text-xs">
            Lighter gate
          </Badge>
        </div>
      </div>

      <BriefingHero title={pillar.title} tldr={pillar.tldr} cta={pillar.cta} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Situation
        </h2>
        <p className="text-body text-foreground/85 max-w-2xl leading-relaxed">
          {pillar.summary}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Position
        </h2>
        <ul className="list-disc pl-5 text-sm text-foreground/85 space-y-2 max-w-2xl">
          {pillar.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Call
        </h2>
        <p className="text-sm text-foreground/85 max-w-2xl leading-relaxed">
          The 45-minute call picks up from here — strategies, structure, and the
          specific shape of your engagement. Book directly from the hero above or
          open the{" "}
          <Link className="text-primary hover:underline" href="/briefings">
            other briefings
          </Link>
          {" "}if two paths apply.
        </p>
        <p className="text-xs text-muted-foreground">
          For the public marketing surface see{" "}
          <Link className="text-primary hover:underline" href="/">
            odumresearch.com
          </Link>
          . For signed-in strategy catalogue and terminal access, use{" "}
          <Link className="text-primary hover:underline" href="/login">
            Sign in
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
