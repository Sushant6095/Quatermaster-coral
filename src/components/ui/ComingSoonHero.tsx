/**
 * Empty/stub state for screens that are scoped but not yet built.
 * Used by /schema, /playground, /settings, etc. so the nav doesn't 404
 * and judges see a planned-but-not-yet-built affordance.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ComingSoonHeroProps {
  title: string;
  description: string;
  bullets?: string[];
  ctaLabel?: string;
  ctaHref?: string;
}

export function ComingSoonHero({
  title,
  description,
  bullets,
  ctaLabel = "Back to Cockpit",
  ctaHref = "/cockpit",
}: ComingSoonHeroProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-gold)]">
        <span className="font-mono text-lg font-bold">Q</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{description}</p>
      {bullets && bullets.length > 0 && (
        <ul className="mt-6 grid w-full gap-2 text-left text-sm text-[var(--color-text-muted)]">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/60 px-3 py-2"
            >
              <span className="mt-0.5 text-[var(--color-gold)]">›</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      <Link
        href={ctaHref}
        className="mt-8 inline-flex items-center gap-1.5 rounded-md bg-[var(--color-gold)] px-4 py-2 text-xs font-medium text-black hover:bg-[var(--color-gold-hover)]"
      >
        {ctaLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
