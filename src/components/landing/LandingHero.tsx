"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Anchor, ChevronRight, Play } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { QMLogo } from "@/components/brand/QMLogo";
import { useAnimatablePointer } from "@/lib/anime/useAnime";

// Procedural "constellation galleon" with GLB fallback — deferred, no SSR.
const ShipModel = dynamic(
  () => import("./ShipModel").then((m) => ({ default: m.ShipModel })),
  { ssr: false, loading: () => <ShipFallback /> }
);

function ShipFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Anchor
        className="h-20 w-20 animate-breath text-[var(--color-gold)]"
        aria-hidden="true"
      />
    </div>
  );
}

/** Sources federated by Coral — rendered with real brand logos (mono on dark). */
const SOURCE_LOGOS = ["deel", "okta", "github", "slack", "stripe", "linear"];

const NAV_LINKS = [
  { label: "Docs", href: "/docs" },
  { label: "Audits", href: "/audits" },
  { label: "Copilot", href: "/copilot" },
  { label: "Schema", href: "/schema" },
];

export function LandingHero() {
  const revealRef = useRef<HTMLDivElement>(null);
  const shipRef = useAnimatablePointer<HTMLDivElement>(18);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const { animate, stagger } = await import("animejs");
      if (cancelled || !revealRef.current) return;
      animate(revealRef.current.querySelectorAll("[data-reveal]"), {
        opacity: [0, 1],
        translateY: [24, 0],
        ease: "outExpo",
        duration: 850,
        delay: stagger(90),
      });
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      className="relative flex min-h-screen flex-col overflow-hidden text-[var(--color-text)]"
      aria-labelledby="hero-heading"
    >
      {/* Deep navy sky */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(120% 90% at 65% 35%, #0b1c33 0%, #071124 45%, #03060f 100%)",
        }}
        aria-hidden="true"
      />
      {/* Teal aura behind the ship */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(40% 45% at 72% 50%, rgba(91,210,199,0.12) 0%, transparent 70%), radial-gradient(30% 30% at 78% 38%, rgba(228,182,107,0.08) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* ── Nav ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 md:px-12">
        <Link
          href="/"
          aria-label="Quartermaster home"
          className="flex items-center gap-2.5"
        >
          <span className="text-[var(--color-gold)]">
            <QMLogo size={22} />
          </span>
          <span className="font-bold tracking-tight text-[var(--color-text)]">
            QUARTERMASTER
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="https://github.com/Sushant6095/Quatermaster-coral"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              aria-label="GitHub repository"
            >
              <BrandLogo name="github" size={18} />
            </a>
          </div>
          <Link
            href="/cockpit"
            className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-gold)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-gold-hover)]"
          >
            Enter Cockpit
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </nav>

      {/* ── Main split ── */}
      <div className="relative z-10 flex flex-1 flex-col items-center md:flex-row">
        {/* Left: copy */}
        <div
          ref={revealRef}
          className="flex max-w-2xl flex-1 flex-col justify-center px-6 pb-12 pt-6 md:px-12 md:pb-0 md:pt-0"
        >
          <span
            data-reveal
            className="mb-6 inline-flex w-fit items-center gap-2 rounded-[var(--radius-pill)] border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] backdrop-blur-sm"
            style={{ opacity: 0 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-sea)] animate-breath" aria-hidden="true" />
            Pirates of the Coral-bean · Track 1
          </span>

          <h1
            id="hero-heading"
            className="mb-5 text-[clamp(2.8rem,6.5vw,5.5rem)] font-bold leading-[0.98] tracking-[-0.02em] text-[var(--color-text)]"
          >
            <span data-reveal className="block" style={{ opacity: 0 }}>
              Your{" "}
              <span className="text-[var(--color-sea)]">federated</span>
            </span>
            <span data-reveal className="block" style={{ opacity: 0 }}>
              SaaS auditor.
            </span>
          </h1>

          <p
            data-reveal
            className="mb-8 max-w-md text-[clamp(1rem,1.5vw,1.2rem)] leading-relaxed text-[var(--color-text-muted)]"
            style={{ opacity: 0 }}
          >
            One SQL query across HRIS, Okta, GitHub, Slack &amp; Stripe — find
            zombie accounts, ghost seats, and shadow IT.{" "}
            <span className="font-medium text-[var(--color-text)]">
              No warehouse. PII never leaves.
            </span>
          </p>

          <div data-reveal className="flex flex-wrap gap-3" style={{ opacity: 0 }}>
            <Link
              href="/cockpit"
              className="group flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-gold)] px-6 py-3 text-sm font-semibold text-[var(--color-bg)] transition-all hover:bg-[var(--color-gold-hover)] hover:shadow-[0_0_28px_rgba(228,182,107,0.35)]"
            >
              Enter the Cockpit
              <ChevronRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <a
              href="#audits"
              className="flex items-center gap-2 rounded-[var(--radius-md)] border border-white/15 px-6 py-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-sea)]/50 hover:text-[var(--color-text)]"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Watch the demo
            </a>
          </div>

          {/* Source logo strip */}
          <div data-reveal className="mt-10 flex flex-col gap-3" style={{ opacity: 0 }}>
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-dim)]">
              Federates in one query
            </span>
            <div className="flex flex-wrap items-center gap-4 text-[var(--color-text-muted)]">
              {SOURCE_LOGOS.map((src) => (
                <BrandLogo
                  key={src}
                  name={src}
                  size={24}
                  title={src}
                  className="opacity-70 transition-opacity hover:opacity-100"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: 3D constellation galleon */}
        <div
          ref={shipRef}
          className="relative flex min-h-[420px] w-full flex-1 items-center justify-center md:min-h-screen md:w-auto"
        >
          <div className="absolute inset-0 z-0" aria-hidden="true">
            <ShipModel />
          </div>
        </div>
      </div>

      {/* Fade into the sections below */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32"
        style={{
          background: "linear-gradient(180deg, transparent 0%, var(--color-bg) 100%)",
        }}
        aria-hidden="true"
      />
    </section>
  );
}
