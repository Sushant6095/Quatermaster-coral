"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Anchor, ChevronRight, Play } from "lucide-react";

// Three.js compass — dynamically imported to avoid SSR
const CompassThree = dynamic(
  () => import("./CompassThree").then((m) => ({ default: m.CompassThree })),
  { ssr: false, loading: () => <CompassRoseFallback /> }
);

function CompassRoseFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <CompassRose />
    </div>
  );
}

function CompassRose() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-64 h-64 opacity-30 animate-[spin_30s_linear_infinite]"
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle cx="100" cy="100" r="90" fill="none" stroke="var(--color-gold)" strokeWidth="1" strokeDasharray="4 8" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="var(--color-border-strong)" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="50" fill="none" stroke="var(--color-border)" strokeWidth="1" />
      {/* Cardinal points */}
      <polygon points="100,10 106,94 100,86 94,94" fill="var(--color-gold)" />
      <polygon points="100,190 106,106 100,114 94,106" fill="var(--color-text-dim)" />
      <polygon points="10,100 94,106 86,100 94,94" fill="var(--color-sea)" />
      <polygon points="190,100 106,106 114,100 106,94" fill="var(--color-text-dim)" />
      {/* Center */}
      <circle cx="100" cy="100" r="8" fill="var(--color-gold)" opacity="0.8" />
      <circle cx="100" cy="100" r="4" fill="var(--color-bg)" />
      {/* Tick marks */}
      {Array.from({ length: 32 }).map((_, i) => {
        const angle = (i * 360) / 32;
        const rad = (angle * Math.PI) / 180;
        const isMajor = i % 8 === 0;
        const r1 = isMajor ? 82 : 86;
        const r2 = 90;
        return (
          <line
            key={i}
            x1={100 + r1 * Math.sin(rad)}
            y1={100 - r1 * Math.cos(rad)}
            x2={100 + r2 * Math.sin(rad)}
            y2={100 - r2 * Math.cos(rad)}
            stroke={isMajor ? "var(--color-gold)" : "var(--color-border-strong)"}
            strokeWidth={isMajor ? 2 : 0.5}
          />
        );
      })}
    </svg>
  );
}

interface HeroWord {
  text: string;
  className?: string;
}

const HEADLINE_LINE1: HeroWord[] = [
  { text: "Find" },
  { text: "$4,820/mo", className: "text-[var(--color-gold)]" },
  { text: "of" },
  { text: "waste." },
];

const HEADLINE_LINE2: HeroWord[] = [
  { text: "In" },
  { text: "1.4", className: "text-[var(--color-sea)]" },
  { text: "seconds." },
];

export function LandingHero() {
  const wordsRef = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function animateWords() {
      const animeModule = await import("animejs");
      const anime = animeModule.default;
      if (cancelled) return;

      const targets = wordsRef.current.filter(Boolean);
      if (targets.length === 0) return;

      anime({
        targets,
        opacity: [0, 1],
        translateY: [30, 0],
        easing: "easeOutExpo",
        duration: 800,
        delay: anime.stagger(80),
      });
    }

    animateWords();
    return () => {
      cancelled = true;
    };
  }, []);

  const addWordRef = (el: HTMLSpanElement | null, idx: number) => {
    if (el) wordsRef.current[idx] = el;
  };

  let wordIndex = 0;

  return (
    <section
      className={cn(
        "relative min-h-screen flex flex-col overflow-hidden",
        "bg-grid"
      )}
      aria-labelledby="hero-heading"
    >
      {/* Radial glow behind the 3D scene */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 75% 50%, rgba(228,182,107,0.07) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 25% 60%, rgba(91,210,199,0.04) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      {/* ── Nav bar ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2.5">
          <Anchor className="w-5 h-5 text-[var(--color-gold)]" aria-hidden="true" />
          <span className="font-semibold tracking-tight text-[var(--color-text)]">
            QUARTERMASTER
          </span>
          <span className="ml-2 hidden sm:inline-flex items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-dim)]">
            Enterprise Sec &amp; Compliance
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5 px-3 py-1 text-xs text-[var(--color-gold)]">
            Track 1 · Pirates of the Coral-bean · Coral + Claude
          </span>
          <Link
            href="/cockpit"
            className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-gold)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-gold-hover)]"
          >
            Enter Cockpit
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </nav>

      {/* ── Main content grid ── */}
      <div className="relative z-10 flex flex-1 flex-col md:flex-row items-center">
        {/* Left: copy */}
        <div className="flex flex-1 flex-col justify-center px-6 pt-8 pb-12 md:px-12 md:pt-0 md:pb-0 max-w-2xl">
          {/* Badge */}
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-lime)] animate-breath" aria-hidden="true" />
            <span className="text-xs text-[var(--color-text-muted)]">
              Track 1 · Pirates of the Coral-bean
            </span>
          </div>

          {/* Headline */}
          <h1 id="hero-heading" className="mb-4 leading-[1.05]">
            {/* Line 1 */}
            <span className="block text-[clamp(2.8rem,6vw,5rem)] font-light">
              {HEADLINE_LINE1.map((w) => {
                const idx = wordIndex++;
                return (
                  <span
                    key={idx}
                    ref={(el) => addWordRef(el, idx)}
                    className={cn("mr-[0.3em] inline-block", w.className)}
                    style={{ opacity: 0 }}
                  >
                    {w.text}
                  </span>
                );
              })}
            </span>
            {/* Line 2 */}
            <span
              className="block text-[clamp(2.8rem,6vw,5rem)] font-light"
              style={{
                background:
                  "linear-gradient(180deg, var(--color-text) 0%, rgba(232,238,247,0.45) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {HEADLINE_LINE2.map((w) => {
                const idx = wordIndex++;
                return (
                  <span
                    key={idx}
                    ref={(el) => addWordRef(el, idx)}
                    className={cn("mr-[0.3em] inline-block")}
                    style={{
                      opacity: 0,
                      WebkitTextFillColor: w.className ? undefined : "inherit",
                      color: w.className ? undefined : "inherit",
                    }}
                  >
                    {w.text}
                  </span>
                );
              })}
            </span>
          </h1>

          <p className="mb-8 max-w-md text-[clamp(1rem,1.5vw,1.125rem)] leading-relaxed text-[var(--color-text-muted)]">
            One SQL query. Five federated sources.{" "}
            <span className="text-[var(--color-text)]">
              Nothing left your laptop.
            </span>{" "}
            PII stays local.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/cockpit"
              className="group flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-gold)] px-6 py-3 text-sm font-semibold text-[var(--color-bg)] transition-all hover:bg-[var(--color-gold-hover)] hover:shadow-[0_0_24px_rgba(228,182,107,0.35)]"
            >
              Enter the Cockpit
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <a
              href="#audits"
              className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-6 py-3 text-sm font-medium text-[var(--color-text-muted)] transition-all hover:border-[var(--color-gold)]/50 hover:text-[var(--color-text)]"
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              Watch the Demo
            </a>
          </div>
        </div>

        {/* Right: 3D Three.js compass */}
        <div className="relative flex-1 w-full md:w-auto min-h-[380px] md:min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0" aria-hidden="true">
            <CompassThree />
          </div>

          {/* Vignette overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                "linear-gradient(to right, var(--color-bg) 0%, transparent 25%), linear-gradient(to top, var(--color-bg) 0%, transparent 20%)",
            }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* ── Bottom stat strip ── */}
      <div className="relative z-20 border-t border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-around gap-4 px-6 py-3 text-center flex-wrap">
          {[
            { value: "7", label: "zombie accounts" },
            { value: "$4,820/mo", label: "waste surfaced" },
            { value: "1.4s", label: "query execution" },
            { value: "5", label: "sources federated" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-[var(--color-gold)]">
                {s.value}
              </span>
              <span className="text-xs text-[var(--color-text-dim)]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

