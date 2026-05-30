"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { ChevronRight, Anchor } from "lucide-react";

const DEMO_COMMAND = "QM_FIXTURES=on pnpm demo";

export function LandingCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    async function animate() {
      const animeModule = await import("animejs");
      const anime = animeModule.default;
      if (cancelled || !headlineRef.current) return;

      anime({
        targets: headlineRef.current,
        opacity: [0, 1],
        translateY: [24, 0],
        easing: "easeOutExpo",
        duration: 900,
      });
    }

    animate();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  function handleCopy() {
    navigator.clipboard.writeText(DEMO_COMMAND).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section
      ref={sectionRef}
      aria-labelledby="cta-heading"
      className={cn(
        "relative overflow-hidden py-28 md:py-40",
        "bg-[var(--color-surface)] border-t border-[var(--color-border)]"
      )}
    >
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(228,182,107,0.08) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-grid opacity-40" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        {/* Anchor icon */}
        <div className="mb-6 flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/10">
            <Anchor className="h-6 w-6 text-[var(--color-gold)]" aria-hidden="true" />
          </span>
        </div>

        <h2
          id="cta-heading"
          ref={headlineRef}
          className="mb-4 text-[clamp(2rem,5vw,3.5rem)] font-light leading-[1.1]"
          style={{
            opacity: 0,
            background:
              "linear-gradient(180deg, var(--color-text) 0%, rgba(232,238,247,0.5) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          The audit is waiting.
        </h2>

        <p className="mb-8 text-[clamp(1rem,1.5vw,1.125rem)] text-[var(--color-text-muted)] leading-relaxed">
          Everything runs on your machine.{" "}
          <span className="text-[var(--color-text)]">PII never leaves.</span>{" "}
          One command.
        </p>

        {/* Terminal block */}
        <div className="mb-8 mx-auto max-w-md">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-code-bg)] overflow-hidden">
            <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-coral)]/60" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-gold)]/60" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-lime)]/60" aria-hidden="true" />
              <span className="ml-3 text-xs text-[var(--color-text-dim)]">bash</span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-4">
              <code className="font-mono text-sm text-[var(--color-sea)]">
                <span className="text-[var(--color-text-dim)] mr-2">$</span>
                {DEMO_COMMAND}
              </code>
              <button
                onClick={handleCopy}
                className={cn(
                  "shrink-0 rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium transition-all",
                  copied
                    ? "border-[var(--color-lime)]/50 bg-[var(--color-lime)]/10 text-[var(--color-lime)]"
                    : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-muted)]"
                )}
                aria-label="Copy command to clipboard"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <Link
          href="/cockpit"
          className="group inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-gold)] px-8 py-3.5 text-base font-semibold text-[var(--color-bg)] transition-all hover:bg-[var(--color-gold-hover)] hover:shadow-[0_0_32px_rgba(228,182,107,0.4)]"
        >
          Enter the Cockpit
          <ChevronRight
            className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>

        {/* Secondary links */}
        <p className="mt-6 text-sm text-[var(--color-text-dim)]">
          Or explore the{" "}
          <Link
            href="/schema"
            className="text-[var(--color-text-muted)] underline decoration-[var(--color-border)] underline-offset-4 hover:text-[var(--color-text)] hover:decoration-[var(--color-sea)]"
          >
            Schema Graph
          </Link>
          {" / "}
          <Link
            href="/copilot"
            className="text-[var(--color-text-muted)] underline decoration-[var(--color-border)] underline-offset-4 hover:text-[var(--color-text)] hover:decoration-[var(--color-sea)]"
          >
            Copilot
          </Link>
          {" / "}
          <Link
            href="/ledger"
            className="text-[var(--color-text-muted)] underline decoration-[var(--color-border)] underline-offset-4 hover:text-[var(--color-text)] hover:decoration-[var(--color-sea)]"
          >
            Ledger
          </Link>
        </p>

        {/* Badges */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {[
            { label: "Local-first", color: "var(--color-sea)" },
            { label: "Read-only by design", color: "var(--color-lime)" },
            { label: "PII never leaves", color: "var(--color-gold)" },
            { label: "Open SQL", color: "var(--color-text-muted)" },
          ].map((badge) => (
            <span
              key={badge.label}
              className="rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs font-medium"
              style={{ color: badge.color }}
            >
              {badge.label}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-16 border-t border-[var(--color-border)] pt-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Anchor className="h-4 w-4 text-[var(--color-gold)]" aria-hidden="true" />
            <span className="text-sm font-medium text-[var(--color-text-muted)]">
              Quartermaster
            </span>
          </div>
          <span className="text-xs text-[var(--color-text-dim)]">
            Pirates of the Coral-bean Hackathon · Track 1 · Coral + Claude
          </span>
        </div>
      </footer>
    </section>
  );
}
