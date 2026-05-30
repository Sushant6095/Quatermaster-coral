"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { QMLogo } from "@/components/brand/QMLogo";

const REPO_URL = "https://github.com/Sushant6095/Quatermaster-coral";

const NAV_COLUMNS: Array<{ heading: string; links: Array<{ label: string; href: string; external?: boolean }> }> = [
  {
    heading: "Product",
    links: [
      { label: "Cockpit", href: "/cockpit" },
      { label: "Audits", href: "/audits" },
      { label: "Copilot", href: "/copilot" },
      { label: "Schema Graph", href: "/schema" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: REPO_URL, external: true },
      { label: "Ledger", href: "/ledger" },
      { label: "Playground", href: "/playground" },
      { label: "Sources", href: "/sources" },
    ],
  },
];

const SOCIALS = [
  { name: "github", label: "GitHub", href: REPO_URL },
  { name: "discord", label: "Discord", href: "#" },
  { name: "x", label: "Twitter", href: "#" },
];

export function LandingFooter() {
  return (
    <footer className="lp-light relative overflow-hidden bg-[var(--lp-surface-2)]">
      {/* Transition from the dark sections above */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-32"
        style={{
          background:
            "linear-gradient(180deg, var(--color-bg) 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-28 md:px-12">
        {/* Top row: CTA + nav + socials */}
        <div className="flex flex-col gap-12 pb-16 md:flex-row md:justify-between">
          <div>
            <Link
              href="/cockpit"
              className="group inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-[var(--lp-ink)]"
            >
              Start building
              <ChevronRight
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <p className="mt-3 max-w-xs text-sm text-[var(--lp-ink-soft)]">
              Run the full audit locally in one command. PII never leaves your
              machine.
            </p>
          </div>

          <div className="flex flex-wrap gap-12">
            {NAV_COLUMNS.map((col) => (
              <nav key={col.heading} className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--lp-ink-dim)]">
                  {col.heading}
                </span>
                {col.links.map((l) =>
                  l.external ? (
                    <a
                      key={l.label}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--lp-ink-soft)] transition-colors hover:text-[var(--lp-ink)]"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      key={l.label}
                      href={l.href}
                      className="text-sm text-[var(--lp-ink-soft)] transition-colors hover:text-[var(--lp-ink)]"
                    >
                      {l.label}
                    </Link>
                  )
                )}
              </nav>
            ))}

            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--lp-ink-dim)]">
                Community
              </span>
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-2 text-sm text-[var(--lp-ink-soft)] transition-colors hover:text-[var(--lp-ink)]"
                >
                  <BrandLogo name={s.name} size={16} colored />
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Giant wordmark banner */}
        <div className="select-none pb-8" aria-hidden="true">
          <div className="flex items-center gap-[0.06em] text-[clamp(3.5rem,19vw,17rem)] font-black leading-[0.82] tracking-[-0.04em] text-[var(--lp-ink)]">
            <QMLogo className="h-[0.55em] w-[0.55em] shrink-0 text-[var(--lp-gold)]" />
            <span className="leading-[0.82]">
              QUARTER
              <br />
              MASTER
            </span>
          </div>
        </div>

        {/* Fine print */}
        <div className="flex flex-col items-start justify-between gap-2 pb-6 text-xs text-[var(--lp-ink-dim)] sm:flex-row sm:items-center">
          <span>Quartermaster · Local-first SaaS audit agent</span>
          <span>Pirates of the Coral-bean · Track 1 · Coral + Claude</span>
        </div>
      </div>

      {/* Checkered tape strip */}
      <div
        className="relative z-10 h-6 w-full"
        style={{
          backgroundImage:
            "repeating-conic-gradient(var(--lp-ink) 0% 25%, transparent 0% 50%)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />
    </footer>
  );
}
