"use client";

/**
 * LiveFeed — animated stack of Findings surfaced by Continuous Mode.
 *
 * Vercel deployment feed style: monochrome rows, severity badges with
 * semantic color only, items animate in from top.
 */

import { AnimatePresence, motion } from "framer-motion";
import type { Finding, Severity } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { ClockTime } from "./Time";

export interface LiveFeedProps {
  items: Finding[];
  isLive: boolean;
}

/** Severity badge class — semantic color fill only */
const SEVERITY_TAG: Record<Severity, string> = {
  P0: "bg-[var(--color-coral)]/15 text-[var(--color-coral)]",
  P1: "bg-[var(--color-gold)]/10 text-[var(--color-gold)]",
  P2: "bg-transparent text-[var(--color-text-dim)]",
};

/** Truncate the rationale to ~40 chars so the row stays single-line. */
function snippet(text: string, max = 40): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

/** Tiny compass-rose SVG for empty state. */
function CompassRose() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-10 w-10 text-[var(--color-text-dim)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="32" cy="32" r="26" />
      <circle cx="32" cy="32" r="3" fill="currentColor" stroke="none" />
      <path d="M32 6 L36 32 L32 58 L28 32 Z" />
      <path d="M6 32 L32 28 L58 32 L32 36 Z" />
      <path d="M14 14 L30 30 M50 50 L34 34 M50 14 L34 30 M14 50 L30 34" />
    </svg>
  );
}

export function LiveFeed({ items, isLive }: LiveFeedProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-card)]/40 py-12">
        <CompassRose />
        <p className="text-[13px] text-[var(--color-text-muted)]">
          All clear.{" "}
          <span className="text-[var(--color-gold)]">Run an audit ↗</span>
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isLive
                ? "animate-breath bg-[var(--color-lime)]"
                : "bg-[var(--color-text-dim)]"
            )}
          />
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
            LIVE FEED
          </span>
        </div>
        <span className="rounded-full bg-[var(--color-card)] px-2 py-0.5 font-mono text-[11px] text-[var(--color-text-dim)]">
          {items.length}
        </span>
      </div>

      {/* Feed rows */}
      <ul>
        <AnimatePresence initial={false}>
          {items.map((f) => (
            <motion.li
              key={f.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 border-b border-[var(--color-border)]/50 px-4 py-2.5 transition-colors last:border-b-0 hover:bg-[var(--color-card)]/40"
            >
              {/* Severity badge */}
              <span
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold",
                  SEVERITY_TAG[f.severity]
                )}
              >
                {f.severity}
              </span>

              {/* Target name + rationale */}
              <div className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="shrink-0 text-[13px] font-medium text-[var(--color-text)]">
                  {f.targetName}
                </span>
                <span className="hidden truncate text-[12px] text-[var(--color-text-muted)] md:inline">
                  {snippet(f.rationale)}
                </span>
              </div>

              {/* Timestamp */}
              <span className="ml-auto shrink-0 font-mono text-[11px] text-[var(--color-text-dim)]">
                <ClockTime iso={f.detectedIso} />
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
