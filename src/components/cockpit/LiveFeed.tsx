"use client";

/**
 * LiveFeed — animated stack of Findings surfaced by Continuous Mode.
 *
 * Each row has a severity tag (P0 coral filled, P1 gold outlined,
 * P2 muted), a target name, a short rationale snippet and a mono
 * timestamp. New items animate in from the top.
 */

import { AnimatePresence, motion } from "framer-motion";
import type { Finding, Severity } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export interface LiveFeedProps {
  items: Finding[];
  isLive: boolean;
}

/** Visual variant per severity. */
const SEVERITY_TAG: Record<Severity, string> = {
  P0: "bg-[var(--color-coral)] text-[var(--color-bg)] border-transparent",
  P1: "bg-transparent text-[var(--color-gold)] border-[var(--color-gold)]",
  P2: "bg-transparent text-[var(--color-text-muted)] border-[var(--color-border-strong)]",
};

/** Render an ISO timestamp as HH:MM in the local tz (e.g. 14:02). */
function formatClock(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

/** Truncate the rationale to ~30 chars so the row stays single-line. */
function snippet(text: string, max = 30): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

/** Tiny inline compass-rose — used for the empty state. */
function CompassRose() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-12 w-12 text-[var(--color-text-dim)]"
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
      <div className="flex flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)]/40 py-12">
        <CompassRose />
        <p className="text-[13px] text-[var(--color-text-muted)]">
          All clear. Run an audit{" "}
          <span className="text-[var(--color-gold)]">↗</span>
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)]">
      {/* Live indicator strip */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
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
            {isLive ? "Streaming" : "Paused"} · {items.length} findings
          </span>
        </div>
        <span className="font-mono text-[11px] text-[var(--color-text-dim)]">
          Continuous Mode
        </span>
      </div>

      <ul className="divide-y divide-[var(--color-border)]">
        <AnimatePresence initial={false}>
          {items.map((f) => (
            <motion.li
              key={f.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--color-card-hover)]"
            >
              <span
                className={cn(
                  "inline-flex h-5 min-w-[28px] items-center justify-center rounded-[4px] border px-1.5 font-mono text-[10px] font-semibold",
                  SEVERITY_TAG[f.severity]
                )}
              >
                {f.severity}
              </span>
              <div className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="truncate text-[14px] text-[var(--color-text)]">
                  {f.targetName}
                </span>
                <span className="hidden truncate text-[12px] text-[var(--color-text-muted)] md:inline">
                  — {snippet(f.rationale)}
                </span>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-[var(--color-text-dim)]">
                {formatClock(f.detectedIso)}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
